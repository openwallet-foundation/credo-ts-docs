// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent, DidKey, type KeyDidCreateOptions, w3cDate } from '@credo-ts/core'
import {
  DidCommAutoAcceptCredential,
  DidCommCredentialEventTypes,
  DidCommCredentialState,
  type DidCommCredentialStateChangedEvent,
  DidCommCredentialV2Protocol,
  DidCommDataIntegrityCredentialFormatService,
  DidCommHttpOutboundTransport,
  DidCommJsonLdCredentialFormatService,
  DidCommModule,
  DidCommW3cV2SdJwtCredentialFormatService,
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
          autoAcceptCredentials: DidCommAutoAcceptCredential.ContentApproved,
          credentialProtocols: [
            new DidCommCredentialV2Protocol({
              credentialFormats: [
                new DidCommJsonLdCredentialFormatService(),
                new DidCommDataIntegrityCredentialFormatService(),
                new DidCommW3cV2SdJwtCredentialFormatService(),
              ],
            }),
          ],
        },
      }),
    },
  })
}
// end-section-1

const issuer = createAgent('didcomm-w3c-issuer', 4054)
const holder = createAgent('didcomm-w3c-holder', 4055)
await issuer.initialize()
await holder.initialize()

// start-section-6
const { didState } = await issuer.dids.create<KeyDidCreateOptions>({
  method: 'key',
  options: { createKey: { type: { kty: 'OKP', crv: 'Ed25519' } } },
})
if (didState.state !== 'finished') throw new Error('Creating the issuer DID failed')
const issuerDid = didState.did
// end-section-6

const holderDidResult = await holder.dids.create<KeyDidCreateOptions>({
  method: 'key',
  options: { createKey: { type: { kty: 'OKP', crv: 'Ed25519' } } },
})
if (holderDidResult.didState.state !== 'finished') throw new Error('Creating the holder DID failed')
const holderDid = holderDidResult.didState.did
const holderKid = `${holderDid}#${DidKey.fromDid(holderDid).publicJwk.fingerprint}`

const outOfBandRecord = await issuer.didcomm.oob.createInvitation({ label: 'Issuer' })
const { connectionRecord } = await holder.didcomm.oob.receiveInvitation(outOfBandRecord.outOfBandInvitation, {
  label: 'Holder',
})
if (!connectionRecord) throw new Error('No connection created')
await holder.didcomm.connections.returnWhenIsConnected(connectionRecord.id)
const [issuerConnection] = await issuer.didcomm.connections.findAllByOutOfBandId(outOfBandRecord.id)
const connectionId = (await issuer.didcomm.connections.returnWhenIsConnected(issuerConnection.id)).id

holder.events.on<DidCommCredentialStateChangedEvent>(
  DidCommCredentialEventTypes.DidCommCredentialStateChanged,
  async ({ payload: { credentialExchangeRecord } }) => {
    if (credentialExchangeRecord.state === DidCommCredentialState.OfferReceived) {
      const { offer } = await holder.didcomm.credentials.getFormatData(credentialExchangeRecord.id)

      if (offer?.w3cV2SdJwt) {
        // start-section-4
        await holder.didcomm.credentials.acceptOffer({
          credentialExchangeRecordId: credentialExchangeRecord.id,
          credentialFormats: {
            // Signs the issuer's nonce with this key, the issuer binds the credential to it
            w3cV2SdJwt: { didCommSignedAttachment: { kid: holderKid } },
          },
        })
        // end-section-4
      } else {
        await holder.didcomm.credentials.acceptOffer({ credentialExchangeRecordId: credentialExchangeRecord.id })
      }
    }
  }
)

function waitForIssuerDone() {
  return new Promise<void>((resolve, reject) => {
    const listener = ({ payload: { credentialExchangeRecord } }: DidCommCredentialStateChangedEvent) => {
      if (credentialExchangeRecord.state === DidCommCredentialState.Done) {
        issuer.events.off(DidCommCredentialEventTypes.DidCommCredentialStateChanged, listener)
        resolve()
      }
      if (credentialExchangeRecord.state === DidCommCredentialState.Abandoned) {
        reject(new Error(credentialExchangeRecord.errorMessage))
      }
    }
    issuer.events.on(DidCommCredentialEventTypes.DidCommCredentialStateChanged, listener)
  })
}

let issuerDone = waitForIssuerDone()

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
      // did:key Ed25519 keys are Ed25519VerificationKey2018 verification methods
      options: { proofType: 'Ed25519Signature2018', proofPurpose: 'assertionMethod' },
    },
  },
})
// end-section-2

await issuerDone
issuerDone = waitForIssuerDone()

// start-section-3
await issuer.didcomm.credentials.offerCredential({
  connectionId,
  protocolVersion: 'v2',
  credentialFormats: {
    w3cV2SdJwt: {
      credential: {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        type: ['VerifiableCredential', 'EmployeeCredential'],
        issuer: issuerDid,
        validFrom: w3cDate(),
        credentialSubject: { name: 'Jane Doe', role: 'Developer' },
      },
      disclosureFrame: { credentialSubject: { _sd: ['name', 'role'] } },
      // The holder proves control of a DID, which becomes the credential subject and `cnf`
      bindingRequired: true,
      didCommSignedAttachmentBinding: {},
    },
  },
})
// end-section-3

await issuerDone
issuerDone = waitForIssuerDone()

// start-section-5
await issuer.didcomm.credentials.offerCredential({
  connectionId,
  protocolVersion: 'v2',
  credentialFormats: {
    dataIntegrity: {
      credential: {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        type: ['VerifiableCredential', 'EmployeeCredential'],
        issuer: issuerDid,
        validFrom: w3cDate(),
        credentialSubject: { id: holderDid, name: 'Jane Doe', role: 'Developer' },
      },
      bindingRequired: false,
    },
  },
})
// end-section-5

await issuerDone

const w3cV2Records = await holder.w3cV2Credentials.getAll()
console.log(
  'W3C VCDM 2.0 records',
  w3cV2Records.map((record) => record.firstCredential.claimFormat)
)
const w3cRecords = await holder.w3cCredentials.getAll()
console.log(
  'W3C VCDM 1.1 records',
  w3cRecords.map((record) => record.firstCredential.claimFormat)
)

await holder.shutdown()
await issuer.shutdown()
