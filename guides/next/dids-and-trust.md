# DIDs

> Choose between X.509 certificates and DIDs, pick a DID method, and create, resolve and import DIDs with agent.dids.

Credo uses DIDs to sign and verify credentials, as AnonCreds issuer identifiers, and for DIDComm connections. `agent.dids` creates, resolves and imports DIDs, and keeps track of the ones your agent controls. For what DIDs are, see [DIDs and DIDComm](https://credo.js.org/guides/next/concepts/did-and-didcomm.md).

## X.509 certificates or DIDs

An issuer signs with a key that's bound to an [X.509 certificate](https://credo.js.org/guides/next/dids-and-trust/x509.md) or to a DID. The credential format and the ecosystem usually decide which one:

| You issue | Identify the issuer with |
| --- | --- |
| mdoc | An X.509 certificate. mdoc doesn't support DIDs. |
| SD-JWT VC for HAIP or EUDI wallets | An X.509 certificate chain (`x5c`) that leads to a root the verifier trusts. |
| SD-JWT VC in other ecosystems | An X.509 certificate or a DID. |
| W3C VC | A DID. W3C credentials can't be signed with a certificate. |
| AnonCreds | A DID on the network of the [AnonCreds registry](https://credo.js.org/guides/next/credential-formats/anoncreds.md). |

As a rule of thumb: use X.509 certificates for OpenID4VC, and DIDs for DIDComm and AnonCreds. OpenID4VP verifiers make the same choice for their client identifier, see [Verifying credentials](https://credo.js.org/guides/next/protocols/openid4vc/verifier.md). How a verifier decides whether to accept the signer is on [Trusted issuers](https://credo.js.org/guides/next/dids-and-trust/trust.md).

## Choose a DID method

| You need | Use |
| --- | --- |
| A holder DID, or a DID for tests | `did:key` (default) or `did:jwk`. The DID contains the public key, so there's nothing to publish. |
| DIDComm connections | `did:peer`. DIDComm creates these for each connection. |
| A public issuer DID without a ledger | `did:web` (default) to host a DID document under your domain. `did:webvh` adds a verifiable history of the document, and can hold AnonCreds objects. |
| An AnonCreds issuer on a ledger | The method of the network your ecosystem uses: `did:indy` (Indy networks such as Sovrin), `did:cheqd` or `did:hedera`. |

## Supported DID methods

| Method | Create | Update | Deactivate | Resolve | Package |
| --- | --- | --- | --- | --- | --- |
| `did:key` | Yes | No | No | Yes | `@credo-ts/core` |
| `did:jwk` | Yes | No | No | Yes | `@credo-ts/core` |
| `did:peer` | Yes | No | No | Yes | `@credo-ts/core` |
| `did:web` | Import only | No | No | Yes | `@credo-ts/core` |
| `did:webvh` | Yes | Yes | No | Yes | [`@credo-ts/webvh`](https://credo.js.org/guides/next/dids-and-trust/webvh.md) |
| `did:cheqd` | Yes | Yes | Yes | Yes | [`@credo-ts/cheqd`](https://credo.js.org/guides/next/dids-and-trust/cheqd.md) |
| `did:indy` | Yes | No | No | Yes | [`@credo-ts/indy-vdr`](https://credo.js.org/guides/next/dids-and-trust/indy-vdr.md) |
| `did:sov` | No | No | No | Yes | [`@credo-ts/indy-vdr`](https://credo.js.org/guides/next/dids-and-trust/indy-vdr.md) |
| `did:hedera` | Yes | Yes | Yes | Yes | [`@credo-ts/hedera`](https://credo.js.org/guides/next/dids-and-trust/hedera.md) |

## Create a DID

`agent.dids.create` creates the DID and its keys, registers it when the method needs that, and stores a `DidRecord`. The record links the verification methods to the keys in the [KMS](https://credo.js.org/guides/next/agent-setup/key-management.md), so the agent can sign with the DID later.

```ts
const { didState } = await agent.dids.create<KeyDidCreateOptions>({
  method: 'key',
  options: { createKey: { type: { kty: 'OKP', crv: 'Ed25519' } } },
})

// Registrars report failures in the result instead of throwing
if (didState.state !== 'finished') {
  throw new Error(`Creating the did failed: ${didState.state === 'failed' ? didState.reason : didState.state}`)
}

// A did:key has one verification method, identified by the key fingerprint
const didKey = DidKey.fromDid(didState.did)
const verificationMethodId = `${didKey.did}#${didKey.publicJwk.fingerprint}`
```

The generic parameter (`KeyDidCreateOptions`, `JwkDidCreateOptions`, `CheqdDidCreateOptions`, and so on) types the options for the method. Registrars return failures instead of throwing, so always check `didState.state`:

- `finished`: `didState.did` and `didState.didDocument` are set.
- `failed`: `didState.reason` says why.
- `action` or `wait`: the method needs another step, for example an endorsement of an Indy transaction.

To use a key that's already in the KMS, pass its `keyId` instead of `createKey`:

```ts
const { keyId } = await agent.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })

const jwkResult = await agent.dids.create<JwkDidCreateOptions>({
  method: 'jwk',
  options: { keyId },
})
if (jwkResult.didState.state !== 'finished') throw new Error('Creating the did:jwk failed')

// The verification method of a did:jwk is always `#0`
const jwkVerificationMethodId = `${jwkResult.didState.did}#0`
```

## Resolve a DID

```ts
const resolution = await agent.dids.resolve(didState.did)
if (!resolution.didDocument) {
  throw new Error(`Resolving failed: ${resolution.didResolutionMetadata.error}`)
}

// resolveDidDocument returns the document, or throws when resolution fails
const didDocument = await agent.dids.resolveDidDocument(didState.did)
const verificationMethod = didDocument.dereferenceKey(verificationMethodId, ['assertionMethod'])
```

`resolve` returns the full resolution result, with `didResolutionMetadata.error` when resolution fails. `resolveDidDocument` returns only the document and throws on failure.

Credo parses DID URLs strictly, as DID Core 1.0 defines them, and returns `invalidDid` for DIDs with matrix parameters (`;key=value`), unencoded characters or invalid percent escapes. For `did:web`, `notFound` means an HTTP 404 or a document whose `id` isn't the DID; network, HTTP and JSON failures return `resolutionError`.

Credo caches resolved documents for 5 minutes for methods whose resolver allows it (`did:web`, `did:webvh`, `did:cheqd`, `did:indy`, `did:sov` and `did:hedera`). Pass `{ useCache: false }` to `resolve` to skip the cache, or `cacheDurationInSeconds` to change the duration. For DIDs that you created or imported, these resolvers (except `did:sov`) return the document from your `DidRecord` instead of fetching it.

## Import a DID

Import a DID that you created outside Credo, such as a `did:web` (there's no `did:web` registrar) or an existing ledger DID. `keys` links verification methods in the document to keys in the KMS. Without it the agent can resolve the DID, but not sign with it.

```ts
const did = 'did:web:issuer.example.com'
const webKey = await agent.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })

const webVerificationMethod = getMultikey({
  did,
  verificationMethodId: `${did}#key-1`,
  publicJwk: PublicJwk.fromPublicJwk(webKey.publicJwk),
})

const webDidDocument = new DidDocumentBuilder(did)
  .addContext('https://w3id.org/security/multikey/v1')
  .addVerificationMethod(webVerificationMethod)
  .addAuthentication(webVerificationMethod.id)
  .addAssertionMethod(webVerificationMethod.id)
  .build()

await agent.dids.import({
  did,
  didDocument: webDidDocument,
  // Links the verification method to the KMS key, so the agent can sign with this did
  keys: [{ didDocumentRelativeKeyId: '#key-1', kmsKeyId: webKey.keyId }],
})

// Host this JSON at https://issuer.example.com/.well-known/did.json
const didJson = webDidDocument.toJSON()
```

`PublicJwk` comes from `@credo-ts/core/kms`. Without `didDocument`, Credo resolves the DID to get the document. Importing a DID that already exists throws, unless you pass `overwrite: true`. Credo agents that resolve your `did:web` reject a hosted document whose `id` isn't the DID.

To list the DIDs your agent created or imported, use `getCreatedDids`, optionally filtered by `method` or `did`:

```ts
const createdWebDids = await agent.dids.getCreatedDids({ method: 'web' })
```

## Configure DID methods

`DidsModule` is registered by default under the key `dids`, with these registrars and resolvers:

- Registrars: `did:key`, `did:peer` and `did:jwk`.
- Resolvers: `did:web`, `did:key`, `did:peer` and `did:jwk`.

To add a method, register `DidsModule` yourself. The packages for ledger and web methods don't add their registrar and resolver to `DidsModule`, so you always list them:

```ts
import {
  Agent,
  DidsModule,
  JwkDidRegistrar,
  JwkDidResolver,
  KeyDidRegistrar,
  KeyDidResolver,
  PeerDidRegistrar,
  PeerDidResolver,
  WebDidResolver,
} from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { WebVhDidRegistrar, WebVhDidResolver, WebVhModule } from '@credo-ts/webvh'

const didModules = {
  webvh: new WebVhModule(),
  dids: new DidsModule({
    // These lists replace the defaults, so include the built-in methods you still need
    registrars: [new KeyDidRegistrar(), new PeerDidRegistrar(), new JwkDidRegistrar(), new WebVhDidRegistrar()],
    resolvers: [
      new KeyDidResolver(),
      new PeerDidResolver(),
      new JwkDidResolver(),
      new WebDidResolver(),
      new WebVhDidResolver(),
    ],
  }),
}
```

:::warning[Your lists replace the defaults]
Passing `registrars` or `resolvers` replaces the default list. Credo adds the `did:key` and `did:peer` registrar and resolver back, because DIDComm needs them, but not `did:web` and `did:jwk`. Include `WebDidResolver`, `JwkDidResolver` and `JwkDidRegistrar` yourself if you still need them.
:::

`publicDidMethods` lists the methods whose documents are the same for every agent context. With [multi-tenancy](https://credo.js.org/guides/next/agent-setup/multi-tenancy.md), their documents are cached once for all tenants instead of per tenant. The default is `['web', 'indy', 'sov', 'cheqd', 'hedera', 'webvh']`.

## did:jwk

The JWK `use` sets the verification relationships of a `did:jwk` document: `sig` allows only signing (`assertionMethod`, `authentication` and the capability relationships), `enc` only `keyAgreement`. Without `use`, the key type decides: Ed25519 signs, X25519 does key agreement, and P-256 does both. Resolving a `did:jwk` whose JWK contains private key material fails.

## Next steps

- [X.509 certificates](https://credo.js.org/guides/next/dids-and-trust/x509.md): Create self-signed and CA-issued X.509 certificates and certificate signing requests with agent.x509, parse certificates, validate chains and check revocation.
- [Trusted issuers](https://credo.js.org/guides/next/dids-and-trust/trust.md): How Credo decides whether to trust the issuer of a credential or the signer of a request, what it does by default, and how to configure trust with getTrustedIssuersForVerification and trusted X.509 certificates.
- [cheqd](https://credo.js.org/guides/next/dids-and-trust/cheqd.md): Create, update and deactivate did:cheqd DIDs, publish DID-linked resources, and use cheqd as an AnonCreds registry with @credo-ts/cheqd.
- [Indy VDR](https://credo.js.org/guides/next/dids-and-trust/indy-vdr.md): Connect to Hyperledger Indy networks with @credo-ts/indy-vdr to resolve did:indy and did:sov, register did:indy DIDs with an endorser, and use Indy as an AnonCreds registry.
- [Hedera](https://credo.js.org/guides/next/dids-and-trust/hedera.md): Create, update, deactivate and resolve did:hedera DIDs, and use Hedera as an AnonCreds registry with @credo-ts/hedera.
- [did:webvh](https://credo.js.org/guides/next/dids-and-trust/webvh.md): Create, update and resolve did:webvh DIDs with @credo-ts/webvh, host the DID log, and use did:webvh as an AnonCreds registry.
