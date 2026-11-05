import { openid4vcBundle } from '@credo-ts/drizzle-storage/openid4vc'
import { exampleStorage } from './example-storage.js'

const storage = await exampleStorage([openid4vcBundle])

// start-section-1
import { Agent } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
import express from 'express'

const app = express()

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    ...storage, // Storage and key management, see Agent setup
    // The key must be `openid4vc` for the module to be available as agent.openid4vc
    openid4vc: new OpenId4VcModule({
      app,
      issuer: {
        baseUrl: 'https://example.com/oid4vci',
        credentialRequestToCredentialMapper,
      },
      verifier: {
        baseUrl: 'https://example.com/oid4vp',
      },
    }),
  },
})

await agent.initialize()

// Credo adds its routes to the app, you start the server. Make https://example.com
// reach this server, for example through a reverse proxy.
const server = app.listen(4022)
// end-section-1

// See openid4vc-issuer.ts for a mapper that issues credentials
async function credentialRequestToCredentialMapper(): Promise<never> {
  throw new Error('This setup example does not issue credentials')
}

server.close()
await agent.shutdown()
