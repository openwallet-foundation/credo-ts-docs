# cheqd

> Create, update and deactivate did:cheqd DIDs, publish DID-linked resources, and use cheqd as an AnonCreds registry with @credo-ts/cheqd.

[cheqd](https://cheqd.io) is a Cosmos-based network for DIDs and DID-linked resources: data such as logos, schemas or status lists, published under a DID and controlled with its keys. `@credo-ts/cheqd` adds the `did:cheqd` method, DID-linked resources and an AnonCreds registry. Ledger writes cost CHEQ tokens, paid by a Cosmos account that you configure.

Use `did:cheqd` when your ecosystem uses cheqd, for example to issue AnonCreds credentials on cheqd, or to publish resources under a DID on a public network. For a public issuer DID without a ledger, `did:web` is simpler, see [Choose a DID method](https://credo.js.org/guides/next/dids-and-trust.md#choose-a-did-method).

## Install

```bash
npm install @credo-ts/cheqd@alpha
```

## Configure

Register `CheqdModule` with the networks you use, and add the cheqd registrar and resolver to `DidsModule`:

```ts
import { type CheqdDidCreateOptions, CheqdDidRegistrar, CheqdDidResolver, CheqdModule } from '@credo-ts/cheqd'
import {
  Agent,
  DidDocumentService,
  DidsModule,
  JwkDidRegistrar,
  JwkDidResolver,
  KeyDidRegistrar,
  KeyDidResolver,
  PeerDidRegistrar,
  PeerDidResolver,
  utils,
  WebDidResolver,
} from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'

const cheqdModules = {
  cheqd: new CheqdModule({
    networks: [
      // The payer account pays the fees for ledger writes
      { network: 'testnet', cosmosPayerSeed: process.env.CHEQD_TESTNET_PAYER_MNEMONIC },
      // Without a payer seed you can resolve, but not write
      { network: 'mainnet' },
    ],
  }),
  dids: new DidsModule({
    registrars: [new KeyDidRegistrar(), new PeerDidRegistrar(), new JwkDidRegistrar(), new CheqdDidRegistrar()],
    resolvers: [
      new KeyDidResolver(),
      new PeerDidResolver(),
      new JwkDidResolver(),
      new WebDidResolver(),
      new CheqdDidResolver(),
    ],
  }),
}
```

Spread these modules into the `modules` of your agent. Each network takes:

| Option | Description |
| --- | --- |
| `network` | `'testnet'` or `'mainnet'`. |
| `cosmosPayerSeed` | Mnemonic, or a 32-character seed, of the Cosmos account that pays for writes. Without it, Credo generates a new empty account on every start: you can resolve, but writes fail. |
| `rpcUrl` | RPC endpoint. Defaults to `https://rpc.cheqd.network` for testnet and `https://rpc.cheqd.net` for mainnet. |

The agent connects to the networks in the background when it starts. `CheqdModule` doesn't register the `did:cheqd` registrar and resolver itself, so list them in `DidsModule`. Your lists replace the default registrars and resolvers, see [Configure DID methods](https://credo.js.org/guides/next/dids-and-trust.md#configure-did-methods).

## Create a did:cheqd

```ts
const { didState } = await agent.dids.create<CheqdDidCreateOptions>({
  method: 'cheqd',
  options: {
    network: 'testnet',
    methodSpecificIdAlgo: 'uuid',
    createKey: { type: { kty: 'OKP', crv: 'Ed25519' } },
  },
})

if (didState.state !== 'finished') {
  throw new Error(`Creating the did failed: ${didState.state === 'failed' ? didState.reason : didState.state}`)
}
const did = didState.did
```

Credo creates an Ed25519 key and a DID document with one `JsonWebKey2020` verification method, `#key-1`. To use an Ed25519 key that's already in the KMS, pass `keyId` instead of `createKey`. `methodSpecificIdAlgo` picks the identifier format: `uuid` (default) or `base58btc`.

To publish your own DID document, pass `didDocument` instead, with `options.keys` linking each `authentication` verification method to a KMS key. cheqd accepts `Ed25519VerificationKey2018`, `Ed25519VerificationKey2020` and `JsonWebKey2020` verification methods.

All write operations accept `fee` and `feeOptions` for the ledger transaction, and `versionId` for the new version of the DID document (a random UUID by default).

## Update a did:cheqd

Resolve the document, change it, and pass the full new document to `update`:

```ts
const didDocument = await agent.dids.resolveDidDocument(did)
didDocument.service = [
  new DidDocumentService({
    id: `${did}#website`,
    type: 'LinkedDomains',
    serviceEndpoint: 'https://issuer.example.com',
  }),
]

const updateResult = await agent.dids.update({ did, didDocument })
if (updateResult.didState.state !== 'finished') throw new Error('Updating the did failed')
```

The keys of all `authentication` verification methods sign the update, so they must be in the agent's KMS.

## Deactivate a did:cheqd

```ts
const deactivateResult = await agent.dids.deactivate({ did })
```

A deactivated DID still resolves, and its document metadata marks it as deactivated. You can't update it anymore.

## DID-linked resources

Create a resource under a DID with `agent.modules.cheqd`, where `cheqd` is the key you registered the module under:

```ts
const resourceId = utils.uuid()
const resourceResult = await agent.modules.cheqd.createResource(did, {
  id: resourceId,
  name: 'issuer-logo',
  resourceType: 'Logo',
  version: '1.0',
  data: { uri: 'https://issuer.example.com/logo.png' },
})
if (resourceResult.resourceState.state !== 'finished') throw new Error('Creating the resource failed')
```

`id` must be a UUID. `data` can be an object (stored as JSON), a `Uint8Array`, or a base64 string: Credo always decodes a string as base64. All verification methods of the DID sign the resource, so the agent needs all their keys. A resource with the same `name` and `resourceType` as an existing one becomes a new version of it.

Resolve a resource by its id, or by name and type:

```ts
// By resource id
const byId = await agent.modules.cheqd.resolveResource(`${did}/resources/${resourceId}`)

// By name and type: the latest version, or add &version=1.0 or &resourceVersionTime=<unix time>
const byName = await agent.modules.cheqd.resolveResource(`${did}?resourceName=issuer-logo&resourceType=Logo`)
```

The result has `resource` and `resourceMetadata`, or `error` and `message` when the resource can't be resolved.

## AnonCreds registry

`CheqdAnonCredsRegistry` registers and resolves AnonCreds schemas, credential definitions and revocation data as DID-linked resources. It comes from the `@credo-ts/cheqd/anoncreds` subpath and needs `@credo-ts/anoncreds`, an optional peer dependency of `@credo-ts/cheqd` that you install yourself. Set up AnonCreds as described in [AnonCreds](https://credo.js.org/guides/next/credential-formats/anoncreds.md), with the cheqd registry:

```ts
import { AnonCredsModule } from '@credo-ts/anoncreds'
import { CheqdAnonCredsRegistry } from '@credo-ts/cheqd/anoncreds'
import { NativeAnoncreds } from '@hyperledger/anoncreds-nodejs'

const anoncreds = new AnonCredsModule({
  anoncreds: NativeAnoncreds,
  registries: [new CheqdAnonCredsRegistry()],
})
```

The registry also needs `CheqdModule`, and the issuer needs a `did:cheqd`.
