# Hedera

> Create, update, deactivate and resolve did:hedera DIDs, and use Hedera as an AnonCreds registry with @credo-ts/hedera.

[Hedera](https://hedera.com) is a public network whose Consensus Service (HCS) stores `did:hedera` DID documents and AnonCreds objects. `@credo-ts/hedera` adds the `did:hedera` method and an AnonCreds registry, built on the [Hiero DID SDK](https://github.com/hiero-ledger/hiero-did-sdk-js). Writes cost HBAR, paid by an operator account that you configure.

Use `did:hedera` when your ecosystem uses Hedera, for DIDs or as an AnonCreds registry.

:::warning[Experimental]
The Hedera module is experimental and may have breaking changes in any release. Pin exact versions of all `@credo-ts/*` packages when you use it.
:::

## Install

```bash
npm install @credo-ts/hedera@^0.7.2
```

## Configure

Register `HederaModule` with the networks you use, and add the Hedera registrar and resolver to `DidsModule`:

```ts
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
  WebDidResolver,
} from '@credo-ts/core'
import {
  type HederaDidCreateOptions,
  HederaDidRegistrar,
  HederaDidResolver,
  type HederaDidUpdateOptions,
  HederaModule,
} from '@credo-ts/hedera'
import { agentDependencies } from '@credo-ts/node'

// The operator account pays the Hedera transaction fees
const operatorId = process.env.HEDERA_OPERATOR_ID
const operatorKey = process.env.HEDERA_OPERATOR_KEY
if (!operatorId || !operatorKey) throw new Error('HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY must be set')

const hederaModules = {
  hedera: new HederaModule({
    networks: [{ network: 'testnet', operatorId, operatorKey }],
  }),
  dids: new DidsModule({
    registrars: [new KeyDidRegistrar(), new PeerDidRegistrar(), new JwkDidRegistrar(), new HederaDidRegistrar()],
    resolvers: [
      new KeyDidResolver(),
      new PeerDidResolver(),
      new JwkDidResolver(),
      new WebDidResolver(),
      new HederaDidResolver(),
    ],
  }),
}
```

Spread these modules into the `modules` of your agent. Each network takes:

| Option | Description |
| --- | --- |
| `network` | `'mainnet'`, `'testnet'`, `'previewnet'`, `'local-node'`, or a custom network `{ name, nodes, mirrorNodes }`. |
| `operatorId` | Account id of the operator account, such as `0.0.12345`. |
| `operatorKey` | Private key of the operator account. |

`HederaModule` doesn't register the DID registrar and resolver itself, so list them in `DidsModule`. Your lists replace the default registrars and resolvers, see [Configure DID methods](https://credo.js.org/guides/dids-and-trust.md#configure-did-methods).

## Create a did:hedera

```ts
const { didState } = await agent.dids.create<HederaDidCreateOptions>({
  method: 'hedera',
  options: { network: 'testnet' },
})

if (didState.state !== 'finished') {
  throw new Error(`Creating the did failed: ${didState.state === 'failed' ? didState.reason : didState.state}`)
}
const did = didState.did
```

Credo creates an Ed25519 root key in the KMS and publishes a DID document with it as `#did-root-key`. The root key signs every later update. Pass `secret.rootKeyId` to use an Ed25519 key that's already in the KMS. With more than one network configured, `options.network` picks the network for the new DID.

To publish a full DID document right away, pass `didDocument`, and list the KMS keys of its verification methods in `secret.keys` as `{ kmsKeyId, didDocumentRelativeKeyId }`.

## Update a did:hedera

```ts
const updateResult = await agent.dids.update<HederaDidUpdateOptions>({
  did,
  didDocumentOperation: 'addToDidDocument',
  didDocument: {
    service: [
      new DidDocumentService({
        id: `${did}#website`,
        type: 'LinkedDomains',
        serviceEndpoint: 'https://issuer.example.com',
      }),
    ],
  },
})
if (updateResult.didState.state !== 'finished') throw new Error('Updating the did failed')
```

`didDocumentOperation` is required:

- `addToDidDocument` adds the services and verification methods in `didDocument`.
- `removeFromDidDocument` removes them.
- `setDidDocument` replaces the document.

Credo finds the network from the DID and signs with the root key from the `DidRecord`. Every verification method in the update needs its KMS key: Credo uses the keys in the `DidRecord`, and you pass keys for new verification methods in `secret.keys`.

## Deactivate a did:hedera

```ts
const deactivateResult = await agent.dids.deactivate({ did })
```

## AnonCreds registry

`HederaAnonCredsRegistry` registers and resolves AnonCreds schemas, credential definitions and revocation data on HCS. Import it from the `@credo-ts/hedera/anoncreds` subpath: the export from the `@credo-ts/hedera` root is deprecated, and removed in 0.8. The Hiero DID SDK needs a Zstandard library to store the objects, and a crypto library on React Native:

**Node.js**

```bash
npm install zstd-napi
```

**React Native**

```bash
npm install react-native-zstd react-native-quick-crypto
```

Set up AnonCreds as described in [AnonCreds](https://credo.js.org/guides/credential-formats/anoncreds.md), with the Hedera registry:

```ts
import { AnonCredsModule } from '@credo-ts/anoncreds'
import { HederaAnonCredsRegistry } from '@credo-ts/hedera/anoncreds'
import { NativeAnoncreds } from '@hyperledger/anoncreds-nodejs'

// HederaModule must be registered as well, the registry uses its network configuration
const anoncreds = new AnonCredsModule({
  anoncreds: NativeAnoncreds,
  registries: [new HederaAnonCredsRegistry()],
})
```

The registry uses the network configuration of `HederaModule`, so register that module as well. The issuer needs a `did:hedera`.
