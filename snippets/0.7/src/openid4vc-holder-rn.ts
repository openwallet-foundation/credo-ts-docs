// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent, X509Module } from '@credo-ts/core'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
import { agentDependencies } from '@credo-ts/react-native'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'

// PEM certificates (or root CAs) of the issuers and verifiers the wallet trusts, bundled with the app
const trustedCertificates = ['-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----']

export const holder = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      // In a real wallet, derive the key from a secret in the device's secure storage
      store: { id: 'holder', key: 'holder-key' },
    }),
    x509: new X509Module({ trustedCertificates }),
    openid4vc: new OpenId4VcModule(),
  },
})

await holder.initialize()
// end-section-1
