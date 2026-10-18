import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import { DrizzleStorageModule } from '@credo-ts/drizzle-storage'
import { openid4vcBundle } from '@credo-ts/drizzle-storage/openid4vc'
import { agentDependencies } from '@credo-ts/node'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import { drizzle } from 'drizzle-orm/node-postgres'
import express from 'express'

const app = express()
const database = drizzle(process.env.DATABASE_URL ?? '')
const store = { id: 'verifier-keys', key: process.env.STORE_KEY ?? '' }
const baseUrl = 'https://verifier.example.com/oid4vp'

const storage = new DrizzleStorageModule({
  database,
  bundles: [openid4vcBundle],
})
const askar = new AskarModule({
  askar: NativeAskar,
  enableStorage: false,
  store,
})

// start-section-1
const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    storage, // records in Drizzle
    askar, // keys in Askar
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
