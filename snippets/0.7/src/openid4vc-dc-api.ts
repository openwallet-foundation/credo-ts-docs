import { AskarModule } from '@credo-ts/askar'
import { Agent, ClaimFormat, SdJwtVcRecord } from '@credo-ts/core'
import { PublicJwk } from '@credo-ts/core/kms'
import { agentDependencies } from '@credo-ts/node'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import express from 'express'

function askar(id: string) {
  return new AskarModule({
    askar: NativeAskar,
    // In-memory storage, so the example leaves nothing behind
    store: { id, key: `${id}-key`, database: { type: 'sqlite', config: { inMemory: true } } },
  })
}

const app = express()
const verifier = new Agent({
  config: { allowInsecureHttpUrls: true },
  dependencies: agentDependencies,
  modules: {
    askar: askar('dc-api-verifier'),
    openid4vc: new OpenId4VcModule({ app, verifier: { baseUrl: 'http://localhost:4037/oid4vp' } }),
  },
})

// A wallet on the user's device
const wallet = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: askar('dc-api-wallet'),
    openid4vc: new OpenId4VcModule(),
  },
})

// Only used to give the wallet some credentials
const issuer = new Agent({ dependencies: agentDependencies, modules: { askar: askar('dc-api-issuer') } })

await verifier.initialize()
await wallet.initialize()
await issuer.initialize()

// start-section-1
// The origin of the web page that calls the Digital Credentials API
const verifierOrigin = 'http://localhost:4037'
const verifierRecord = await verifier.openid4vc.verifier.createVerifier({ verifierId: 'example-verifier' })

app.post('/dc-api/request', async (_request, response) => {
  const { verificationSession, authorizationRequestObject } =
    await verifier.openid4vc.verifier.createAuthorizationRequest({
      verifierId: verifierRecord.verifierId,
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
// end-section-1

// start-section-2
app.post('/dc-api/response', express.json(), async (request, response) => {
  const { verificationSessionId, data } = request.body
  if (typeof verificationSessionId !== 'string') return response.status(400).end()

  const { dcql } = await verifier.openid4vc.verifier.verifyAuthorizationResponse({
    verificationSessionId,
    // Some browsers return the response as a JSON string
    authorizationResponse: typeof data === 'string' ? JSON.parse(data) : data,
    origin: verifierOrigin,
  })

  const [pid] = dcql?.presentations.pid ?? []
  if (pid?.claimFormat !== ClaimFormat.SdJwtDc) return response.status(400).end()

  response.json({ given_name: pid.prettyClaims.given_name, age_over_18: pid.prettyClaims.age_over_18 })
})
// end-section-2

const server = app.listen(4037)

// The wallet holds an SD-JWT VC from an issuer the verifier trusts
const issuerCertificate = await issuer.x509.createCertificate({
  authorityKey: PublicJwk.fromPublicJwk((await issuer.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })).publicJwk),
  issuer: { commonName: 'Credo example issuer', countryName: 'NL' },
})
verifier.x509.config.addTrustedCertificate(issuerCertificate)

const pidKey = await wallet.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
const pid = await issuer.sdJwtVc.sign({
  issuer: { method: 'x5c', x5c: [issuerCertificate] },
  holder: { method: 'jwk', jwk: PublicJwk.fromPublicJwk(pidKey.publicJwk) },
  payload: { vct: 'urn:example:pid:1', given_name: 'Erika', family_name: 'Mustermann', age_over_18: true },
  disclosureFrame: { _sd: ['given_name', 'family_name', 'age_over_18'] },
})
await wallet.sdJwtVc.store({
  record: new SdJwtVcRecord({ credentialInstances: [{ compactSdJwtVc: pid.compact, kmsKeyId: pidKey.keyId }] }),
})

// start-section-3
// Called with the request and the origin of the calling website, as provided by the platform
async function handleOpenId4VpDcApiRequest(request: Record<string, unknown>, origin: string) {
  const resolved = await wallet.openid4vc.holder.resolveOpenId4VpAuthorizationRequest(request, { origin })
  if (!resolved.dcql?.queryResult.can_be_satisfied) throw new Error('No matching credentials')

  // Show the verifier and the requested claims to the user and ask for consent here

  const { authorizationResponse } = await wallet.openid4vc.holder.acceptOpenId4VpAuthorizationRequest({
    authorizationRequestPayload: resolved.authorizationRequestPayload,
    dcql: { credentials: wallet.openid4vc.holder.selectCredentialsForDcqlRequest(resolved.dcql.queryResult) },
    origin,
  })

  // Nothing is sent to the verifier, hand this back to the platform
  return authorizationResponse
}
// end-section-3

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

const { verificationSessionId, request } = await postJson('/dc-api/request', {})
const authorizationResponse = await handleOpenId4VpDcApiRequest(request, verifierOrigin)
console.log(await postJson('/dc-api/response', { verificationSessionId, data: authorizationResponse }))

server.close()
await verifier.shutdown()
await wallet.shutdown()
await issuer.shutdown()
