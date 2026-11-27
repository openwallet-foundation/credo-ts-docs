# Indy VDR

> Connect to Hyperledger Indy networks with @credo-ts/indy-vdr to resolve and register did:indy DIDs with an endorser, and use Indy as an AnonCreds registry.

Hyperledger Indy networks, such as BCovrin Test and CANdy, store DIDs and AnonCreds objects. `@credo-ts/indy-vdr` connects to one or more Indy networks through [Indy VDR](https://github.com/hyperledger/indy-vdr). It resolves and registers `did:indy` DIDs, and provides an AnonCreds registry. The package is maintained in [credo-ts-ext](https://credo.js.org/guides/next/extensions.md).

Use it when your ecosystem uses an Indy network, usually to issue or verify AnonCreds credentials.

## Install

**Node.js**

```bash
npm install @credo-ts/indy-vdr@alpha @hyperledger/indy-vdr-nodejs@^0.3.0
```

**React Native**

```bash
npm install @credo-ts/indy-vdr@alpha @hyperledger/indy-vdr-react-native@^0.3.0
```

This version of Credo needs version 0.3 of the native Indy VDR packages: `@credo-ts/indy-vdr` has a peer dependency on `@hyperledger/indy-vdr-shared` `^0.3.0`.

## Configure

Register `IndyVdrModule` with the networks you use, and add the Indy registrar and resolver to `DidsModule`:

```ts
import { readFile } from 'node:fs/promises'
import {
  DidsModule,
  JwkDidRegistrar,
  JwkDidResolver,
  KeyDidRegistrar,
  KeyDidResolver,
  PeerDidRegistrar,
  PeerDidResolver,
  WebDidResolver,
} from '@credo-ts/core'
import { IndyVdrIndyDidRegistrar, IndyVdrIndyDidResolver, IndyVdrModule } from '@credo-ts/indy-vdr'
import { indyVdr } from '@hyperledger/indy-vdr-nodejs'

const indyVdrModules = {
  indyVdr: new IndyVdrModule({
    indyVdr,
    networks: [
      {
        indyNamespace: 'bcovrin:test',
        isProduction: false,
        genesisTransactions: await readFile('genesis/bcovrin-test.txn', 'utf8'),
        connectOnStartup: true,
      },
    ],
  }),
  dids: new DidsModule({
    registrars: [new KeyDidRegistrar(), new PeerDidRegistrar(), new JwkDidRegistrar(), new IndyVdrIndyDidRegistrar()],
    resolvers: [
      new KeyDidResolver(),
      new PeerDidResolver(),
      new JwkDidResolver(),
      new WebDidResolver(),
      new IndyVdrIndyDidResolver(),
    ],
  }),
}
```

On React Native, import `indyVdr` from the React Native package instead, and bundle the genesis transactions with your app:

```ts
import { indyVdr } from '@hyperledger/indy-vdr-react-native'
```

Pass the `indyVdr` object itself: unlike Askar and AnonCreds, Indy VDR has no `Native*` class. Each network takes:

| Option | Description |
| --- | --- |
| `indyNamespace` | Namespace of the network in `did:indy` identifiers, such as `bcovrin:test` in `did:indy:bcovrin:test:...`. |
| `genesisTransactions` | Contents of the network's genesis file, as a string. |
| `isProduction` | Whether this is a production network. |
| `connectOnStartup` | Connect when the agent starts instead of on first use. Defaults to `false`. |
| `transactionAuthorAgreement` | `{ version, acceptanceMechanism }`, required to write to networks with a transaction author agreement. `acceptanceMechanism` is a label from the network's acceptance mechanism list. |

`IndyVdrModule` doesn't register the DID registrar and resolver itself, so list them in `DidsModule`. Your lists replace the default registrars and resolvers, see [Configure DID methods](https://credo.js.org/guides/next/dids-and-trust.md#configure-did-methods).

## Resolve a did:indy

With the resolver registered, `agent.dids.resolve` uses the network whose `indyNamespace` matches the DID. `did:sov` and unqualified Indy DIDs aren't supported: use the `did:indy` form, such as `did:indy:bcovrin:test:<identifier>`.

## Import an existing DID

Writing to an Indy network needs a DID that the network allows to write, usually with the `ENDORSER` role. To use a DID that was registered from a seed, import its key and the DID:

```ts
// The seed the DID was registered with on the ledger. Keep it secret.
const endorserSeed = process.env.ENDORSER_SEED
if (!endorserSeed) throw new Error('ENDORSER_SEED is not set')

const { privateJwk } = transformPrivateKeyToPrivateJwk({
  type: { kty: 'OKP', crv: 'Ed25519' },
  privateKey: TypedArrayEncoder.fromUtf8String(endorserSeed),
})
const { keyId, publicJwk } = await endorser.kms.importKey({ privateJwk })

// A DID registered from a seed is the base58 encoding of the first 16 bytes of the public key
const publicKey = PublicJwk.fromPublicJwk(publicJwk).publicKey.publicKey
const endorserDid = `did:indy:bcovrin:test:${TypedArrayEncoder.toBase58(publicKey.slice(0, 16))}`
await endorser.dids.import({
  did: endorserDid,
  // did:indy documents reference the main key as #verkey
  keys: [{ didDocumentRelativeKeyId: '#verkey', kmsKeyId: keyId }],
})
```

`transformPrivateKeyToPrivateJwk` comes from `@credo-ts/askar`. Without a `didDocument`, `import` resolves the DID from the network.

## Register a did:indy

With an endorser DID in the agent's wallet, register a new DID and let the same agent endorse it:

```ts
const { didState } = await endorser.dids.create<IndyVdrDidCreateOptions>({
  method: 'indy',
  options: {
    endorserDid,
    endorserMode: 'internal',
  },
})
if (didState.state !== 'finished') throw new Error('Registering the did failed')
```

The new DID gets an Ed25519 key, or the key you pass as `keyId`. Other options are `alias`, `role` (`STEWARD`, `TRUSTEE`, `ENDORSER` or `NETWORK_MONITOR`) and `services`. Services are written to the DID document on the ledger, or as a legacy `endpoint` attribute with `useEndpointAttrib: true`. Updating and deactivating `did:indy` DIDs isn't supported.

### External endorser

When the endorser is a different agent, the author prepares the transaction, the endorser signs it, and the author submits it:

```ts
// Author: prepare the transaction. The returned state asks for an endorsement.
const authorResult = (await author.dids.create<IndyVdrDidCreateOptions>({
  method: 'indy',
  options: { endorserDid, endorserMode: 'external' },
})) as IndyVdrDidCreateResult

const authorState = authorResult.didState
if (authorState.state !== 'action' || authorState.action !== 'endorseIndyTransaction') {
  throw new Error('Expected an endorsement request')
}

// Endorser: sign the transaction it received from the author
const endorsedNymRequest = await endorser.modules.indyVdr.endorseTransaction(
  authorState.nymRequest,
  authorState.endorserDid
)

// Author: submit the endorsed transaction
const submitResult = await author.dids.create<IndyVdrDidCreateOptions>({
  did: authorState.did,
  options: { endorserMode: 'external', endorsedTransaction: { nymRequest: endorsedNymRequest } },
})
```

With `endorserMode: 'external'`, the registrar returns the state `action` with `action: 'endorseIndyTransaction'`. Cast the result to `IndyVdrDidCreateResult` to read `nymRequest` and, when you pass services with `useEndpointAttrib`, `attribRequest`. Send these to the endorser, who signs each one with `agent.modules.indyVdr.endorseTransaction`. The author then calls `create` again with the DID and the endorsed transactions.

## AnonCreds registry

`IndyVdrAnonCredsRegistry` registers and resolves AnonCreds schemas, credential definitions and revocation data on Indy. It comes from the `@credo-ts/indy-vdr/anoncreds` subpath and needs `@credo-ts/anoncreds`, an optional peer dependency of `@credo-ts/indy-vdr` that you install yourself. Set up AnonCreds as described in [AnonCreds](https://credo.js.org/guides/next/credential-formats/anoncreds.md), with the Indy registry:

```ts
import { AnonCredsModule } from '@credo-ts/anoncreds'
import { IndyVdrAnonCredsRegistry } from '@credo-ts/indy-vdr/anoncreds'
import { NativeAnoncreds } from '@hyperledger/anoncreds-nodejs'

const anoncreds = new AnonCredsModule({
  anoncreds: NativeAnoncreds,
  registries: [new IndyVdrAnonCredsRegistry()],
})
```

The registry needs `IndyVdrModule`. To register objects, the issuer needs a `did:indy` with write permission, and passes `endorserMode` and `endorserDid` in the registration options.

The registry only handles `did:indy` identifiers. It accepts schema, credential definition and revocation registry identifiers with names and tags either as they are or percent-encoded. New identifiers aren't encoded by default, for agents that don't support encoded identifiers. To percent-encode schema names and tags in new identifiers, set `encodeAnonCredsIdentifiers: true` on `IndyVdrModule`.

## Indy identifiers

To check and parse `did:indy` DIDs, import `didIndyRegex`, `isIndyDid`, `parseIndyDid` and `getIndyNamespaceFromIndyDid` from `@credo-ts/indy-vdr`. `getIndyNamespaceFromIndyDid` only accepts a DID without a path, query or fragment, and throws for anything else, including AnonCreds object IDs.

For AnonCreds object IDs, `@credo-ts/indy-vdr/anoncreds` exports a regex, a check and a parser for each object type. Like the registry, this subpath needs `@credo-ts/anoncreds`.

| Object | Regex | Check | Parser |
| --- | --- | --- | --- |
| Schema | `didIndySchemaIdRegex` | `isDidIndySchemaId` | `parseIndySchemaId` |
| Credential definition | `didIndyCredentialDefinitionIdRegex` | `isDidIndyCredentialDefinitionId` | `parseIndyCredentialDefinitionId` |
| Revocation registry definition | `didIndyRevocationRegistryIdRegex` | `isDidIndyRevocationRegistryId` | `parseIndyRevocationRegistryId` |

The parsers return the DID, its `namespace` and `namespaceIdentifier`, and the parts of the object ID, with percent-encoded names and tags decoded. They throw for IDs that aren't `did:indy` object IDs. To get the namespace of an object ID, read it from the parser:

```ts
import { getIndyNamespaceFromIndyDid } from '@credo-ts/indy-vdr'
import { parseIndyCredentialDefinitionId, parseIndySchemaId } from '@credo-ts/indy-vdr/anoncreds'

const did = 'did:indy:bcovrin:test:SDqTzbVuCowusqGBNbNDjH'

getIndyNamespaceFromIndyDid(did) // 'bcovrin:test'
parseIndySchemaId(`${did}/anoncreds/v0/SCHEMA/example/1.0`).namespace // 'bcovrin:test'
parseIndyCredentialDefinitionId(`${did}/anoncreds/v0/CLAIM_DEF/10/TAG`).namespace // 'bcovrin:test'
```

To build `did:indy` object IDs, use `getDidIndySchemaId`, `getDidIndyCredentialDefinitionId` and `getDidIndyRevocationRegistryDefinitionId`. Pass `true` as the last argument to percent-encode names and tags. The ledger uses unqualified IDs in its transactions, which `getIndyLedgerSchemaId`, `getIndyLedgerCredentialDefinitionId` and `getIndyLedgerRevocationRegistryDefinitionId` build.
