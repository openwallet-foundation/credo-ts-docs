// The verifier backend. It creates the requests that the web page in dc-api-verifier-browser.ts passes
// to the Digital Credentials API, and verifies the response the page posts back.

import { openid4vcBundle } from '@credo-ts/drizzle-storage/openid4vc'
import { exampleStorage } from './example-storage.js'

const storage = await exampleStorage([openid4vcBundle])

// start-section-1
import { readFileSync } from 'node:fs'
import { Agent, ClaimFormat, X509Module } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
import express from 'express'

// The origin of the web page that calls the Digital Credentials API. This server serves the page.
const origin = 'http://localhost:4037'

const app = express()
// The web page, with the code from dc-api-verifier-browser.ts
app.use(express.static('public'))

const verifier = new Agent({
  config: {
    // Allows the http://localhost URLs of this example. Never enable this in production.
    allowInsecureHttpUrls: true,
  },
  dependencies: agentDependencies,
  modules: {
    ...storage, // Storage and key management, see Agent setup
    // Certificates (or root CAs) of the issuers you accept, as PEM or base64. For an mDL, the IACA certificates.
    x509: new X509Module({ trustedCertificates: [readFileSync('issuer-certificate.pem', 'utf8')] }),
    // Only needed for OpenID4VP. ISO 18013-7 Annex C uses `agent.mdoc`, which every agent has.
    openid4vc: new OpenId4VcModule({ app, verifier: { baseUrl: `${origin}/oid4vp` } }),
  },
})

await verifier.initialize()
const { verifierId } = await verifier.openid4vc.verifier.createVerifier()
// end-section-1

// start-section-2
async function createOpenId4VpRequest() {
  const { verificationSession, authorizationRequestObject } =
    await verifier.openid4vc.verifier.createAuthorizationRequest({
      verifierId,
      // Unsigned: the wallet identifies the verifier by the origin the browser passes on
      requestSigner: { method: 'none' },
      // Encrypt the response to the verifier
      responseMode: 'dc_api.jwt',
      dcql: {
        query: {
          credentials: [
            {
              id: 'mdl',
              format: 'mso_mdoc',
              meta: { doctype_value: 'org.iso.18013.5.1.mDL' },
              claims: [{ path: ['org.iso.18013.5.1', 'given_name'] }, { path: ['org.iso.18013.5.1', 'age_over_18'] }],
            },
          ],
        },
      },
    })

  // The page passes `request` to navigator.credentials.get()
  return { verificationSessionId: verificationSession.id, request: authorizationRequestObject }
}
// end-section-2

// start-section-3
async function createIsoMdocRequest() {
  const { verificationSession, request } = await verifier.mdoc.createDcApiVerificationSession({
    docRequests: [
      {
        docType: 'org.iso.18013.5.1.mDL',
        // Element identifier mapped to intent to retain
        nameSpaces: { 'org.iso.18013.5.1': { given_name: false, age_over_18: false } },
      },
    ],
  })

  // The page passes `request` to navigator.credentials.get()
  return { verificationSessionId: verificationSession.id, request }
}
// end-section-3

// start-section-4
// The page passes both requests in one call, and the wallet answers one of them
app.post('/dc-api/request', async (_request, response) => {
  response.json({ openid4vp: await createOpenId4VpRequest(), isoMdoc: await createIsoMdocRequest() })
})
// end-section-4

// start-section-5
async function verifyOpenId4VpResponse(verificationSessionId: string, data: Record<string, unknown>) {
  const { dcql } = await verifier.openid4vc.verifier.verifyAuthorizationResponse({
    verificationSessionId,
    authorizationResponse: data,
    origin,
  })

  const [mdl] = dcql?.presentations.mdl ?? []
  if (mdl?.claimFormat !== ClaimFormat.MsoMdoc) throw new Error('Expected an mdoc presentation')

  return mdl.issuerClaims['org.iso.18013.5.1.mDL']
}
// end-section-5

// start-section-6
async function verifyIsoMdocResponse(verificationSessionId: string, data: { response: string }) {
  const { deviceResponse } = await verifier.mdoc.verifyDcApiResponse({ verificationSessionId, response: data, origin })

  return deviceResponse.issuerClaims['org.iso.18013.5.1.mDL']
}
// end-section-6

// start-section-7
app.post('/dc-api/response', express.json(), async (request, response) => {
  const { protocol, data, openid4vpSessionId, isoMdocSessionId } = request.body
  if (typeof openid4vpSessionId !== 'string' || typeof isoMdocSessionId !== 'string') {
    return response.status(400).end()
  }

  // Some browsers return the response as a JSON string
  const responseData = typeof data === 'string' ? JSON.parse(data) : data

  try {
    const claims =
      protocol === 'org-iso-mdoc'
        ? await verifyIsoMdocResponse(isoMdocSessionId, responseData)
        : await verifyOpenId4VpResponse(openid4vpSessionId, responseData)

    response.json(claims)
  } finally {
    // Also deletes the encryption key of the session, whichever request the wallet answered
    await verifier.mdoc.deleteVerificationSessionById(isoMdocSessionId)
  }
})

app.listen(4037)
// end-section-7
