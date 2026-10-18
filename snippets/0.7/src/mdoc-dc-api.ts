// The verifier backend. It creates the requests and verifies the responses that the web page in
// mdoc-dc-api-browser.ts passes between the browser and the backend.

// start-section-1
import { readFileSync } from 'node:fs'
import { AskarModule } from '@credo-ts/askar'
import { Agent, X509Module } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import express from 'express'

// The origin of the web page that calls the Digital Credentials API. This server serves the page.
const origin = 'http://localhost:4090'

const app = express()
// The web page, with the code from mdoc-dc-api-browser.ts
app.use(express.static('public'))

// Every agent has `agent.mdoc`, no other module needed
const verifier = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      // In-memory storage, so each run of this example starts fresh
      store: {
        id: 'mdoc-dc-api-verifier',
        key: 'mdoc-dc-api-verifier-key',
        database: { type: 'sqlite', config: { inMemory: true } },
      },
    }),
    // Certificates (or root CAs) of the mdoc issuers you accept, as PEM or base64. For an mDL, the IACA certificates.
    x509: new X509Module({ trustedCertificates: [readFileSync('issuer-certificate.pem', 'utf8')] }),
  },
})

await verifier.initialize()
// end-section-1

// start-section-2
app.post('/mdoc/request', async (_request, response) => {
  const { verificationSession, request } = await verifier.mdoc.createDcApiVerificationSession({
    docRequests: [
      {
        docType: 'org.iso.18013.5.1.mDL',
        // Element identifier mapped to intent to retain
        nameSpaces: { 'org.iso.18013.5.1': { given_name: false, age_over_18: false } },
      },
    ],
  })

  // The page passes `request` to navigator.credentials.get() with protocol 'org-iso-mdoc'
  response.json({ verificationSessionId: verificationSession.id, request })
})
// end-section-2

// start-section-3
app.post('/mdoc/response', express.json(), async (request, response) => {
  const { verificationSessionId, data } = request.body
  if (typeof verificationSessionId !== 'string') return response.status(400).end()

  try {
    const { deviceResponse } = await verifier.mdoc.verifyDcApiResponse({
      verificationSessionId,
      // Some browsers return the response as a JSON string
      response: typeof data === 'string' ? JSON.parse(data) : data,
      origin,
    })

    response.json(deviceResponse.issuerClaims['org.iso.18013.5.1.mDL'])
  } finally {
    // Also deletes the encryption key of the session
    await verifier.mdoc.deleteVerificationSessionById(verificationSessionId)
  }
})

app.listen(4090)
// end-section-3
