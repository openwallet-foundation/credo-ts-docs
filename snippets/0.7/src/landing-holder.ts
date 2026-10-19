import { AskarModule } from '@credo-ts/askar'
import { Agent, Kms, SdJwtVcRecord } from '@credo-ts/core'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
import { agentDependencies } from '@credo-ts/react-native'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'

declare const offerUri: string
declare const walletKey: string
const store = { id: 'wallet', key: walletKey }

// start-section-1
const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({ askar: NativeAskar, store }),
    openid4vc: new OpenId4VcModule(),
  },
})
await agent.initialize()

const { holder } = agent.openid4vc

// Resolve the offer from a QR code and get an access token
const offer = await holder.resolveCredentialOffer(offerUri)
const token = await holder.requestToken({ resolvedCredentialOffer: offer })

// Request the credential, bound to a new key in the wallet
const { credentials } = await holder.requestCredentials({
  resolvedCredentialOffer: offer,
  ...token,
  credentialBindingResolver: async () => {
    const key = await agent.kms.createKey({
      type: { kty: 'EC', crv: 'P-256' },
    })
    return {
      method: 'jwk',
      keys: [Kms.PublicJwk.fromPublicJwk(key.publicJwk)],
    }
  },
})

for (const { record } of credentials) {
  if (record instanceof SdJwtVcRecord) await agent.sdJwtVc.store({ record })
}
// end-section-1
