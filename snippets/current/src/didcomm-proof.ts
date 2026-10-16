// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent, type KeyDidCreateOptions, w3cDate } from '@credo-ts/core'
import {
  DidCommAutoAcceptCredential,
  DidCommCredentialEventTypes,
  DidCommCredentialState,
  type DidCommCredentialStateChangedEvent,
  DidCommCredentialV2Protocol,
  DidCommDifPresentationExchangeProofFormatService,
  DidCommHttpOutboundTransport,
  DidCommJsonLdCredentialFormatService,
  DidCommModule,
  DidCommProofEventTypes,
  DidCommProofState,
  type DidCommProofStateChangedEvent,
  DidCommProofV2Protocol,
} from '@credo-ts/didcomm'
import { agentDependencies, DidCommHttpInboundTransport } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

function createAgent(name: string, port: number) {
  return new Agent({
    dependencies: agentDependencies,
    modules: {
      // Use a strong secret as the store key in production
      askar: new AskarModule({ askar: NativeAskar, store: { id: name, key: `${name}-key` } }),
      didcomm: new DidCommModule({
        endpoints: [`http://localhost:${port}`],
        transports: {
          inbound: [new DidCommHttpInboundTransport({ port })],
          outbound: [new DidCommHttpOutboundTransport()],
        },
        connections: { autoAcceptConnections: true },
        credentials: {
          credentialProtocols: [
            new DidCommCredentialV2Protocol({ credentialFormats: [new DidCommJsonLdCredentialFormatService()] }),
          ],
        },
        proofs: {
          proofProtocols: [
            new DidCommProofV2Protocol({
              proofFormats: [new DidCommDifPresentationExchangeProofFormatService()],
            }),
          ],
        },
      }),
    },
  })
}
// end-section-1

// The verifier also issues the credential, to keep the example to two agents
const verifier = createAgent('didcomm-proof-verifier', 4052)
const holder = createAgent('didcomm-proof-holder', 4053)
await verifier.initialize()
await holder.initialize()

async function createDidKey(agent: typeof verifier) {
  const { didState } = await agent.dids.create<KeyDidCreateOptions>({
    method: 'key',
    options: { createKey: { type: { kty: 'OKP', crv: 'Ed25519' } } },
  })
  if (didState.state !== 'finished') throw new Error(`Creating did:key failed: ${JSON.stringify(didState)}`)
  return didState.did
}

const issuerDid = await createDidKey(verifier)
const holderDid = await createDidKey(holder)

const outOfBandRecord = await verifier.didcomm.oob.createInvitation({ label: 'Verifier' })
const { connectionRecord } = await holder.didcomm.oob.receiveInvitation(outOfBandRecord.outOfBandInvitation, {
  label: 'Holder',
})
if (!connectionRecord) throw new Error('No connection created')
await holder.didcomm.connections.returnWhenIsConnected(connectionRecord.id)
const [verifierConnection] = await verifier.didcomm.connections.findAllByOutOfBandId(outOfBandRecord.id)
const connectionId = (await verifier.didcomm.connections.returnWhenIsConnected(verifierConnection.id)).id

// Issue a JSON-LD credential to the holder first
const credentialStored = new Promise<void>((resolve) => {
  holder.events.on<DidCommCredentialStateChangedEvent>(
    DidCommCredentialEventTypes.DidCommCredentialStateChanged,
    async ({ payload: { credentialExchangeRecord } }) => {
      if (credentialExchangeRecord.state === DidCommCredentialState.OfferReceived) {
        await holder.didcomm.credentials.acceptOffer({
          credentialExchangeRecordId: credentialExchangeRecord.id,
          autoAcceptCredential: DidCommAutoAcceptCredential.Always,
        })
      }
      if (credentialExchangeRecord.state === DidCommCredentialState.Done) resolve()
    }
  )
})
await verifier.didcomm.credentials.offerCredential({
  connectionId,
  protocolVersion: 'v2',
  autoAcceptCredential: DidCommAutoAcceptCredential.Always,
  credentialFormats: {
    jsonld: {
      credential: {
        '@context': ['https://www.w3.org/2018/credentials/v1', 'https://purl.imsglobal.org/spec/ob/v3p0/context.json'],
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuer: issuerDid,
        issuanceDate: w3cDate(),
        credentialSubject: {
          id: holderDid,
          type: ['AchievementSubject'],
          achievement: {
            id: 'https://example.com/achievements/credo-docs',
            type: ['Achievement'],
            name: 'Read the Credo docs',
          },
        },
      },
      options: { proofType: 'Ed25519Signature2018', proofPurpose: 'assertionMethod' },
    },
  },
})
await credentialStored

// start-section-3
holder.events.on<DidCommProofStateChangedEvent>(
  DidCommProofEventTypes.ProofStateChanged,
  async ({ payload: { proofRecord } }) => {
    if (proofRecord.state !== DidCommProofState.RequestReceived) return

    // Picks the first matching credential for every requested item
    const { proofFormats } = await holder.didcomm.proofs.selectCredentialsForRequest({
      proofExchangeRecordId: proofRecord.id,
    })

    await holder.didcomm.proofs.acceptRequest({ proofExchangeRecordId: proofRecord.id, proofFormats })
  }
)
// end-section-3

// start-section-4
verifier.events.on<DidCommProofStateChangedEvent>(
  DidCommProofEventTypes.ProofStateChanged,
  async ({ payload: { proofRecord } }) => {
    if (proofRecord.state === DidCommProofState.PresentationReceived) {
      // Only valid presentations reach this state, so `proofRecord.isVerified` is true
      const { presentation } = await verifier.didcomm.proofs.getFormatData(proofRecord.id)
      console.log('Verified presentation', JSON.stringify(presentation?.presentationExchange))

      // Sends the ack and completes the exchange
      await verifier.didcomm.proofs.acceptPresentation({ proofExchangeRecordId: proofRecord.id })
    }

    if (proofRecord.state === DidCommProofState.Abandoned) {
      console.log('Verification failed', proofRecord.errorMessage)
    }
  }
)
// end-section-4

// The holder reaches `Done` when it receives the verifier's ack
const proofDone = new Promise<void>((resolve, reject) => {
  holder.events.on<DidCommProofStateChangedEvent>(DidCommProofEventTypes.ProofStateChanged, ({ payload }) => {
    if (payload.proofRecord.state === DidCommProofState.Done) resolve()
  })
  verifier.events.on<DidCommProofStateChangedEvent>(DidCommProofEventTypes.ProofStateChanged, ({ payload }) => {
    if (payload.proofRecord.state === DidCommProofState.Abandoned) reject(new Error(payload.proofRecord.errorMessage))
  })
})

// start-section-2
await verifier.didcomm.proofs.requestProof({
  connectionId,
  protocolVersion: 'v2',
  proofFormats: {
    presentationExchange: {
      presentationDefinition: {
        id: 'credo-docs-badge',
        input_descriptors: [
          {
            id: 'open-badge',
            schema: [{ uri: 'https://purl.imsglobal.org/spec/ob/v3p0/context.json' }],
            constraints: {
              fields: [
                {
                  path: ['$.credentialSubject.achievement.name'],
                  filter: { type: 'string', const: 'Read the Credo docs' },
                },
              ],
            },
          },
        ],
      },
    },
  },
})
// end-section-2

await proofDone
console.log('Proof done')

await holder.shutdown()
await verifier.shutdown()
