// The wallet app: a React Native agent, and the credentials it registers with the operating system.
// The request UI in dc-api-wallet-request.tsx opens the same wallet.

// start-section-1
import {
  type DcApiClaimValue,
  type DcApiCredential,
  getSharedContainerPath,
  isSupported,
  registerCredentials,
  type SdJwtClaims,
} from '@animo-id/expo-digital-credentials-api'
import { AskarModule } from '@credo-ts/askar'
import { Agent, DateOnly } from '@credo-ts/core'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
import { agentDependencies } from '@credo-ts/react-native'
import { NativeAskar, Store } from '@openwallet-foundation/askar-react-native'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

// Used by both the app and the request UI
export async function initializeWalletAgent() {
  // On iOS, the config plugin shares the keychain with the request UI
  let walletKey = await SecureStore.getItemAsync('wallet-key')
  if (!walletKey) {
    walletKey = Store.generateRawKey()
    await SecureStore.setItemAsync('wallet-key', walletKey)
  }

  const agent = new Agent({
    dependencies: agentDependencies,
    modules: {
      askar: new AskarModule({
        askar: NativeAskar,
        store: {
          id: 'wallet',
          key: walletKey,
          keyDerivationMethod: 'raw',
          // On iOS the request UI runs in an app extension, which can only read files in the
          // shared app group container. On Android it runs in the app's process.
          database:
            Platform.OS === 'ios'
              ? { type: 'sqlite', config: { path: `${getSharedContainerPath()}/wallet.sqlite` } }
              : undefined,
        },
      }),
      openid4vc: new OpenId4VcModule(),
    },
  })

  await agent.initialize()
  return agent
}

export type WalletAgent = Awaited<ReturnType<typeof initializeWalletAgent>>
// end-section-1

// start-section-2
// Call this on start and whenever the wallet stores or deletes a credential.
// Each call replaces the credentials registered before.
export async function registerWalletCredentials(agent: WalletAgent) {
  if (!isSupported()) return

  const mdocs = (await agent.mdoc.getAll()).map(
    (record): DcApiCredential => ({
      // Comes back in the request when the user picks this credential
      id: record.id,
      display: { title: record.firstCredential.docType },
      credential: {
        format: 'mso_mdoc',
        doctype: record.firstCredential.docType,
        namespaces: Object.fromEntries(
          Object.entries(record.firstCredential.issuerSignedNamespaces).map(([namespace, elements]) => [
            namespace,
            Object.fromEntries(Object.entries(elements).map(([element, value]) => [element, claimValue(value)])),
          ])
        ),
      },
    })
  )

  const sdJwtVcs = (await agent.sdJwtVc.getAll()).map(
    (record): DcApiCredential => ({
      id: record.id,
      display: { title: record.getTags().vct },
      credential: {
        format: 'dc+sd-jwt',
        vct: record.getTags().vct,
        claims: sdJwtClaims(record.firstCredential.prettyClaims),
      },
    })
  )

  // iOS only registers the mdocs whose document type is in the config plugin's `ios.documentTypes`
  await registerCredentials({ credentials: [...mdocs, ...sdJwtVcs] })
}
// end-section-2

// The Android picker shows these values and matches requests against them.
// Values it can't compare, such as arrays and images, are registered as null.
function claimValue(value: unknown): DcApiClaimValue {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (value instanceof Date || value instanceof DateOnly) return value.toISOString()
  return null
}

function sdJwtClaims(claims: object): SdJwtClaims {
  return Object.fromEntries(
    Object.entries(claims).map(([name, value]) => [
      name,
      typeof value === 'object' && value !== null && !Array.isArray(value) ? sdJwtClaims(value) : claimValue(value),
    ])
  )
}
