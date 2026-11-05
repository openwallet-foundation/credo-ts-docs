# Your first agent

> Create, initialize and shut down a minimal Credo agent that stores records with Drizzle in SQLite and keys in Askar, and creates a did:key.

This page builds the smallest complete agent: it stores records in an SQLite file with Drizzle and keys in Askar, creates a `did:key`, resolves it and shuts down. On React Native, Askar stores both. You need the packages from [Installation](https://credo.js.org/guides/getting-started/installation.md).

## Create the agent

**Node.js**

```ts
import { AskarModule } from '@credo-ts/askar'
import { Agent, ConsoleLogger, type KeyDidCreateOptions, LogLevel } from '@credo-ts/core'
import { DrizzleStorageModule } from '@credo-ts/drizzle-storage'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import { drizzle } from 'drizzle-orm/libsql'

const agent = new Agent({
  config: {
    logger: new ConsoleLogger(LogLevel.Info),
  },
  dependencies: agentDependencies,
  modules: {
    // Records go in the tables of an SQLite file
    storage: new DrizzleStorageModule({
      database: drizzle('file:agent.db'),
      bundles: [],
    }),
    // Drizzle doesn't store keys, so Askar keeps them
    askar: new AskarModule({
      askar: NativeAskar,
      enableStorage: false,
      store: {
        id: 'my-first-agent',
        // Use a secret from your environment or a secure store in a real application
        key: 'my-first-agent-key',
      },
    }),
  },
})
```

**React Native**

```ts
import { AskarModule } from '@credo-ts/askar'
import { Agent, ConsoleLogger, type KeyDidCreateOptions, LogLevel } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/react-native'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'

const agent = new Agent({
  config: {
    logger: new ConsoleLogger(LogLevel.Info),
  },
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      store: {
        id: 'my-first-agent',
        // Use a key from the device's secure storage in a real app
        key: 'my-first-agent-key',
      },
    }),
  },
})
```

The `Agent` constructor takes three options:

- `dependencies` are the platform implementations of the file system, `fetch`, WebSocket and events. Import `agentDependencies` from `@credo-ts/node` or `@credo-ts/react-native`.
- `modules` adds features to the agent. On Node.js, the `DrizzleStorageModule` stores the records, and the `AskarModule` with `enableStorage: false` is the [key management](https://credo.js.org/guides/agent-setup/key-management.md) backend. On React Native, the `AskarModule` does both. An agent needs a storage module: without one, `new Agent()` throws `Missing required dependency: 'StorageService'`.
- `config` holds agent-wide settings, such as the logger. See [Agent configuration](https://credo.js.org/guides/agent-setup.md).

`drizzle('file:agent.db')` opens `agent.db` in the current directory. For PostgreSQL and the record bundles of other modules, see [Drizzle](https://credo.js.org/guides/agent-setup/storage/drizzle.md). `store.id` names the Askar database and `store.key` encrypts it. On Node.js the Askar database is created at `~/.afj/data/wallet/<id>/sqlite.db`. See [Askar](https://credo.js.org/guides/agent-setup/storage/askar.md) for the options and how to choose the key.

## Modules and their APIs

The key you register a module under is the name of its API: `agent.modules.askar` for the module above. `didcomm` and `openid4vc` are also available as `agent.didcomm` and `agent.openid4vc` when you register them under those keys. Default modules, such as DIDs, key management and SD-JWT VC, are always registered and have their APIs at the top level, for example `agent.dids` and `agent.kms`.

TypeScript infers these APIs from the `modules` you pass, so using a module you didn't register is a type error. [Agent configuration](https://credo.js.org/guides/agent-setup.md) lists the default modules and shows how to type an agent you pass around.

## Initialize

```ts
await agent.initialize()
```

`initialize()` opens the storage and the Askar store, creates the store on the first run, and checks that the storage is up to date for this version of Credo. Call it once, before you use the agent.

## Create and resolve a DID

```ts
const { didState } = await agent.dids.create<KeyDidCreateOptions>({
  method: 'key',
  options: {
    createKey: { type: { kty: 'OKP', crv: 'Ed25519' } },
  },
})

if (didState.state !== 'finished') {
  throw new Error(`Creating the DID failed: ${didState.state === 'failed' ? didState.reason : didState.state}`)
}

const didDocument = await agent.dids.resolveDidDocument(didState.did)
console.log(JSON.stringify(didDocument.toJSON(), null, 2))
```

`agent.dids.create()` creates an Ed25519 key in Askar, stores a DID record that links the DID to the key, and returns the `did:key`. `resolveDidDocument()` resolves the DID to its DID document, and throws if that fails. See [DIDs](https://credo.js.org/guides/dids-and-trust.md) for other DID methods.

## Shut down

```ts
await agent.shutdown()
```

`shutdown()` stops the modules and closes the storage. Call it before your process exits or your app is closed.

## Run it

**Node.js**

Drizzle doesn't create tables, so apply the migrations of the core bundle first, and again after every Credo upgrade. Without them, `initialize()` fails with `no such table: StorageVersion`.

```bash
npx drizzle-storage --bundle core migrate --dialect sqlite --database-url file:agent.db
```

Then run the agent:

```bash
npx tsx src/index.ts
```

The agent logs its startup at the info level and prints the DID document:

```text
INFO: Creating agent with config { ... }
INFO: Agent storage is up to date.
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    ...
  ],
  "id": "did:key:z6Mkg...",
  "verificationMethod": [ ... ],
  ...
}
```

Run it again and the agent adds a second DID to the same database.

**React Native**

Metro doesn't support top-level `await`, so the React Native version wraps the steps in `runFirstAgent()`. Call it from your app, for example in a `useEffect` of your root component, and check the Metro logs for the DID document.

## Next steps

- [Example setups](https://credo.js.org/guides/getting-started/example-setups.md) shows complete configurations for wallets, issuers, verifiers and mediators.
- [Agent configuration](https://credo.js.org/guides/agent-setup.md) describes all agent options.
