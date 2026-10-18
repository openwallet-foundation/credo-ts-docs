import { exampleStorage } from './example-storage.js'

type ExampleStorage = Awaited<ReturnType<typeof exampleStorage>>

// start-section-1
import {
  Agent,
  ClaimFormat,
  DidKey,
  defaultDocumentLoader,
  JsonTransformer,
  type KeyDidCreateOptions,
  purposes,
  utils,
  W3cCredential,
  W3cCredentialRecord,
  W3cCredentialsModule,
  W3cJsonLdVerifiablePresentation,
  w3cDate,
} from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'

const membershipContext = {
  '@context': {
    MembershipCredential: 'https://example.com/vocab#MembershipCredential',
    name: 'https://schema.org/name',
    memberSince: { '@id': 'https://example.com/vocab#memberSince', '@type': 'http://www.w3.org/2001/XMLSchema#date' },
  },
}

function createAgent(storage: ExampleStorage) {
  return new Agent({
    dependencies: agentDependencies,
    modules: {
      ...storage, // Storage and key management, see Agent setup
      // Serve your own JSON-LD contexts instead of fetching them from the network
      w3cCredentials: new W3cCredentialsModule({
        documentLoader: (agentContext) =>
          defaultDocumentLoader(agentContext, { 'https://example.com/contexts/membership/v1': membershipContext }),
      }),
    },
  })
}

async function createDidKey(agent: Agent) {
  const { didState } = await agent.dids.create<KeyDidCreateOptions>({
    method: 'key',
    options: { createKey: { type: { kty: 'OKP', crv: 'Ed25519' } } },
  })
  if (didState.state !== 'finished') throw new Error('Creating the DID failed')
  return { did: didState.did, didUrl: `${didState.did}#${DidKey.fromDid(didState.did).publicJwk.fingerprint}` }
}
// end-section-1

const issuer = createAgent(await exampleStorage())
const holder = createAgent(await exampleStorage())
const verifier = createAgent(await exampleStorage())
await issuer.initialize()
await holder.initialize()
await verifier.initialize()

// start-section-2
const issuerDid = await createDidKey(issuer)
const holderDid = await createDidKey(holder)

const credential = W3cCredential.fromJson({
  '@context': ['https://www.w3.org/2018/credentials/v1', 'https://example.com/contexts/membership/v1'],
  type: ['VerifiableCredential', 'MembershipCredential'],
  issuer: issuerDid.did,
  issuanceDate: w3cDate(Date.now()),
  // The subject id binds the credential to the holder DID
  credentialSubject: { id: holderDid.did, name: 'Jane Doe', memberSince: '2024-01-01' },
})

const jwtVc = await issuer.w3cCredentials.signCredential<ClaimFormat.JwtVc>({
  format: ClaimFormat.JwtVc,
  credential,
  alg: 'EdDSA',
  verificationMethod: issuerDid.didUrl,
})
console.log(jwtVc.serializedJwt)

const ldpVc = await issuer.w3cCredentials.signCredential<ClaimFormat.LdpVc>({
  format: ClaimFormat.LdpVc,
  credential,
  // did:key Ed25519 keys are Ed25519VerificationKey2018 verification methods
  proofType: 'Ed25519Signature2018',
  verificationMethod: issuerDid.didUrl,
})
console.log(ldpVc.toJson())
// end-section-2

// start-section-3
const jwtResult = await holder.w3cCredentials.verifyCredential({ credential: jwtVc.serializedJwt })
const ldpResult = await holder.w3cCredentials.verifyCredential({ credential: ldpVc })
if (!jwtResult.isValid || !ldpResult.isValid) throw new Error('Received an invalid credential')

await holder.w3cCredentials.store({ record: W3cCredentialRecord.fromCredential(jwtVc) })
await holder.w3cCredentials.store({ record: W3cCredentialRecord.fromCredential(ldpVc) })

// Returns credentials, not records
const memberships = await holder.w3cCredentials.findAllByQuery({
  types: ['MembershipCredential'],
  claimFormat: ClaimFormat.LdpVc,
})
console.log(memberships.length)
// end-section-3

// start-section-4
// Received from the verifier
const challenge = 'c0ffee12-3456-4789-abcd-ef0123456789'
const domain = 'https://verifier.example.com'

const jwtPresentation = await holder.w3cCredentials.createPresentation({
  credentials: [jwtVc],
  holder: holderDid.did,
})
const jwtVp = await holder.w3cCredentials.signPresentation<ClaimFormat.JwtVp>({
  format: ClaimFormat.JwtVp,
  presentation: jwtPresentation,
  alg: 'EdDSA',
  verificationMethod: holderDid.didUrl,
  challenge,
  domain,
})

const ldpPresentation = await holder.w3cCredentials.createPresentation({
  // Signing a JSON-LD presentation without an id fails
  id: `urn:uuid:${utils.uuid()}`,
  credentials: [ldpVc],
  holder: holderDid.did,
})
const ldpVp = await holder.w3cCredentials.signPresentation<ClaimFormat.LdpVp>({
  format: ClaimFormat.LdpVp,
  presentation: ldpPresentation,
  proofType: 'Ed25519Signature2018',
  proofPurpose: new purposes.AuthenticationProofPurpose({ challenge, domain }),
  verificationMethod: holderDid.didUrl,
  challenge,
  domain,
})
// end-section-4

// start-section-5
const jwtVpResult = await verifier.w3cCredentials.verifyPresentation({
  presentation: jwtVp.serializedJwt,
  challenge,
  domain,
  trustedIssuers: [{ method: 'did', issuance: issuerDid.did }],
})

// A JSON-LD presentation must be passed as an instance, not as JSON
const ldpVpResult = await verifier.w3cCredentials.verifyPresentation({
  presentation: JsonTransformer.fromJSON(ldpVp.toJson(), W3cJsonLdVerifiablePresentation),
  challenge,
  domain,
  trustedIssuers: [{ method: 'did', issuance: issuerDid.did }],
})

if (!jwtVpResult.isValid) console.error(jwtVpResult.error, jwtVpResult.validations)
console.log(jwtVpResult.isValid, ldpVpResult.isValid)
// end-section-5

await issuer.shutdown()
await holder.shutdown()
await verifier.shutdown()
