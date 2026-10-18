// The verifier backend. It creates the requests and verifies the responses that the web page in
// openid4vc-dc-api-browser.ts passes between the browser and the backend.

// start-section-1
import { readFileSync } from 'node:fs'
import { AskarModule } from '@credo-ts/askar'
import { Agent, ClaimFormat, X509Module } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import express from 'express'

// The origin of the web page that calls the Digital Credentials API. This server serves the page.
const origin = 'http://localhost:4037'

const app = express()
// The web page, with the code from openid4vc-dc-api-browser.ts
app.use(express.static('public'))

const verifier = new Agent({
  config: {
    // Allows the http://localhost URLs of this example. Never enable this in production.
    allowInsecureHttpUrls: true,
  },
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      // In-memory storage, so each run of this example starts fresh
      store: {
        id: 'dc-api-verifier',
        key: 'dc-api-verifier-key',
        database: { type: 'sqlite', config: { inMemory: true } },
      },
    }),
    // Certificates (or root CAs) of the credential issuers you accept, as PEM or base64
    x509: new X509Module({ trustedCertificates: [readFileSync('issuer-certificate.pem', 'utf8')] }),
    openid4vc: new OpenId4VcModule({ app, verifier: { baseUrl: `${origin}/oid4vp` } }),
  },
})

await verifier.initialize()
const { verifierId } = await verifier.openid4vc.verifier.createVerifier()
// end-section-1

// start-section-2
app.post('/dc-api/request', async (_request, response) => {
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
              id: 'pid',
              format: 'dc+sd-jwt',
              meta: { vct_values: ['urn:example:pid:1'] },
              claims: [{ path: ['given_name'] }, { path: ['age_over_18'] }],
            },
          ],
        },
      },
    })

  // The page passes `request` to navigator.credentials.get()
  response.json({ verificationSessionId: verificationSession.id, request: authorizationRequestObject })
})
// end-section-2

// start-section-3
app.post('/dc-api/response', express.json(), async (request, response) => {
  const { verificationSessionId, data } = request.body
  if (typeof verificationSessionId !== 'string') return response.status(400).end()

  const { dcql } = await verifier.openid4vc.verifier.verifyAuthorizationResponse({
    verificationSessionId,
    // Some browsers return the response as a JSON string
    authorizationResponse: typeof data === 'string' ? JSON.parse(data) : data,
    origin,
  })

  const [pid] = dcql?.presentations.pid ?? []
  if (pid?.claimFormat !== ClaimFormat.SdJwtDc) return response.status(400).end()

  response.json({ given_name: pid.prettyClaims.given_name, age_over_18: pid.prettyClaims.age_over_18 })
})

app.listen(4037)
// end-section-3
