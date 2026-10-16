// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent, DateOnly, type MdocDcApiRequest, MdocRecord } from '@credo-ts/core'
import { PublicJwk } from '@credo-ts/core/kms'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import express from 'express'

function createAgent(id: string) {
  return new Agent({
    dependencies: agentDependencies,
    modules: {
      askar: new AskarModule({
        askar: NativeAskar,
        // In-memory storage, so the example leaves nothing behind
        store: { id, key: id, database: { type: 'sqlite', config: { inMemory: true } } },
      }),
    },
  })
}

// Every agent has `agent.mdoc`, no other module needed
const verifier = createAgent('mdoc-dc-api-verifier')
// end-section-1

// A wallet on the user's device
const wallet = createAgent('mdoc-dc-api-wallet')

// Only used to give the wallet an mDL
const issuer = createAgent('mdoc-dc-api-issuer')

await verifier.initialize()
await wallet.initialize()
await issuer.initialize()

// start-section-2
// The origin of the web page that calls the Digital Credentials API
const verifierOrigin = 'http://localhost:4090'

// The certificate the verifier signs requests with. Production verifiers get one from a reader CA.
const readerKey = await verifier.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
const readerCertificate = await verifier.x509.createCertificate({
  authorityKey: PublicJwk.fromPublicJwk(readerKey.publicJwk),
  issuer: { commonName: 'Example verifier', countryName: 'NL' },
})

const app = express()

app.post('/mdoc/request', async (_request, response) => {
  const { verificationSession, request } = await verifier.mdoc.createDcApiVerificationSession({
    docRequests: [
      {
        docType: 'org.iso.18013.5.1.mDL',
        // Element identifier mapped to intent to retain
        nameSpaces: { 'org.iso.18013.5.1': { given_name: false, age_over_18: false } },
      },
    ],
    // Optional: sign the request for the origin of the page
    readerAuth: { certificate: readerCertificate, origin: verifierOrigin },
  })

  // The page passes `request` to navigator.credentials.get() with protocol 'org-iso-mdoc'
  response.json({ verificationSessionId: verificationSession.id, request })
})
// end-section-2

// start-section-3
app.post('/mdoc/response', express.json(), async (request, response) => {
  const { verificationSessionId, data } = request.body
  if (typeof verificationSessionId !== 'string') return response.status(400).end()

  const { deviceResponse } = await verifier.mdoc.verifyDcApiResponse({
    verificationSessionId,
    // Some browsers return the response as a JSON string
    response: typeof data === 'string' ? JSON.parse(data) : data,
    origin: verifierOrigin,
  })

  // Also deletes the encryption key of the session
  await verifier.mdoc.deleteVerificationSessionById(verificationSessionId)

  response.json(deviceResponse.issuerClaims['org.iso.18013.5.1.mDL'])
})
// end-section-3

const server = app.listen(4090)

// The wallet holds an mDL from an issuer the verifier trusts
const issuerKey = await issuer.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
const issuerCertificate = await issuer.x509.createCertificate({
  authorityKey: PublicJwk.fromPublicJwk(issuerKey.publicJwk),
  issuer: { commonName: 'Example mDL issuer', countryName: 'NL' },
})
verifier.x509.config.addTrustedCertificate(issuerCertificate)

const deviceKey = await wallet.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
const mdl = await issuer.mdoc.sign({
  docType: 'org.iso.18013.5.1.mDL',
  holderKey: PublicJwk.fromPublicJwk(deviceKey.publicJwk),
  issuerCertificate,
  validityInfo: { validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
  namespaces: {
    'org.iso.18013.5.1': {
      given_name: 'Erika',
      family_name: 'Mustermann',
      birth_date: new DateOnly('1984-01-26'),
      age_over_18: true,
      issuing_country: 'NL',
    },
  },
})
await wallet.mdoc.store({
  record: new MdocRecord({
    credentialInstances: [{ issuerSignedBase64Url: mdl.base64Url, kmsKeyId: deviceKey.keyId }],
  }),
})

// start-section-4
// Called with the request and the origin of the calling website, as provided by the platform
async function handleMdocRequest(request: MdocDcApiRequest, origin: string) {
  const resolved = await wallet.mdoc.resolveDcApiRequest({
    request,
    origin,
    // The reader certificates or reader CAs the wallet trusts
    trustedReaderCertificates: [readerCertificate],
  })
  if (!resolved.success || resolved.docRequestsAsAlternatives) throw new Error('No matching mdoc')

  // Show the origin, the reader certificate and the requested elements to the user, and ask for consent here

  return wallet.mdoc.createDcApiResponse({
    resolvedRequest: resolved,
    credentials: resolved.docRequests.map(({ docRequestIndex, validCredentials }) => ({
      docRequestIndex,
      record: validCredentials[0].record,
    })),
  })
}
// end-section-4

// Plays the part of the web page and the browser: fetch the request, hand it to the wallet, post the response back
async function postJson(path: string, body: unknown) {
  const response = await fetch(`${verifierOrigin}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`${path} failed with status ${response.status}`)
  return response.json()
}

const { verificationSessionId, request } = await postJson('/mdoc/request', {})
const walletResponse = await handleMdocRequest(request, verifierOrigin)
console.log(await postJson('/mdoc/response', { verificationSessionId, data: walletResponse }))

server.close()
await verifier.shutdown()
await wallet.shutdown()
await issuer.shutdown()
