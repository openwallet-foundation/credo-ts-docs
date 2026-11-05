# Building a wallet

> Answer W3C Digital Credentials API requests from websites in a React Native wallet with @animo-id/expo-digital-credentials-api and Credo. Register credentials with the operating system, share the store with the iOS extension, and answer OpenID4VP and org-iso-mdoc requests.

When a website calls the Digital Credentials API, the operating system offers the wallets that hold a matching credential, and opens the one the user picks with the request and the origin of the website. In a React Native wallet, [`@animo-id/expo-digital-credentials-api`](https://github.com/animo/expo-digital-credentials-api) handles the platform side: it registers credentials with Credential Manager on Android and Identity Document Services on iOS, and shows your request UI. Credo resolves the request and creates the response. This page builds a minimal wallet that answers both OpenID4VP and `org-iso-mdoc` requests. [Digital Credentials API](https://credo.js.org/guides/next/protocols/dc-api.md) explains the flow and which protocols to support, and the [module README](https://github.com/animo/expo-digital-credentials-api#readme) has all options and platform details.

[Paradym Wallet](https://github.com/animo/paradym-wallet), an open source wallet built on Credo, supports the API this way. See its [request handling](https://github.com/animo/paradym-wallet/blob/main/packages/sdk/src/dcApi/ParadymDcApiSdk.ts), [credential registration](https://github.com/animo/paradym-wallet/blob/main/packages/sdk/src/dcApi/registerCredentials.ts) and [request UI](https://github.com/animo/paradym-wallet/tree/main/apps/wallet/src/features/dc-api) for a complete implementation.

## Set up

The wallet is a React Native agent, see [Installation](https://credo.js.org/guides/next/getting-started/installation.md). Add the module, and `expo-secure-store` for the wallet key:

```bash
npm install @animo-id/expo-digital-credentials-api expo-secure-store
```

Add the config plugin to `app.json` and run `npx expo prebuild`:

```json
{
  "expo": {
    "plugins": [
      [
        "@animo-id/expo-digital-credentials-api",
        {
          "entry": "src/dc-api-wallet-request",
          "ios": { "documentTypes": ["org.iso.18013.5.1.mDL"] }
        }
      ]
    ]
  }
}
```

- The module needs Expo SDK 55 and React Native 0.83 or later. On these SDKs, npm only installs Credo with the `expo-crypto` override from [Installation](https://credo.js.org/guides/next/getting-started/installation.md). It works on Android devices whose Credential Manager has the registry API, and on iOS 26 and later. The app itself can still support older iOS versions.
- `entry` is the file with the request UI, without extension.
- `ios.documentTypes` are the mdoc document types the wallet can present on iOS, from the set Apple allows: `org.iso.18013.5.1.mDL`, `eu.europa.ec.eudi.pid.1`, `eu.europa.ec.av.1`, `org.iso.23220.photoid.1` and `org.iso.23220.1.jp.mnc`. Without it, the plugin doesn't add the iOS app extension. Android needs no options.

### Share the wallet with the request UI

The app and the request UI open the same wallet:

```ts
import {
  type DcApiClaimValue,
  type DcApiCredential,
  getRegistrationStatus,
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
```

On iOS, the request UI runs in an app extension, a separate process that can't read the app's files. The config plugin creates an app group, and `getSharedContainerPath()` returns a directory that both can use. A wallet that already has a store elsewhere has to move it there first. The plugin also shares the keychain between the app and the extension, so both read the same wallet key. On Android, the request UI runs in the app's process.

## Register credentials

The operating system only offers the wallet for a request that matches a registered credential:

```ts
// Call this on start and whenever the wallet stores or deletes a credential.
// Each call replaces the credentials registered before.
export async function registerWalletCredentials(agent: WalletAgent) {
  if (!isSupported()) return
  // iOS asks the user for permission on the first registration. Registering after they denied it throws.
  if ((await getRegistrationStatus()) === 'notAuthorized') return

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
```

- On Android, a matcher runs in a sandbox and compares each request with the registered claims. The system picker shows the matching credentials with their values, so register the values: the full example converts them. Each call replaces the registered set, so pass all credentials.
- iOS only registers mdocs whose document type is in `ios.documentTypes`, and only keeps their id and document type. It matches on the document type, so a request can reach the wallet for elements the mdoc doesn't have. SD-JWT VCs aren't registered there.
- The first registration on iOS asks the user for permission.

## Answer requests

When the user picks a credential of the wallet, the operating system starts the request UI. Credo resolves the request for the origin and creates the response:

**OpenID4VP**

```ts
export async function createOpenId4VpResponse(
  agent: WalletAgent,
  { protocol, data }: Openid4vpProtocolRequest,
  origin: string
): Promise<Openid4vpResponseOptions> {
  // The request arrives as a JSON string
  const resolved = await agent.openid4vc.holder.resolveOpenId4VpAuthorizationRequest(JSON.parse(data), { origin })
  if (!resolved.dcql?.queryResult.can_be_satisfied) throw new Error('No matching credentials')

  const { authorizationResponse } = await agent.openid4vc.holder.acceptOpenId4VpAuthorizationRequest({
    authorizationRequestPayload: resolved.authorizationRequestPayload,
    dcql: { credentials: agent.openid4vc.holder.selectCredentialsForDcqlRequest(resolved.dcql.queryResult) },
    origin,
  })

  // Answer with the protocol of the request
  return { protocol, data: authorizationResponse }
}
```

- Pass the `origin` to both `resolveOpenId4VpAuthorizationRequest` and `acceptOpenId4VpAuthorizationRequest`. The holder rejects a DC API request without it, and a signed request whose `expected_origins` doesn't include it.
- A signed request only resolves when the wallet trusts the verifier's certificate. See [Presenting credentials](https://credo.js.org/guides/next/protocols/openid4vc/present.md).
- `acceptOpenId4VpAuthorizationRequest` doesn't send anything. It returns `authorizationResponse` for you to hand back to the platform, with the protocol of the request.

**ISO 18013-7 Annex C**

```ts
export async function createIsoMdocResponse(
  agent: WalletAgent,
  { data }: IsoMdocProtocolRequest,
  origin: string
): Promise<IsoMdocResponseOptions> {
  const resolved = await agent.mdoc.resolveDcApiRequest({ request: data, origin })
  if (!resolved.success || resolved.docRequestsAsAlternatives) throw new Error('No matching mdoc')

  const { response } = await agent.mdoc.createDcApiResponse({
    resolvedRequest: resolved,
    credentials: resolved.docRequests.map(({ docRequestIndex, validCredentials }) => ({
      docRequestIndex,
      record: validCredentials[0].record,
    })),
  })

  return { protocol: 'org-iso-mdoc', data: { response } }
}
```

- `resolveDcApiRequest` rejects a request without an origin. It verifies reader authentication and matches the stored mdocs against each document request. `success` is `false` when they can't satisfy the request.
- A signed request from a reader you don't trust throws. Trust readers through the agent's trust configuration with verification type `mdocReaderAuth`, or pass `trustedReaderCertificates`. `readerAuth.certificateChain` on each document request has the verified chain, leaf first, to show the verifier to the user.
- `createDcApiResponse` discloses every requested element. Pass `elements` per credential to disclose fewer, for example to leave out the ones the user declined. It sends nothing: hand the returned `response` back to the platform.

Both functions present the first stored credential that matches. On Android, `request.selection.credentialIds` has the ids of the credentials the user picked in the system picker, so a full wallet presents those.

### The request UI

The request UI calls these functions when the user shares:

```tsx
async function share() {
  // Always use the origin from the operating system. On Android it's undefined when an app asks
  // for itself instead of a website.
  const { origin } = request
  if (!origin) return request.decline('No website origin')

  const agent = await initializeWalletAgent()
  try {
    if (request.platform === 'ios') {
      // iOS only hands over the request once the user approved, and only as org-iso-mdoc
      const [isoMdocRequest] = await request.approve()
      if (!isoMdocRequest) return request.decline('No org-iso-mdoc request')
      return await request.respond(await createIsoMdocResponse(agent, isoMdocRequest, origin))
    }

    // On Android, the request that the credentials picked in the system picker were matched against
    const { requests, selection } = request
    const protocolRequest = requests[selection?.requestIndex ?? selection?.candidateRequestIndexes[0] ?? 0]
    if (!protocolRequest) return request.decline('No supported protocol')

    await request.respond(
      protocolRequest.protocol === 'org-iso-mdoc'
        ? await createIsoMdocResponse(agent, protocolRequest, origin)
        : await createOpenId4VpResponse(agent, protocolRequest, origin)
    )
  } catch (shareError) {
    // The request stays open, so the user can try again or decline
    setError(shareError instanceof Error ? shareError.message : String(shareError))
  } finally {
    await agent.shutdown()
  }
}
```

- Always use the origin from the operating system, never one from the request. On Android it's undefined when an app asks for itself instead of a website.
- On Android, `requests` has the requests the page passed, and `selection` what the user picked in the system picker and the request it matched. With several requests of the same protocol, the matcher only reports the protocol, so the example takes the first candidate.
- iOS has no picker, and hands over the request only after `approve()`, always as `org-iso-mdoc`. Before that, `request.presentmentRequests` has the document types and elements the operating system parsed from it, to show on the consent screen.
- `respond()` sends the response through the operating system to the page, `decline()` cancels. Until then the request stays open, so the user can try again after an error.

The entry file registers the screen:

```tsx
// The entry file registers the screen
export default registerDcApiScreen(DcApiScreen)
```

The request UI is bundled separately from the app. Import only what it needs: on iOS the extension gets little memory, and `ios.excludedPackages` or `ios.includedPackages` limit which native modules it links. The module README also lists known issues with some native modules in the request UI, and patches for them.

## Full example

Render the app's screens as usual and call `registerWalletCredentials` after the wallet stores or deletes a credential. The request UI is `dc-api-wallet-request.tsx`.

**dc-api-wallet-agent.ts**

```ts
// The wallet app: a React Native agent, and the credentials it registers with the operating system.
// The request UI in dc-api-wallet-request.tsx opens the same wallet.

import {
  type DcApiClaimValue,
  type DcApiCredential,
  getRegistrationStatus,
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

// Call this on start and whenever the wallet stores or deletes a credential.
// Each call replaces the credentials registered before.
export async function registerWalletCredentials(agent: WalletAgent) {
  if (!isSupported()) return
  // iOS asks the user for permission on the first registration. Registering after they denied it throws.
  if ((await getRegistrationStatus()) === 'notAuthorized') return

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
```

**dc-api-wallet-response.ts**

```ts
// What Credo does in the wallet's request UI (dc-api-wallet-request.tsx): resolve the request for
// the origin the operating system passed, and create the response to hand back to it.
import type {
  IsoMdocProtocolRequest,
  IsoMdocResponseOptions,
  Openid4vpProtocolRequest,
  Openid4vpResponseOptions,
} from '@animo-id/expo-digital-credentials-api/request-handler'
import type { WalletAgent } from './dc-api-wallet-agent.js'

export async function createOpenId4VpResponse(
  agent: WalletAgent,
  { protocol, data }: Openid4vpProtocolRequest,
  origin: string
): Promise<Openid4vpResponseOptions> {
  // The request arrives as a JSON string
  const resolved = await agent.openid4vc.holder.resolveOpenId4VpAuthorizationRequest(JSON.parse(data), { origin })
  if (!resolved.dcql?.queryResult.can_be_satisfied) throw new Error('No matching credentials')

  const { authorizationResponse } = await agent.openid4vc.holder.acceptOpenId4VpAuthorizationRequest({
    authorizationRequestPayload: resolved.authorizationRequestPayload,
    dcql: { credentials: agent.openid4vc.holder.selectCredentialsForDcqlRequest(resolved.dcql.queryResult) },
    origin,
  })

  // Answer with the protocol of the request
  return { protocol, data: authorizationResponse }
}

export async function createIsoMdocResponse(
  agent: WalletAgent,
  { data }: IsoMdocProtocolRequest,
  origin: string
): Promise<IsoMdocResponseOptions> {
  const resolved = await agent.mdoc.resolveDcApiRequest({ request: data, origin })
  if (!resolved.success || resolved.docRequestsAsAlternatives) throw new Error('No matching mdoc')

  const { response } = await agent.mdoc.createDcApiResponse({
    resolvedRequest: resolved,
    credentials: resolved.docRequests.map(({ docRequestIndex, validCredentials }) => ({
      docRequestIndex,
      record: validCredentials[0].record,
    })),
  })

  return { protocol: 'org-iso-mdoc', data: { response } }
}
```

**dc-api-wallet-request.tsx**

```tsx
// The request UI of the wallet: the `entry` file of the config plugin. The operating system shows it
// when the user picks a credential of this wallet for a website. It's bundled separately from the app,
// and on iOS runs in its own process, so it opens the wallet itself.

import { type DcApiRequest, registerDcApiScreen } from '@animo-id/expo-digital-credentials-api/request-handler'
import { useState } from 'react'
import { Button, Text, View } from 'react-native'
import { initializeWalletAgent } from './dc-api-wallet-agent.js'
import { createIsoMdocResponse, createOpenId4VpResponse } from './dc-api-wallet-response.js'

function DcApiScreen({ request }: { request: DcApiRequest }) {
  const [error, setError] = useState<string>()

  async function share() {
    // Always use the origin from the operating system. On Android it's undefined when an app asks
    // for itself instead of a website.
    const { origin } = request
    if (!origin) return request.decline('No website origin')

    const agent = await initializeWalletAgent()
    try {
      if (request.platform === 'ios') {
        // iOS only hands over the request once the user approved, and only as org-iso-mdoc
        const [isoMdocRequest] = await request.approve()
        if (!isoMdocRequest) return request.decline('No org-iso-mdoc request')
        return await request.respond(await createIsoMdocResponse(agent, isoMdocRequest, origin))
      }

      // On Android, the request that the credentials picked in the system picker were matched against
      const { requests, selection } = request
      const protocolRequest = requests[selection?.requestIndex ?? selection?.candidateRequestIndexes[0] ?? 0]
      if (!protocolRequest) return request.decline('No supported protocol')

      await request.respond(
        protocolRequest.protocol === 'org-iso-mdoc'
          ? await createIsoMdocResponse(agent, protocolRequest, origin)
          : await createOpenId4VpResponse(agent, protocolRequest, origin)
      )
    } catch (shareError) {
      // The request stays open, so the user can try again or decline
      setError(shareError instanceof Error ? shareError.message : String(shareError))
    } finally {
      await agent.shutdown()
    }
  }

  return (
    <View style={{ flex: 1, gap: 16, padding: 24, backgroundColor: 'white' }}>
      <Text>{request.origin ?? 'An app'} asks for:</Text>
      {/* On Android the system picker already showed the credential. iOS has no picker, so show
          what the operating system parsed from the request. */}
      {request.platform === 'ios' &&
        request.presentmentRequests
          .flatMap(({ documentRequestSets }) => documentRequestSets.flatMap((set) => set.documentRequests))
          .map(({ doctype, namespaces }) => (
            <Text key={doctype}>
              {doctype}: {Object.values(namespaces).flatMap(Object.keys).join(', ')}
            </Text>
          ))}
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <Button title="Share" onPress={share} />
      <Button title="Decline" onPress={() => request.decline()} />
    </View>
  )
}

// The entry file registers the screen
export default registerDcApiScreen(DcApiScreen)
```

## Next steps

- [Building a verifier](https://credo.js.org/guides/next/protocols/dc-api/verifier.md): the other side of the flow.
- [Presenting credentials](https://credo.js.org/guides/next/protocols/openid4vc/present.md): resolve OpenID4VP requests and select credentials.
- [Trusted issuers](https://credo.js.org/guides/next/dids-and-trust/trust.md): decide which issuers, verifiers and readers your wallet trusts.
- [Proximity (ISO 18013-5)](https://credo.js.org/guides/next/protocols/mdoc/proximity.md): present mdocs in person.
