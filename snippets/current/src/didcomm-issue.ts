import { didcommBundle } from '@credo-ts/drizzle-storage/didcomm'
import { exampleStorageWithAskarKeys } from './example-storage.js'

type ExampleStorage = Awaited<ReturnType<typeof exampleStorageWithAskarKeys>>

// start-section-1
import { Agent, type KeyDidCreateOptions, w3cDate } from '@credo-ts/core'
import {
  DidCommAutoAcceptCredential,
  DidCommCredentialEventTypes,
  DidCommCredentialState,
  type DidCommCredentialStateChangedEvent,
  DidCommCredentialV2Protocol,
  DidCommHttpOutboundTransport,
  DidCommJsonLdCredentialFormatService,
  DidCommModule,
} from '@credo-ts/didcomm'
import { agentDependencies, DidCommHttpInboundTransport } from '@credo-ts/node'

function createAgent(port: number, storage: ExampleStorage) {
  return new Agent({
    dependencies: agentDependencies,
    modules: {
      ...storage, // Storage and key management, see Agent setup
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
              credentialFormats: [new DidCommJsonLdCredentialFormatService()],
            }),
          ],
        },
      }),
    },
  })
}
// end-section-1

const issuer = createAgent(4050, await exampleStorageWithAskarKeys([didcommBundle]))
const holder = createAgent(4051, await exampleStorageWithAskarKeys([didcommBundle]))
await issuer.initialize()
await holder.initialize()

async function createDidKey(agent: typeof issuer) {
  const { didState } = await agent.dids.create<KeyDidCreateOptions>({
    method: 'key',
    options: { createKey: { type: { kty: 'OKP', crv: 'Ed25519' } } },
  })
  if (didState.state !== 'finished') throw new Error(`Creating did:key failed: ${JSON.stringify(didState)}`)
  return didState.did
}

const issuerDid = await createDidKey(issuer)
const holderDid = await createDidKey(holder)

const outOfBandRecord = await issuer.didcomm.oob.createInvitation({ label: 'Issuer' })
const { connectionRecord } = await holder.didcomm.oob.receiveInvitation(outOfBandRecord.outOfBandInvitation, {
  label: 'Holder',
})
if (!connectionRecord) throw new Error('No connection created')
await holder.didcomm.connections.returnWhenIsConnected(connectionRecord.id)
const [issuerConnection] = await issuer.didcomm.connections.findAllByOutOfBandId(outOfBandRecord.id)
const connectionId = (await issuer.didcomm.connections.returnWhenIsConnected(issuerConnection.id)).id

const issuerDone = new Promise<void>((resolve) => {
  issuer.events.on<DidCommCredentialStateChangedEvent>(
    DidCommCredentialEventTypes.DidCommCredentialStateChanged,
    ({ payload }) => {
      if (payload.credentialExchangeRecord.state === DidCommCredentialState.Done) resolve()
    }
  )
})

// start-section-3
async function onCredentialStateChanged({ payload: { credentialExchangeRecord } }: DidCommCredentialStateChangedEvent) {
  if (credentialExchangeRecord.state === DidCommCredentialState.OfferReceived) {
    // Show the offer to the user before accepting it
    const { offer } = await holder.didcomm.credentials.getFormatData(credentialExchangeRecord.id)
    console.log('Received offer', JSON.stringify(offer?.jsonld?.credential))

    await holder.didcomm.credentials.acceptOffer({ credentialExchangeRecordId: credentialExchangeRecord.id })
  }

  if (credentialExchangeRecord.state === DidCommCredentialState.Done) {
    const [{ credentialRecordId }] = credentialExchangeRecord.credentials
    const w3cCredentialRecord = await holder.w3cCredentials.getById(credentialRecordId)
    console.log('Stored credential', w3cCredentialRecord.firstCredential.type)
  }
}

holder.events.on(DidCommCredentialEventTypes.DidCommCredentialStateChanged, onCredentialStateChanged)
// end-section-3

// start-section-2
await issuer.didcomm.credentials.offerCredential({
  connectionId,
  protocolVersion: 'v2',
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
// end-section-2

await issuerDone

// The proposal flow below relies on auto-accept on the holder side
holder.events.off(DidCommCredentialEventTypes.DidCommCredentialStateChanged, onCredentialStateChanged)

issuer.events.on<DidCommCredentialStateChangedEvent>(
  DidCommCredentialEventTypes.DidCommCredentialStateChanged,
  async ({ payload: { credentialExchangeRecord } }) => {
    // start-section-5
    if (credentialExchangeRecord.state === DidCommCredentialState.ProposalReceived) {
      await issuer.didcomm.credentials.acceptProposal({ credentialExchangeRecordId: credentialExchangeRecord.id })
    }
    // end-section-5
  }
)

// The issuer reaches `Done` when it receives the holder's ack
const proposalDone = new Promise<void>((resolve) => {
  issuer.events.on<DidCommCredentialStateChangedEvent>(
    DidCommCredentialEventTypes.DidCommCredentialStateChanged,
    ({ payload }) => {
      if (payload.credentialExchangeRecord.state === DidCommCredentialState.Done) resolve()
    }
  )
})

// start-section-4
await holder.didcomm.credentials.proposeCredential({
  connectionId: connectionRecord.id,
  protocolVersion: 'v2',
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
// end-section-4

await proposalDone
console.log('Proposal flow done')

await holder.shutdown()
await issuer.shutdown()
