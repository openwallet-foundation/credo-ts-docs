# Askar

> Configure Askar for encrypted storage and key management in a Credo agent, on SQLite or PostgreSQL, in Node.js and React Native.

[Askar](https://github.com/openwallet-foundation/askar) is an encrypted store for records and keys. `AskarModule` registers it as the agent's storage and as a [key management](https://credo.js.org/guides/next/agent-setup/key-management.md) backend. It runs on SQLite or PostgreSQL, in Node.js and React Native.

Askar is the default for mobile wallets: it encrypts the wallet, includes key management, and has no migrations to ship with app updates. On a server, [Drizzle](https://credo.js.org/guides/next/agent-setup/storage/drizzle.md) stores the records and Askar keeps the keys, with [storage turned off](#storage-and-key-management). Use SQLite, the default, on phones and for a server with one instance, and PostgreSQL when several instances share the keys. To choose between Askar and Drizzle, see [Storage](https://credo.js.org/guides/next/agent-setup/storage.md).

## Install

**Node.js**

```bash
npm install @credo-ts/askar@alpha @openwallet-foundation/askar-nodejs@0.6.1
```

**React Native**

```bash
npm install @credo-ts/askar@alpha @openwallet-foundation/askar-react-native@0.6.1
```

Askar is a native module, so it doesn't run in Expo Go. Use a [development build](https://docs.expo.dev/develop/development-builds/introduction/).

The platform package pins `@openwallet-foundation/askar-shared` to its own version, so install a single Askar version across your project. `@credo-ts/askar-to-drizzle-storage-migration` requires exactly `0.6.1`.

## Configure

**Node.js**

```ts
import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      store: {
        id: 'my-agent',
        // Load the key from a secret store in production
        key: 'my-agent-store-key',
      },
    }),
  },
})

// Creates the store on the first run, opens it on later runs
await agent.initialize()
```

**React Native**

```ts
import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/react-native'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'

// walletKey: created once with Store.generateRawKey() and kept in the device keychain
export async function initializeAgent(walletKey: string) {
  const agent = new Agent({
    dependencies: agentDependencies,
    modules: {
      askar: new AskarModule({
        askar: NativeAskar,
        store: {
          id: 'wallet',
          key: walletKey,
          keyDerivationMethod: 'raw',
        },
      }),
    },
  })

  // Creates the store on the first run, opens it on later runs
  await agent.initialize()
  return agent
}
```

Pass the `NativeAskar` class as `askar`. The `askar` instance export of the platform package is deprecated: it's only set once the platform package has run, which depends on import order.

`store.id` names the store. It's also the root agent's profile, the SQLite directory and the PostgreSQL database name. `agent.initialize()` opens the store, and creates it if it doesn't exist yet. `agent.shutdown()` closes it.

With the wrong key, `initialize()` throws a `CredoError` caused by `AskarStoreInvalidKeyError`. A different `id` or SQLite `path` doesn't fail: it creates a new, empty store. To open an existing wallet, check that the database exists before you initialize.

## Store key

Askar encrypts the store with `store.key`. `keyDerivationMethod` decides how it turns the key into the encryption key:

| `keyDerivationMethod` | Use it for |
| --- | --- |
| `raw` | Random keys that you keep somewhere safe, such as the device keychain or a secret manager. Skips key derivation, so opening the store is fast. |
| `kdf:argon2i:mod` (default) | Passwords and PINs. Argon2i makes guessing the key slow. |
| `kdf:argon2i:int` | The same, faster and less secure. |

Use `raw` when you can keep a random key in a keychain or secret manager, and Argon2i when the key is something a person types. Generate a `raw` key once with `Store.generateRawKey()` from the platform package: any other string fails when Askar creates the store.

To change the key of an existing store, call `agent.modules.askar.rotateStoreKey({ newKey, newKeyDerivationMethod })` and then update the key in your configuration.

## Databases

### SQLite

The store is a file at `<data path>/wallet/<store id>/sqlite.db`. The data path is `~/.afj/data` on Node.js, and `.afj` in the app's document directory on React Native. To use another file, set the full path of the database file:

```ts
database: { type: 'sqlite', config: { path: '/var/lib/my-agent/agent.db' } }
```

### In-memory SQLite

For tests that need Askar, such as DIDComm tests, keep the store in memory. The data is gone when the agent shuts down. Other tests can use the lighter [Drizzle and Node.js setup](https://credo.js.org/guides/next/agent-setup/storage/drizzle.md#in-memory-database-for-tests).

```ts
import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar, Store } from '@openwallet-foundation/askar-nodejs'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      store: {
        id: 'test-agent',
        // A random raw key skips the slow key derivation, which keeps tests fast
        key: Store.generateRawKey(),
        keyDerivationMethod: 'raw',
        database: { type: 'sqlite', config: { inMemory: true } },
      },
    }),
  },
})
```

### PostgreSQL

```ts
import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      store: {
        // Also the name of the Postgres database
        id: 'my-agent',
        key: 'my-agent-store-key',
        database: {
          type: 'postgres',
          config: {
            host: 'localhost:5432',
            maxConnections: 10,
            connectionParameters: { sslmode: 'require' },
          },
          credentials: {
            account: 'credo',
            password: 'credo-password',
          },
        },
      },
    }),
  },
})

await agent.initialize()
```

The store `id` is the database name. On the first `initialize()` Askar creates that database, so the account needs permission to create databases, or you pass a separate `adminAccount` and `adminPassword` in `credentials` for that.

| Option | Description |
| --- | --- |
| `config.host` | Host and port, for example `localhost:5432`. |
| `config.maxConnections`, `config.minConnections` | Size of the connection pool. Also available for SQLite. |
| `config.connectTimeout`, `config.idleTimeout` | Timeouts. |
| `config.connectionParameters` | Extra connection string parameters, such as `sslmode`, `sslrootcert` and `application_name`. Parameters that Credo sets itself, such as `host`, `user` and `dbname`, throw. |
| `credentials.account`, `credentials.password` | The account to connect with. |
| `credentials.adminAccount`, `credentials.adminPassword` | Optional account for creating and deleting databases. |

## Storage and key management

`AskarModule` registers storage and a key management backend named `askar`. Turn either off:

| `enableStorage` | `enableKms` | Use it when |
| --- | --- | --- |
| `true` | `true` | Askar stores records and keys. The default. |
| `false` | `true` | Another module stores records, such as [Drizzle](https://credo.js.org/guides/next/agent-setup/storage/drizzle.md). Askar still creates its store, for the keys. |
| `true` | `false` | You register `AskarKeyManagementService` yourself in the `KeyManagementModule`, for example to make Askar the default next to another backend. See [Key management](https://credo.js.org/guides/next/agent-setup/key-management.md#multiple-backends). |

If you add `AskarKeyManagementService` to the `KeyManagementModule` backends and keep `enableKms` on, registering the module throws.

## Multi-tenancy

With the [tenants module](https://credo.js.org/guides/next/agent-setup/multi-tenancy.md), `multiWalletDatabaseScheme` decides where tenant data goes: `AskarMultiWalletDatabaseScheme.ProfilePerWallet` keeps all tenants in the root store with a profile each, `DatabasePerWallet` (the default) gives each tenant its own store. This also applies when Askar only keeps the keys. Use `ProfilePerWallet`. See [Where tenant data is stored](https://credo.js.org/guides/next/agent-setup/multi-tenancy.md#where-tenant-data-is-stored) for the trade-offs, and for why you shouldn't set a SQLite `path` with `DatabasePerWallet`.

## Manage the store

`agent.modules.askar` (the module's key in `modules`) has methods for store-level tasks:

| Method | What it does |
| --- | --- |
| `rotateStoreKey({ newKey, newKeyDerivationMethod? })` | Changes the store key. Update your configuration afterwards. |
| `exportStore({ exportToStore })` | Copies the open store to a new store, for example a backup with its own id, key and path. On SQLite, the target file must not exist yet. |
| `importStore({ importFromStore })` | Copies another store, such as a backup, to the configured store location. Call `closeStore()` first. On SQLite, the configured file must not exist yet. |
| `deleteStore()` | Deletes the store and all its data. |
| `closeStore()`, `openStore()`, `provisionStore()`, `isStoreOpen` | Manual control. `initialize()` and `shutdown()` already do this. |

With `ProfilePerWallet` these methods act on the whole store, including all tenants, so they throw when you call them from a tenant agent.
