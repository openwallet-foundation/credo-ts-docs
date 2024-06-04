import type { InitConfig } from '@credo-ts/core'

const config: InitConfig = {
  label: 'docs-agent-nodejs',
  walletConfig: {
    id: 'wallet-id',
    key: 'testkey0000000000000000000000000',
  },
}

// start-section-1
import { Agent } from '@credo-ts/core'
// OpenID4VC issuer and verifier modules only work in Node.JS
import { agentDependencies } from '@credo-ts/node'

import express, { Router } from 'express'
import { OpenId4VcIssuerModule, OpenId4VcVerifierModule } from '@credo-ts/openid4vc'

// Create two express routers, all endpoints for the
// issuer and verifier will be added to these routers
const verifierRouter = Router()
const issuerRouter = Router()

// Register the routers on the express server. The path should match
// with the baseUrl you configure in the modules below.
const app = express()
app.use('/oid4vci', issuerRouter)
app.use('/siop', verifierRouter)

const agent = new Agent({
  config,
  dependencies: agentDependencies,
  modules: {
    openId4VcIssuer: new OpenId4VcIssuerModule({
      baseUrl: 'http://127.0.0.1:3000/oid4vci',

      // If no router is passed, one will be created.
      // you still have to register the router on your express server
      // but you can access it on agent.modules.openId4VcIssuer.config.router
      // It works the same for verifier: agent.modules.openId4VcVerifier.config.router
      router: issuerRouter,

      // Each of the endpoints can have configuration associated with it, such as the
      // path (under the baseUrl) to use for the endpoints.
      endpoints: {
        // The credentialRequestToCredentialMapper is the only required endpoint
        // configuration that must be provided. This method is called whenever a
        // credential request has been received for an offer we created. The callback should
        // return the issued credential to return in the credential response to the holder.
        credential: {
          credentialRequestToCredentialMapper: async () => {
            throw new Error('Not implemented')
          },
        },
      },
    }),

    // openId4VcVerifier module can only be used in Node.JS
    openId4VcVerifier: new OpenId4VcVerifierModule({
      baseUrl: 'http://127.0.0.1:3000/siop',

      router: verifierRouter,
    }),
  },
})

// listen on port 3000 for the openid4vc app.
app.listen(3000)

// end-section-1

agent
  .initialize()
  .then(() => {
    console.log('Agent initialized!')
  })
  .catch((e) => {
    console.error(`Something went wrong while setting up the agent! Message: ${e}`)
  })
