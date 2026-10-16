// start-section-1
import { AnonCredsModule } from '@credo-ts/anoncreds'
import {
  AnonCredsDidCommCredentialFormatService,
  AnonCredsDidCommProofFormatService,
  LegacyIndyDidCommCredentialFormatService,
  LegacyIndyDidCommProofFormatService,
} from '@credo-ts/anoncreds/didcomm'
import { AskarModule } from '@credo-ts/askar'
import { CheqdDidRegistrar, CheqdDidResolver, CheqdModule } from '@credo-ts/cheqd'
import { CheqdAnonCredsRegistry } from '@credo-ts/cheqd/anoncreds'
import { Agent, DidsModule } from '@credo-ts/core'
import {
  DidCommAutoAcceptCredential,
  DidCommAutoAcceptProof,
  DidCommCredentialEventTypes,
  DidCommCredentialState,
  type DidCommCredentialStateChangedEvent,
  DidCommCredentialV2Protocol,
  DidCommHttpOutboundTransport,
  DidCommModule,
  DidCommProofEventTypes,
  DidCommProofState,
  type DidCommProofStateChangedEvent,
  DidCommProofV2Protocol,
} from '@credo-ts/didcomm'
import { agentDependencies, DidCommHttpInboundTransport } from '@credo-ts/node'
import { NativeAnoncreds } from '@hyperledger/anoncreds-nodejs'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

function createAgent(name: string, port: number) {
  return new Agent({
    dependencies: agentDependencies,
    modules: {
      // Use a strong secret as the store key in production
      askar: new AskarModule({ askar: NativeAskar, store: { id: name, key: `${name}-key` } }),
      // The registry and its DID module, see the AnonCreds page
      cheqd: new CheqdModule({ networks: [{ network: 'testnet', cosmosPayerSeed: '<cosmos payer seed>' }] }),
      dids: new DidsModule({ registrars: [new CheqdDidRegistrar()], resolvers: [new CheqdDidResolver()] }),
      anoncreds: new AnonCredsModule({ anoncreds: NativeAnoncreds, registries: [new CheqdAnonCredsRegistry()] }),
      didcomm: new DidCommModule({
        endpoints: [`http://localhost:${port}`],
        transports: {
          inbound: [new DidCommHttpInboundTransport({ port })],
          outbound: [new DidCommHttpOutboundTransport()],
        },
        connections: { autoAcceptConnections: true },
        credentials: {
          autoAcceptCredentials: DidCommAutoAcceptCredential.ContentApproved,
          credentialProtocols: [
            new DidCommCredentialV2Protocol({
              credentialFormats: [
                new AnonCredsDidCommCredentialFormatService(),
                new LegacyIndyDidCommCredentialFormatService(),
              ],
            }),
          ],
        },
        proofs: {
          autoAcceptProofs: DidCommAutoAcceptProof.ContentApproved,
          proofProtocols: [
            new DidCommProofV2Protocol({
              proofFormats: [new AnonCredsDidCommProofFormatService(), new LegacyIndyDidCommProofFormatService()],
            }),
          ],
        },
      }),
    },
  })
}
// end-section-1

const issuer = createAgent('didcomm-anoncreds-issuer', 4056)
const holder = createAgent('didcomm-anoncreds-holder', 4057)
await issuer.initialize()
await holder.initialize()

// Registered as described on the AnonCreds page
const credentialDefinitionId = '<credential definition id>'
const revocableCredentialDefinitionId = '<revocable credential definition id>'
const revocationRegistryDefinitionId = '<revocation registry definition id>'

const outOfBandRecord = await issuer.didcomm.oob.createInvitation({ label: 'Issuer' })
const { connectionRecord } = await holder.didcomm.oob.receiveInvitation(outOfBandRecord.outOfBandInvitation, {
  label: 'Holder',
})
if (!connectionRecord) throw new Error('No connection created')
await holder.didcomm.connections.returnWhenIsConnected(connectionRecord.id)
const [issuerConnection] = await issuer.didcomm.connections.findAllByOutOfBandId(outOfBandRecord.id)
const connectionId = (await issuer.didcomm.connections.returnWhenIsConnected(issuerConnection.id)).id

// start-section-3
holder.events.on<DidCommCredentialStateChangedEvent>(
  DidCommCredentialEventTypes.DidCommCredentialStateChanged,
  async ({ payload: { credentialExchangeRecord } }) => {
    if (credentialExchangeRecord.state !== DidCommCredentialState.OfferReceived) return

    // The attribute names and values to show to the user
    console.log(credentialExchangeRecord.credentialAttributes)

    // Uses the default link secret, and creates it if there is none yet
    await holder.didcomm.credentials.acceptOffer({ credentialExchangeRecordId: credentialExchangeRecord.id })
  }
)
// end-section-3

// start-section-2
await issuer.didcomm.credentials.offerCredential({
  connectionId,
  protocolVersion: 'v2',
  credentialFormats: {
    anoncreds: {
      credentialDefinitionId,
      // Values are strings, also for numbers you want to use in predicates
      attributes: [
        { name: 'name', value: 'Jane Doe' },
        { name: 'role', value: 'Developer' },
        { name: 'age', value: '32' },
      ],
    },
  },
})
// end-section-2

// start-section-5
holder.events.on<DidCommProofStateChangedEvent>(
  DidCommProofEventTypes.ProofStateChanged,
  async ({ payload: { proofRecord } }) => {
    if (proofRecord.state !== DidCommProofState.RequestReceived) return

    // Lists all matching credentials per attribute and predicate, to let the user choose
    const { proofFormats: options } = await holder.didcomm.proofs.getCredentialsForRequest({
      proofExchangeRecordId: proofRecord.id,
    })
    console.log(options.anoncreds?.attributes)

    // Or let Credo pick the first match for each
    const { proofFormats } = await holder.didcomm.proofs.selectCredentialsForRequest({
      proofExchangeRecordId: proofRecord.id,
    })
    await holder.didcomm.proofs.acceptRequest({ proofExchangeRecordId: proofRecord.id, proofFormats })
  }
)
// end-section-5

// start-section-6
issuer.events.on<DidCommProofStateChangedEvent>(
  DidCommProofEventTypes.ProofStateChanged,
  async ({ payload: { proofRecord } }) => {
    if (proofRecord.state !== DidCommProofState.PresentationReceived) return

    // Only valid presentations reach this state, so `proofRecord.isVerified` is true
    const { presentation } = await issuer.didcomm.proofs.getFormatData(proofRecord.id)
    const revealedAttributes = presentation?.anoncreds?.requested_proof.revealed_attrs ?? {}
    for (const [referent, { raw }] of Object.entries(revealedAttributes)) {
      console.log(referent, raw)
    }
  }
)
// end-section-6

// start-section-4
await issuer.didcomm.proofs.requestProof({
  connectionId,
  protocolVersion: 'v2',
  proofFormats: {
    anoncreds: {
      name: 'Employee check',
      version: '1.0',
      requested_attributes: {
        name: { name: 'name', restrictions: [{ cred_def_id: credentialDefinitionId }] },
        role: { name: 'role', restrictions: [{ cred_def_id: credentialDefinitionId }] },
      },
      requested_predicates: {
        // Proves age >= 18 without revealing the age
        adult: { name: 'age', p_type: '>=', p_value: 18, restrictions: [{ cred_def_id: credentialDefinitionId }] },
      },
    },
  },
})
// end-section-4

// start-section-7
await issuer.didcomm.credentials.offerCredential({
  connectionId,
  protocolVersion: 'v2',
  credentialFormats: {
    anoncreds: {
      credentialDefinitionId: revocableCredentialDefinitionId,
      attributes: [
        { name: 'name', value: 'Jane Doe' },
        { name: 'role', value: 'Developer' },
        { name: 'age', value: '32' },
      ],
      revocationRegistryDefinitionId,
      // Track which indexes you used, each credential needs its own
      revocationRegistryIndex: 1,
    },
  },
})
// end-section-7

// start-section-8
// After revoking index 1 with updateRevocationStatusList, optionally notify the holder
await issuer.didcomm.credentials.sendRevocationNotification({
  connectionId,
  revocationFormat: 'anoncreds',
  revocationId: `${revocationRegistryDefinitionId}::1`,
})
// end-section-8

// start-section-9
await issuer.didcomm.proofs.requestProof({
  connectionId,
  protocolVersion: 'v2',
  proofFormats: {
    anoncreds: {
      name: 'Employee check',
      version: '1.0',
      // Require a proof that the credential was not revoked at this time (seconds)
      non_revoked: { to: Math.floor(Date.now() / 1000) },
      requested_attributes: {
        name: { name: 'name', restrictions: [{ cred_def_id: revocableCredentialDefinitionId }] },
      },
    },
  },
})
// end-section-9

await holder.shutdown()
await issuer.shutdown()
