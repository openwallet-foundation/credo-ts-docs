import { exampleStorage } from './example-storage.js'

type ExampleStorage = Awaited<ReturnType<typeof exampleStorage>>

// start-section-1
import { Agent, DidKey, type KeyDidCreateOptions, SdJwtVcModule, SdJwtVcRecord } from '@credo-ts/core'
import { PublicJwk } from '@credo-ts/core/kms'
import { agentDependencies } from '@credo-ts/node'

function createAgent(storage: ExampleStorage, sdJwtVc?: SdJwtVcModule) {
  return new Agent({
    dependencies: agentDependencies,
    modules: {
      ...storage, // Storage and key management, see Agent setup
      // SdJwtVcModule is a default module. Register it yourself only to configure it.
      ...(sdJwtVc ? { sdJwtVc } : {}),
    },
  })
}
// end-section-1

// start-section-7
const identityTypeMetadata = {
  vct: 'https://credentials.example.com/identity',
  name: 'Identity credential',
  display: [{ locale: 'en-US', name: 'Identity credential' }],
  claims: [{ path: ['given_name'], display: [{ locale: 'en-US', label: 'Given name' }] }],
}

const sdJwtVcModule = new SdJwtVcModule({
  // Called for the `vct` of a credential and for every `extends` value in its type metadata
  customTypeMetadataResolver: async (vct, _integrity, { defaultResolver }) => {
    if (vct === identityTypeMetadata.vct) return identityTypeMetadata
    return defaultResolver({})
  },
  // Replaces the HTTP GET of the status list JWT. The JWT is verified after it is returned.
  customStatusListFetcher: async (uri, { defaultFetcher }) => {
    if (!uri.startsWith('https://')) throw new Error(`Refusing to fetch status list over ${uri}`)
    return defaultFetcher()
  },
})
// end-section-7

const issuer = createAgent(await exampleStorage())
const holder = createAgent(await exampleStorage())
const verifier = createAgent(await exampleStorage(), sdJwtVcModule)
await issuer.initialize()
await holder.initialize()
await verifier.initialize()

// start-section-2
// The issuer signs with a key of a DID it created
const { didState } = await issuer.dids.create<KeyDidCreateOptions>({
  method: 'key',
  options: { createKey: { type: { kty: 'OKP', crv: 'Ed25519' } } },
})
if (didState.state !== 'finished') throw new Error('Creating the issuer DID failed')
const issuerDid = didState.did
const issuerDidUrl = `${issuerDid}#${DidKey.fromDid(issuerDid).publicJwk.fingerprint}`

// The holder key. In a real flow the wallet sends the public key, for example in an OpenID4VCI proof.
const holderKey = await holder.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
const holderJwk = PublicJwk.fromPublicJwk(holderKey.publicJwk)

const credential = await issuer.sdJwtVc.sign({
  payload: {
    vct: 'https://credentials.example.com/identity',
    given_name: 'Jane',
    family_name: 'Doe',
    birthdate: '1990-01-01',
    address: { street_address: 'Main Street 1', locality: 'Utrecht', country: 'NL' },
    nationalities: ['NL', 'DE'],
  },
  issuer: { method: 'did', didUrl: issuerDidUrl },
  holder: { method: 'jwk', jwk: holderJwk },
  disclosureFrame: {
    _sd: ['given_name', 'family_name', 'birthdate'],
    _sd_decoy: 2,
    address: { _sd: ['street_address', 'locality'] },
    nationalities: { _sd: [0, 1] },
  },
  hashingAlgorithm: 'sha-256',
})

// The compact SD-JWT VC: issuer-signed JWT followed by the disclosures
console.log(credential.compact)
// end-section-2

// start-section-3
const issuerKey = await issuer.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
const issuerCertificate = await issuer.x509.createCertificate({
  authorityKey: PublicJwk.fromPublicJwk(issuerKey.publicJwk),
  issuer: { commonName: 'Example Issuer', countryName: 'NL' },
  extensions: { subjectAlternativeName: { name: [{ type: 'dns', value: 'issuer.example.com' }] } },
})

const x509Credential = await issuer.sdJwtVc.sign({
  payload: { vct: 'https://credentials.example.com/identity', given_name: 'Jane' },
  // `issuer` is optional. When set, it must match a SAN of the leaf certificate.
  issuer: { method: 'x5c', x5c: [issuerCertificate], issuer: 'https://issuer.example.com' },
  holder: { method: 'jwk', jwk: holderJwk },
  disclosureFrame: { _sd: ['given_name'] },
})
// end-section-3

// start-section-4
const verification = await holder.sdJwtVc.verify({ compactSdJwtVc: credential.compact })
if (verification.isValid === false) throw verification.error

const record = await holder.sdJwtVc.store({
  record: new SdJwtVcRecord({
    // The KMS key id lets Credo sign the key binding JWT when presenting
    credentialInstances: [{ compactSdJwtVc: credential.compact, kmsKeyId: holderKey.keyId }],
  }),
})

const [identityRecord] = await holder.sdJwtVc.findAllByQuery({ vct: 'https://credentials.example.com/identity' })
console.log(identityRecord.firstCredential.prettyClaims)
// end-section-4

// start-section-5
// Received from the verifier
const audience = 'https://verifier.example.com'
const nonce = 'f8b4a1d2-7c1e-4b0a-9d3e-2a6c5e8f1b90'

const presentation = await holder.sdJwtVc.present({
  // firstCredential carries the kmsKeyId of the record
  sdJwtVc: record.firstCredential,
  presentationFrame: { given_name: true, address: { locality: true } },
  verifierMetadata: { audience, nonce, issuedAt: Math.floor(Date.now() / 1000) },
})
// end-section-5

// start-section-6
const result = await verifier.sdJwtVc.verify({
  compactSdJwtVc: presentation,
  keyBinding: { audience, nonce },
  requiredClaimKeys: ['given_name', 'address.locality'],
  fetchTypeMetadata: true,
  trustedIssuers: [{ method: 'did', issuance: issuerDid }],
})

if (result.isValid === false) throw result.error
// { vct, iss, cnf, iat, given_name, address: { locality, country }, nationalities: [] }
console.log(result.sdJwtVc.prettyClaims)
console.log(result.sdJwtVc.typeMetadata?.name)
// end-section-6

// start-section-8
const x509Result = await verifier.sdJwtVc.verify({
  compactSdJwtVc: x509Credential.compact,
  trustedIssuers: [{ method: 'x509', issuance: [issuerCertificate.toString('pem')] }],
})
if (x509Result.isValid === false) throw x509Result.error
// end-section-8

// start-section-9
const expired = await issuer.sdJwtVc.sign({
  payload: { vct: 'https://credentials.example.com/identity', exp: Math.floor(Date.now() / 1000) - 3600 },
  issuer: { method: 'did', didUrl: issuerDidUrl },
})

const expiredResult = await verifier.sdJwtVc.verify({ compactSdJwtVc: expired.compact })
if (expiredResult.isValid === false && 'code' in expiredResult.error) {
  // 'JWT_EXPIRED'
  console.log(expiredResult.error.code)
}
// end-section-9

await issuer.shutdown()
await holder.shutdown()
await verifier.shutdown()
