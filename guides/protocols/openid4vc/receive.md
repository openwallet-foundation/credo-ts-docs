# Receiving credentials

> Receive credentials with OpenID4VCI in a Credo wallet on Node.js or React Native, bind them to the wallet's keys and store them.

This page covers the holder side of OpenID4VCI: resolving a credential offer, getting an access token, requesting the credentials and storing them. The holder API is the same on Node.js and React Native. The examples continue the SD-JWT VC flow from [Issuing credentials](https://credo.js.org/guides/protocols/openid4vc/issuer.md). To present the credentials afterwards, see [Presenting credentials](https://credo.js.org/guides/protocols/openid4vc/present.md).

## Set up the holder

Register `OpenId4VcModule` without options. The holder part is always available as `agent.openid4vc.holder`.

**Node.js**

```ts
import { Agent, Kms, MdocRecord, SdJwtVcRecord, W3cCredentialRecord, X509Module } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import {
  type OpenId4VciCredentialBindingResolver,
  OpenId4VcModule,
  preAuthorizedCodeGrantIdentifier,
} from '@credo-ts/openid4vc'
import { issuerCertificate } from './openid4vc-issuer.js'
import { verifierCertificate } from './openid4vc-verifier.js'

export const holder = new Agent({
  config: {
    // Allows the http://localhost URLs of this example. Never enable this in production.
    allowInsecureHttpUrls: true,
  },
  dependencies: agentDependencies,
  modules: {
    ...storage, // Storage and key management, see Agent setup
    // Certificates (or root CAs) of the issuers and verifiers you trust
    x509: new X509Module({ trustedCertificates: [issuerCertificate, verifierCertificate] }),
    openid4vc: new OpenId4VcModule(),
  },
})

await holder.initialize()
```

**React Native**

```ts
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
```

The holder verifies the credentials it receives, and later the requests of verifiers. To verify X.509 signatures, it needs the certificates, or root CAs, of the issuers and verifiers you trust. The Node.js example trusts the certificates from the [issuer](https://credo.js.org/guides/protocols/openid4vc/issuer.md) and [verifier](https://credo.js.org/guides/protocols/openid4vc/verifier.md) examples. See [Trusted issuers](https://credo.js.org/guides/dids-and-trust/trust.md). For storage and keys, see [Storage](https://credo.js.org/guides/agent-setup/storage.md) and [Key management](https://credo.js.org/guides/agent-setup/key-management.md). The React Native example uses [Askar](https://credo.js.org/guides/agent-setup/storage/askar.md), the default for mobile wallets.

## Resolve the offer

The wallet gets a credential offer URI from a QR code or a link. `resolveCredentialOffer` fetches the offer and the issuer metadata:

```ts
const resolvedCredentialOffer = await holder.openid4vc.holder.resolveCredentialOffer(credentialOffer)

// What to show the user: the issuer, the offered credentials and whether a code is needed
const issuerName = resolvedCredentialOffer.metadata.credentialIssuer.display?.[0]?.name
const offeredCredentials = Object.keys(resolvedCredentialOffer.offeredCredentialConfigurations)
const txCodeRequest =
  resolvedCredentialOffer.credentialOfferPayload.grants?.[preAuthorizedCodeGrantIdentifier]?.tx_code
```

Use the issuer metadata and `offeredCredentialConfigurations` to show the user who offers what. Display names, colors and claim labels are under `credential_metadata` of each configuration, or at its top level for issuers that implement draft 15. If `txCodeRequest` is defined, the issuer sent the user a code (by email, for example), and `description`, `length` and `input_mode` tell you what to ask for.

## Request an access token

In the pre-authorized code flow, exchange the code from the offer for an access token, with the transaction code the user entered:

```ts
// txCode is the code the user received from the issuer, if txCodeRequest is defined
const token = await holder.openid4vc.holder.requestToken({ resolvedCredentialOffer, txCode })
```

If the issuer supports DPoP, Credo creates the DPoP proof and returns its options in `token.dpop`. Pass them to the next calls. PKCE and DPoP need nothing else from you. Issuers that follow HAIP also ask for wallet attestations and key attestations, which your wallet gets from its wallet provider's backend. [Authorization and wallet security](https://credo.js.org/guides/protocols/openid4vc/authorization.md) covers those and offers that use the authorization code flow.

## Request the credentials

The issuer binds each credential to a key the holder controls. Credo calls your `credentialBindingResolver` once for each offered credential configuration, with what the issuer supports, and you return the keys to bind to:

```ts
const credentialBindingResolver: OpenId4VciCredentialBindingResolver = async ({ supportsJwk, proofTypes }) => {
  // The algorithms the issuer accepts for this credential that the wallet's KMS supports
  const algorithm = proofTypes.jwt?.supportedSignatureAlgorithms[0]
  if (!supportsJwk || !algorithm) throw new Error('The issuer does not support jwk binding with a jwt proof')

  const key = await holder.kms.createKeyForSignatureAlgorithm({ algorithm })
  return { method: 'jwk', keys: [Kms.PublicJwk.fromPublicJwk(key.publicJwk)] }
}
```

The resolver returns one of:

| Binding | Use for |
| --- | --- |
| `{ method: 'jwk', keys }` | SD-JWT VC and mdoc. Keys from the agent's KMS. This is the default choice, and what HAIP requires. |
| `{ method: 'did', didUrls }` | W3C formats, which can't bind to a bare key. Verification methods of DIDs the agent created, when the issuer lists the DID method in `supportedDidMethods` or accepts all (`supportsAllDidMethods`). Not allowed for mdoc. |
| `{ method: 'attestation', keyAttestationJwt }` | Issuers that require key attestations. See [Authorization and wallet security](https://credo.js.org/guides/protocols/openid4vc/authorization.md#wallet-and-key-attestations). |

To receive a batch, return up to `issuerMaxBatchSize` keys of the same key type, and you get one credential instance per key.

Then request the credentials:

```ts
const { credentials, deferredCredentials } = await holder.openid4vc.holder.requestCredentials({
  resolvedCredentialOffer,
  accessToken: token.accessToken,
  cNonce: token.cNonce,
  dpop: token.dpop,
  credentialBindingResolver,
})
```

By default this requests every credential in the offer. Pass `credentialConfigurationIds` to request only some of them.

## Store the credentials

`requestCredentials` verifies each credential, including the issuer's signature and trust, but it doesn't store anything. Each result has a `record` that you store with the API for its format:

```ts
// requestCredentials verifies the credentials, but doesn't store them
for (const { record } of credentials) {
  if (record instanceof SdJwtVcRecord) await holder.sdJwtVc.store({ record })
  else if (record instanceof MdocRecord) await holder.mdoc.store({ record })
  else if (record instanceof W3cCredentialRecord) await holder.w3cCredentials.store({ record })
  else await holder.w3cV2Credentials.store({ record })
}
```

A batch arrives as one record with several instances in `record.credentialInstances`. If the issuer defers issuance, the credential is in `deferredCredentials` instead: call `requestDeferredCredentials` with its `transactionId` after `interval` seconds. If a credential has a `notificationId`, tell the issuer whether you stored it with `sendNotification` (`credential_accepted`, `credential_deleted` or `credential_failure`).

## Next steps

- [Presenting credentials](https://credo.js.org/guides/protocols/openid4vc/present.md): present the stored credentials to a verifier.
- [Authorization and wallet security](https://credo.js.org/guides/protocols/openid4vc/authorization.md): offers with the authorization code flow, and wallet and key attestations.
- [SD-JWT VC with OpenID4VC](https://credo.js.org/guides/protocols/openid4vc/sd-jwt-vc.md) and [mdoc with OpenID4VC](https://credo.js.org/guides/protocols/openid4vc/mdoc.md): format details for wallets.
- [Trusted issuers](https://credo.js.org/guides/dids-and-trust/trust.md): decide which issuers your wallet accepts.
