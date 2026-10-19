import {
  Agent,
  DidDocumentBuilder,
  DidKey,
  getMultikey,
  type JwkDidCreateOptions,
  type KeyDidCreateOptions,
} from '@credo-ts/core'
import { PublicJwk } from '@credo-ts/core/kms'
import { agentDependencies } from '@credo-ts/node'
import { exampleStorage } from './example-storage.js'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    ...(await exampleStorage()),
  },
})
await agent.initialize()

// start-section-1
const { didState } = await agent.dids.create<KeyDidCreateOptions>({
  method: 'key',
  options: { createKey: { type: { kty: 'OKP', crv: 'Ed25519' } } },
})

// Registrars report failures in the result instead of throwing
if (didState.state !== 'finished') {
  throw new Error(`Creating the did failed: ${didState.state === 'failed' ? didState.reason : didState.state}`)
}

// A did:key has one verification method, identified by the key fingerprint
const didKey = DidKey.fromDid(didState.did)
const verificationMethodId = `${didKey.did}#${didKey.publicJwk.fingerprint}`
// end-section-1

// start-section-2
const { keyId } = await agent.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })

const jwkResult = await agent.dids.create<JwkDidCreateOptions>({
  method: 'jwk',
  options: { keyId },
})
if (jwkResult.didState.state !== 'finished') throw new Error('Creating the did:jwk failed')

// The verification method of a did:jwk is always `#0`
const jwkVerificationMethodId = `${jwkResult.didState.did}#0`
// end-section-2

// start-section-3
const resolution = await agent.dids.resolve(didState.did)
if (!resolution.didDocument) {
  throw new Error(`Resolving failed: ${resolution.didResolutionMetadata.error}`)
}

// resolveDidDocument returns the document, or throws when resolution fails
const didDocument = await agent.dids.resolveDidDocument(didState.did)
const verificationMethod = didDocument.dereferenceKey(verificationMethodId, ['assertionMethod'])
// end-section-3

// start-section-4
const did = 'did:web:issuer.example.com'
const webKey = await agent.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })

const webVerificationMethod = getMultikey({
  did,
  verificationMethodId: `${did}#key-1`,
  publicJwk: PublicJwk.fromPublicJwk(webKey.publicJwk),
})

const webDidDocument = new DidDocumentBuilder(did)
  .addContext('https://w3id.org/security/multikey/v1')
  .addVerificationMethod(webVerificationMethod)
  .addAuthentication(webVerificationMethod.id)
  .addAssertionMethod(webVerificationMethod.id)
  .build()

await agent.dids.import({
  did,
  didDocument: webDidDocument,
  // Links the verification method to the KMS key, so the agent can sign with this did
  keys: [{ didDocumentRelativeKeyId: '#key-1', kmsKeyId: webKey.keyId }],
})

// Host this JSON at https://issuer.example.com/.well-known/did.json
const didJson = webDidDocument.toJSON()
// end-section-4

// start-section-5
const createdWebDids = await agent.dids.getCreatedDids({ method: 'web' })
// end-section-5

console.log({
  verificationMethod: verificationMethod.id,
  jwkVerificationMethodId,
  didJson,
  createdWebDids: createdWebDids.map((record) => record.did),
})

await agent.shutdown()
