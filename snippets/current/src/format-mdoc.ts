// start-section-1
import { AskarModule } from '@credo-ts/askar'
import {
  Agent,
  DateOnly,
  Mdoc,
  MdocDeviceResponse,
  MdocRecord,
  X509ExtendedKeyUsage,
  X509KeyUsage,
} from '@credo-ts/core'
import { PublicJwk } from '@credo-ts/core/kms'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

function createAgent(id: string) {
  return new Agent({
    config: {},
    dependencies: agentDependencies,
    modules: {
      askar: new AskarModule({
        askar: NativeAskar,
        store: { id, key: id, database: { type: 'sqlite', config: { inMemory: true } } },
      }),
    },
  })
}
// end-section-1

const issuer = createAgent('format-mdoc-issuer')
const holder = createAgent('format-mdoc-holder')
const verifier = createAgent('format-mdoc-verifier')
await issuer.initialize()
await holder.initialize()
await verifier.initialize()

// start-section-2
const issuerKey = await issuer.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })

// A self-signed document signer certificate. Production issuers use a certificate issued by their IACA.
const issuerCertificate = await issuer.x509.createCertificate({
  authorityKey: PublicJwk.fromPublicJwk(issuerKey.publicJwk),
  // Verification fails when the subject has no country (C)
  issuer: { commonName: 'Example mDL Issuer', countryName: 'NL' },
  validity: { notBefore: new Date(), notAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
  extensions: {
    keyUsage: { usages: [X509KeyUsage.DigitalSignature] },
    extendedKeyUsage: { usages: [X509ExtendedKeyUsage.MdlDs] },
  },
})
// end-section-2

// start-section-3
// The device key of the wallet. In a real flow the wallet sends the public key, for example in an OpenID4VCI proof.
const deviceKey = await holder.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })

const mdoc = await issuer.mdoc.sign({
  docType: 'org.iso.18013.5.1.mDL',
  namespaces: {
    'org.iso.18013.5.1': {
      family_name: 'Doe',
      given_name: 'Jane',
      birth_date: new DateOnly('1990-01-01'),
      issuing_country: 'NL',
      age_over_18: true,
    },
  },
  // `signed` and `validFrom` default to the time of signing
  validityInfo: { validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  issuerCertificate,
  holderKey: PublicJwk.fromPublicJwk(deviceKey.publicJwk),
})

// base64url encoded IssuerSigned structure, as returned over OpenID4VCI
const issued = mdoc.base64Url
// end-section-3

// start-section-4
const receivedMdoc = Mdoc.fromBase64Url(issued)
// The KMS key id is not part of the mdoc. Set it so Credo can sign device responses.
receivedMdoc.deviceKeyId = deviceKey.keyId

const verification = await holder.mdoc.verify(receivedMdoc, {
  trustedCertificates: [issuerCertificate.toString('pem')],
})
if (verification.isValid === false) throw new Error(verification.error)

const record = await holder.mdoc.store({ record: MdocRecord.fromMdoc(receivedMdoc) })

const [mdl] = await holder.mdoc.findAllByQuery({ docType: 'org.iso.18013.5.1.mDL' })
console.log(mdl.firstCredential.issuerSignedNamespaces)
// end-section-4

// start-section-5
// Values the verifier sends in its OpenID4VP request
const sessionTranscriptOptions = {
  type: 'openId4Vp',
  clientId: 'x509_san_dns:verifier.example.com',
  responseUri: 'https://verifier.example.com/response',
  verifierGeneratedNonce: 'b5c2f9e1-3a7d-4c8b-9e0f-1d2a3b4c5d6e',
} as const

const deviceResponse = await MdocDeviceResponse.createDeviceResponse(holder.context, {
  mdocs: [record.firstCredential],
  documentRequests: [
    {
      docType: 'org.iso.18013.5.1.mDL',
      // Element identifier mapped to intent to retain
      nameSpaces: { 'org.iso.18013.5.1': { family_name: false, age_over_18: false } },
    },
  ],
  sessionTranscriptOptions,
})

const encodedDeviceResponse = deviceResponse.encoded
// end-section-5

// start-section-6
const receivedResponse = MdocDeviceResponse.fromBase64Url(encodedDeviceResponse)

// Throws when the response is invalid. Pass the trusted certificates explicitly:
// this method does not use the agent trust configuration.
await receivedResponse.verify(verifier.context, {
  trustedCertificates: [issuerCertificate.toString('pem')],
  sessionTranscriptOptions,
})

// { 'org.iso.18013.5.1.mDL': { 'org.iso.18013.5.1': { family_name: 'Doe', age_over_18: true } } }
console.log(receivedResponse.issuerClaims)
// end-section-6

await issuer.shutdown()
await holder.shutdown()
await verifier.shutdown()
