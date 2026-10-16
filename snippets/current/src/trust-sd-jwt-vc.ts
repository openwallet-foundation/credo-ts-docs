import { AskarModule } from '@credo-ts/askar'
import { Agent, DidKey, type KeyDidCreateOptions, X509KeyUsage } from '@credo-ts/core'
import { PublicJwk } from '@credo-ts/core/kms'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

const oneYear = 365 * 24 * 60 * 60 * 1000

function inMemoryStorage(id: string) {
  return new AskarModule({
    askar: NativeAskar,
    store: { id, key: id, database: { type: 'sqlite', config: { inMemory: true } } },
  })
}

// The issuer runs a CA, and issues SD-JWT VCs signed with an X.509 certificate and with a did:key
const issuer = new Agent({ dependencies: agentDependencies, modules: { askar: inMemoryStorage('trust-issuer') } })
await issuer.initialize()

async function createCertificateAuthority(commonName: string) {
  const key = await issuer.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
  const certificate = await issuer.x509.createCertificate({
    authorityKey: PublicJwk.fromPublicJwk(key.publicJwk),
    issuer: { commonName, countryName: 'NL' },
    validity: { notBefore: new Date(), notAfter: new Date(Date.now() + oneYear) },
    extensions: {
      keyUsage: { usages: [X509KeyUsage.KeyCertSign], markAsCritical: true },
      basicConstraints: { ca: true, pathLenConstraint: 0, markAsCritical: true },
    },
  })
  return { key, certificate }
}

const root = await createCertificateAuthority('Example Root CA')
const otherRoot = await createCertificateAuthority('Other Root CA')

const signerKey = await issuer.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
const issuerCertificate = await issuer.x509.createCertificate({
  authorityKey: PublicJwk.fromPublicJwk(root.key.publicJwk),
  subjectPublicKey: PublicJwk.fromPublicJwk(signerKey.publicJwk),
  issuer: root.certificate.subject,
  subject: { commonName: 'Example Issuer', countryName: 'NL' },
  validity: { notBefore: new Date(), notAfter: new Date(Date.now() + oneYear) },
  extensions: {
    keyUsage: { usages: [X509KeyUsage.DigitalSignature], markAsCritical: true },
    subjectAlternativeName: { name: [{ type: 'dns', value: 'issuer.example.com' }] },
  },
})

const x509SignedCredential = await issuer.sdJwtVc.sign({
  issuer: { method: 'x5c', x5c: [issuerCertificate], issuer: 'https://issuer.example.com' },
  payload: { vct: 'https://example.com/membership', name: 'Jane Doe' },
})

const { didState } = await issuer.dids.create<KeyDidCreateOptions>({
  method: 'key',
  options: { createKey: { type: { kty: 'OKP', crv: 'Ed25519' } } },
})
if (didState.state !== 'finished') throw new Error('Creating the did failed')
const didKey = DidKey.fromDid(didState.did)

const didSignedCredential = await issuer.sdJwtVc.sign({
  issuer: { method: 'did', didUrl: `${didKey.did}#${didKey.publicJwk.fingerprint}` },
  payload: { vct: 'https://example.com/membership', name: 'Jane Doe' },
})

// A verifier without any trust configuration: did-signed credentials verify, X.509 ones don't
const untrustingVerifier = new Agent({
  dependencies: agentDependencies,
  modules: { askar: inMemoryStorage('trust-untrusting-verifier') },
})
await untrustingVerifier.initialize()
const untrustedX509 = await untrustingVerifier.sdJwtVc.verify({ compactSdJwtVc: x509SignedCredential.compact })
const untrustedDid = await untrustingVerifier.sdJwtVc.verify({ compactSdJwtVc: didSignedCredential.compact })
console.log('no trust configured:', { x509: untrustedX509.isValid, did: untrustedDid.isValid })

const rootCertificatePem = root.certificate.toString('pem')

// start-section-2
const trustedRootCertificates = [rootCertificatePem]
const trustedIssuerDids = ['did:web:issuer.example.com']

const agent = new Agent({
  config: {
    getTrustedIssuersForVerification: async (_agentContext, { signer, verification }) => {
      // Fall through to the X.509 module configuration for anything other than credentials
      if (verification.type !== 'credential') return undefined

      if (signer.method === 'x509') {
        return { trustedIssuers: [{ method: 'x509', issuance: trustedRootCertificates }] }
      }

      return { trustedIssuers: trustedIssuerDids.map((did) => ({ method: 'did', issuance: did })) }
    },
  },
  dependencies: agentDependencies,
  modules: { askar: inMemoryStorage('trust-verifier') },
})
// end-section-2
await agent.initialize()

// start-section-3
const result = await agent.sdJwtVc.verify({ compactSdJwtVc: x509SignedCredential.compact })
if (!result.isValid) {
  console.error('Credential not trusted or invalid', result.error)
}
// end-section-3

// The did:key signer is not in the returned list, so the did-signed credential is rejected
const didResult = await agent.sdJwtVc.verify({ compactSdJwtVc: didSignedCredential.compact })
console.log('callback configured:', { x509: result.isValid, did: didResult.isValid })

// start-section-4
// Trusted issuers passed to the call replace the callback for this verification
const perCallResult = await agent.sdJwtVc.verify({
  compactSdJwtVc: x509SignedCredential.compact,
  trustedIssuers: [{ method: 'x509', issuance: [otherRoot.certificate.toString('pem')] }],
})
// end-section-4
console.log('per-call trusted issuers:', { x509: perCallResult.isValid })

// start-section-5
// Reject everything until the trust list is loaded
agent.config.setTrustedIssuersForVerification(async () => ({ trustedIssuers: [] }))
// end-section-5
const rejectAll = await agent.sdJwtVc.verify({ compactSdJwtVc: didSignedCredential.compact })
console.log('empty list:', { did: rejectAll.isValid })

await issuer.shutdown()
await untrustingVerifier.shutdown()
await agent.shutdown()
