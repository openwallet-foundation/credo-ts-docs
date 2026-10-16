import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import express from 'express'

const app = express()
const store = { id: 'verifier', key: process.env.STORE_KEY ?? '' }
const baseUrl = 'https://verifier.example.com/oid4vp'

// start-section-1
const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({ askar: NativeAskar, store }),
    openid4vc: new OpenId4VcModule({ app, verifier: { baseUrl } }),
  },
})
await agent.initialize()

const { verifier } = agent.openid4vc

// Request one claim from a membership credential
const request = await verifier.createAuthorizationRequest({
  verifierId: 'example-verifier',
  requestSigner: { method: 'x5c', x5c: [accessCertificate] },
  dcql: {
    query: {
      credentials: [
        {
          id: 'membership',
          format: 'dc+sd-jwt',
          meta: { vct_values: ['https://example.com/membership'] },
          claims: [{ path: ['name'] }],
        },
      ],
    },
  },
})

// Show the request as a QR code. Once the wallet responded:
const sessionId = request.verificationSession.id
const { dcql } = await verifier.getVerifiedAuthorizationResponse(sessionId)
// end-section-1

declare const accessCertificate: import('@credo-ts/core').X509Certificate
console.log(dcql)
