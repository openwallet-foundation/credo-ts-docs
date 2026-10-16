import { AskarModule } from '@credo-ts/askar'
import { Agent, ClaimFormat, type SdJwtVcIssuer } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import {
  type OpenId4VciCredentialRequestToCredentialMapper,
  OpenId4VcModule,
} from '@credo-ts/openid4vc'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import express from 'express'

const signer: SdJwtVcIssuer = {
  method: 'did',
  didUrl: 'did:web:issuer.example.com#key-1',
}

const credentialRequestToCredentialMapper: OpenId4VciCredentialRequestToCredentialMapper =
  ({ holderBinding }) => ({
    type: 'credentials',
    format: ClaimFormat.SdJwtDc,
    credentials: holderBinding.keys.map((holder) => ({
      payload: { vct: 'https://example.com/membership', name: 'Jane Doe' },
      holder,
      issuer: signer,
      disclosureFrame: { _sd: ['name'] },
    })),
  })

const app = express()
const store = { id: 'issuer', key: process.env.STORE_KEY ?? '' }

// start-section-1
const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({ askar: NativeAskar, store }),
    openid4vc: new OpenId4VcModule({
      app,
      issuer: {
        baseUrl: 'https://issuer.example.com/oid4vci',
        credentialRequestToCredentialMapper,
      },
    }),
  },
})
await agent.initialize()

const { issuer } = agent.openid4vc

// Offer a credential with the pre-authorized code flow
const offer = await issuer.createCredentialOffer({
  issuerId: 'example-issuer',
  credentialConfigurationIds: ['membership'],
  preAuthorizedCodeFlowConfig: {},
})
// end-section-1

app.listen(3000)
console.log(offer.credentialOffer)
