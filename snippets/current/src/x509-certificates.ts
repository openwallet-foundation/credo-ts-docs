import { createServer } from 'node:http'
import { exampleStorage } from './example-storage.js'

const storage = await exampleStorage()

// start-section-1
import {
  Agent,
  CredoWebCrypto,
  X509Certificate,
  X509CertificateRevocationListEntryReason,
  X509ExtendedKeyUsage,
  X509KeyUsage,
  X509Module,
  X509RevocationCheckMode,
  X509ValidationError,
} from '@credo-ts/core'
import { PublicJwk } from '@credo-ts/core/kms'
import { agentDependencies } from '@credo-ts/node'

// end-section-1

const oneYear = 365 * 24 * 60 * 60 * 1000
const crlUrl = 'http://localhost:4081/crl'

// Plays the certificate authority (CA)
const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    ...(await exampleStorage()),
  },
})
await agent.initialize()

// start-section-2
const rootKey = await agent.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
const rootPublicJwk = PublicJwk.fromPublicJwk(rootKey.publicJwk)

// Without a subjectPublicKey the certificate is self-signed
const rootCertificate = await agent.x509.createCertificate({
  authorityKey: rootPublicJwk,
  issuer: { commonName: 'Example Root CA', countryName: 'NL' },
  validity: { notBefore: new Date(), notAfter: new Date(Date.now() + 5 * oneYear) },
  extensions: {
    subjectKeyIdentifier: { include: true },
    keyUsage: { usages: [X509KeyUsage.KeyCertSign, X509KeyUsage.CrlSign], markAsCritical: true },
    basicConstraints: { ca: true, pathLenConstraint: 0, markAsCritical: true },
  },
})

const rootCertificatePem = rootCertificate.toString('pem')
// end-section-2

// start-section-3
const issuerKey = await agent.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })

const issuerCertificate = await agent.x509.createCertificate({
  authorityKey: rootPublicJwk,
  subjectPublicKey: PublicJwk.fromPublicJwk(issuerKey.publicJwk),
  issuer: rootCertificate.subject,
  subject: { commonName: 'Example Issuer', countryName: 'NL' },
  validity: { notBefore: new Date(), notAfter: new Date(Date.now() + oneYear) },
  extensions: {
    authorityKeyIdentifier: { include: true },
    subjectKeyIdentifier: { include: true },
    keyUsage: { usages: [X509KeyUsage.DigitalSignature], markAsCritical: true },
    // Document signer usage, required for mdoc issuer certificates
    extendedKeyUsage: { usages: [X509ExtendedKeyUsage.MdlDs], markAsCritical: true },
    // An SD-JWT VC `iss` must match a SAN URI, or its host a SAN DNS name
    subjectAlternativeName: { name: [{ type: 'dns', value: 'issuer.example.com' }] },
  },
})

// The certificate keeps the KMS key id of the subject key, so Credo can sign with it
console.log(issuerCertificate.keyId === issuerKey.keyId)
// end-section-3

// start-section-4
const verifierAgent = new Agent({
  dependencies: agentDependencies,
  modules: {
    ...storage, // Storage and key management, see Agent setup
    x509: new X509Module({
      trustedCertificates: [rootCertificatePem],
      revocationCheck: { mode: X509RevocationCheckMode.SoftFail },
    }),
  },
})
// end-section-4
await verifierAgent.initialize()

// start-section-5
// Verifier: create a key and a certificate signing request (CSR) for it
const verifierKey = await verifierAgent.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })

const csr = await verifierAgent.x509.createCertificateSigningRequest({
  subjectPublicKey: PublicJwk.fromPublicJwk(verifierKey.publicJwk),
  subject: { commonName: 'Example Verifier', countryName: 'NL' },
  extensions: {
    // With the x509_san_dns client id prefix, the verifier's host must be a SAN DNS name
    subjectAlternativeName: { name: [{ type: 'dns', value: 'verifier.example.com' }] },
  },
})
const encodedCsr = csr.toString('pem')

// CA: parse the CSR and check its signature, which proves possession of the key
const receivedCsr = agent.x509.parseCertificateSigningRequest({ encodedCertificateSigningRequest: encodedCsr })
await receivedCsr.verify(new CredoWebCrypto(agent.context))

const accessCertificate = await agent.x509.createCertificate({
  authorityKey: rootPublicJwk,
  subjectPublicKey: receivedCsr.publicJwk,
  issuer: rootCertificate.subject,
  subject: receivedCsr.subject,
  validity: { notBefore: new Date(), notAfter: new Date(Date.now() + oneYear) },
  extensions: {
    authorityKeyIdentifier: { include: true },
    keyUsage: { usages: [X509KeyUsage.DigitalSignature], markAsCritical: true },
    subjectAlternativeName: { name: receivedCsr.sanDnsNames.map((value) => ({ type: 'dns', value })) },
  },
})
const accessCertificatePem = accessCertificate.toString('pem')
// end-section-5

// start-section-6
// Verifier: parse the certificate returned by the CA and link it to the KMS key
const verifierCertificate = X509Certificate.fromEncodedCertificate(accessCertificatePem)
verifierCertificate.keyId = verifierKey.keyId

console.log(verifierCertificate.subject, verifierCertificate.sanDnsNames)
// end-section-6

// start-section-7
const validatedChain = await verifierAgent.x509.validateCertificateChain({
  // Leaf first, as in an x5c header. The root may be left out when it is a trusted certificate.
  certificateChain: [issuerCertificate.toString('base64')],
  trustedCertificates: [rootCertificatePem],
})

// The chain starts at the trust anchor and ends with the leaf
console.log(
  validatedChain[0].equal(rootCertificate),
  validatedChain[validatedChain.length - 1].equal(issuerCertificate)
)
// end-section-7

// start-section-8
const revokedKey = await agent.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
const revokedCertificate = await agent.x509.createCertificate({
  authorityKey: rootPublicJwk,
  subjectPublicKey: PublicJwk.fromPublicJwk(revokedKey.publicJwk),
  issuer: rootCertificate.subject,
  subject: { commonName: 'Revoked Issuer', countryName: 'NL' },
  validity: { notBefore: new Date(), notAfter: new Date(Date.now() + oneYear) },
  extensions: {
    authorityKeyIdentifier: { include: true },
    keyUsage: { usages: [X509KeyUsage.DigitalSignature], markAsCritical: true },
    crlDistributionPoints: { urls: [crlUrl] },
  },
})

const crl = await agent.x509.createCertificateRevocationList({
  authorityKey: rootPublicJwk,
  issuer: rootCertificate.subject,
  validity: { nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  entries: [{ certificate: revokedCertificate, reason: X509CertificateRevocationListEntryReason.KeyCompromise }],
  extensions: { crlNumber: { value: 1 }, authorityKeyIdentifier: { include: true } },
})

// Serve the DER encoded CRL at the URL in the certificate's crlDistributionPoints
const crlBytes = crl.rawCertificateRevocationList
// end-section-8

const server = createServer((request, response) => {
  if (request.url !== '/crl') {
    response.writeHead(404).end()
    return
  }
  response.writeHead(200, { 'Content-Type': 'application/pkix-crl' }).end(crlBytes)
})
await new Promise<void>((resolve) => server.listen(4081, resolve))

// start-section-9
try {
  await verifierAgent.x509.validateCertificateChain({
    certificateChain: [revokedCertificate.toString('base64')],
    trustedCertificates: [rootCertificatePem],
  })
} catch (error) {
  if (!(error instanceof X509ValidationError)) throw error
  // The validations show which check failed, here revocationStatus
  console.log('Rejected:', error.message, error.validationResult.validations.revocationStatus?.isValid)
}
// end-section-9

server.close()
await agent.shutdown()
await verifierAgent.shutdown()
