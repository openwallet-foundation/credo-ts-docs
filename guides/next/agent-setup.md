# Agent configuration

> The options of the Credo Agent class, the modules every agent has, and how to start, stop and update an agent.

This page describes what you pass to `new Agent()`, the modules every agent has, and how to start and stop an agent. The other pages in this section cover the choices you make when you set up an agent.

## Choices to make

| Choice | Mobile wallet | Server | Details |
| --- | --- | --- | --- |
| Storage | Askar on SQLite | Drizzle on PostgreSQL, or on SQLite for a single instance or development | [Storage](https://credo.js.org/guides/next/agent-setup/storage.md) |
| Key management | Askar, plus the secure environment for keys that must stay in hardware | Askar, with its storage turned off | [Key management](https://credo.js.org/guides/next/agent-setup/key-management.md) |
| Cache | The default | The default for one agent, `InMemoryLruCache` with tenants, Redis with several instances | [Caching](https://credo.js.org/guides/next/agent-setup/caching.md) |
| Multi-tenancy | Not needed | Only when one service hosts many isolated issuers, verifiers or wallets | [Multi-tenancy](https://credo.js.org/guides/next/agent-setup/multi-tenancy.md) |

For tests, use Drizzle on an in-memory SQLite database and keep the keys in memory with the Node.js backend.

## Agent options

| Option | Description |
| --- | --- |
| `dependencies` | Required. The platform implementations of the file system, `fetch`, WebSocket and events: `agentDependencies` from `@credo-ts/node` or `@credo-ts/react-native`. |
| `modules` | The modules of the agent, keyed by the name of their API. Include a storage module, [Drizzle](https://credo.js.org/guides/next/agent-setup/storage/drizzle.md) or [Askar](https://credo.js.org/guides/next/agent-setup/storage/askar.md): without one, `new Agent()` throws `Missing required dependency: 'StorageService'`. |
| `config` | Agent-wide settings, described below. |

## Config

| Field | Default | Description |
| --- | --- | --- |
| `logger` | `ConsoleLogger` at `LogLevel.Off` | The logger of the agent and its modules. See [Logging](https://credo.js.org/guides/next/agent-setup/logging.md). |
| `autoUpdateStorageOnStartup` | `false` | Update the storage during `initialize()` when it was written by an older version of Credo. See [Storage updates](#storage-updates). |
| `allowInsecureHttpUrls` | `false` | Accept `http://` URLs where HTTPS is otherwise required, such as OpenID4VC endpoints. For local development only. The OpenID4VC module applies it to the whole process, so it also affects other agents in it. |
| `validitySkewSeconds` | `30` | The clock skew, in seconds, allowed when checking the validity period of credentials, status lists and other signed objects. The OpenID4VC issuer also applies it to wallet attestations and DPoP proofs. Phones often run a little behind. |
| `getTrustedIssuersForVerification` | none | A callback that returns the DIDs and X.509 certificates to trust for a verification. See [Trusted issuers](https://credo.js.org/guides/next/dids-and-trust/trust.md). |

## Default modules

Credo registers these modules on every agent:

| Key | Module | API |
| --- | --- | --- |
| `dids` | `DidsModule` | `agent.dids` |
| `kms` | `KeyManagementModule` | `agent.kms` |
| `sdJwtVc` | `SdJwtVcModule` | `agent.sdJwtVc` |
| `mdoc` | `MdocModule` | `agent.mdoc` |
| `w3cCredentials` | `W3cCredentialsModule` | `agent.w3cCredentials` |
| `w3cV2Credentials` | `W3cV2CredentialsModule` | `agent.w3cV2Credentials` |
| `w3cDataIntegrity` | `W3cDataIntegrityModule` | `agent.w3cDataIntegrity` |
| `x509` | `X509Module` | `agent.x509` |
| `tokenStatusList` | `TokenStatusListModule` | `agent.tokenStatusList` |
| `genericRecords` | `GenericRecordsModule` | `agent.genericRecords` |
| `cache` | `CacheModule` with a `SingleContextStorageLruCache` of 500 entries | none |
| `dcql` | `DcqlModule` | none |
| `pex` | `DifPresentationExchangeModule` | none |

The `kms` module starts without a backend. `AskarModule` adds one, also when Drizzle stores the records. Without Askar, configure a backend yourself (see [Key management](https://credo.js.org/guides/next/agent-setup/key-management.md)). The default cache doesn't work with [multi-tenancy](https://credo.js.org/guides/next/agent-setup/multi-tenancy.md), so replace it when you use tenants (see [Caching](https://credo.js.org/guides/next/agent-setup/caching.md)).

## Replace a default module

To configure a default module, pass your own instance under the same key:

```ts
import {
  Agent,
  ConsoleLogger,
  DidsModule,
  JwkDidRegistrar,
  JwkDidResolver,
  KeyDidRegistrar,
  KeyDidResolver,
  LogLevel,
  WebDidResolver,
} from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'

function getAgentModules() {
  return {
    ...storage, // Storage and key management, see Agent setup
    // Same key as the default module, so it replaces it
    dids: new DidsModule({
      registrars: [new KeyDidRegistrar(), new JwkDidRegistrar()],
      resolvers: [new KeyDidResolver(), new JwkDidResolver(), new WebDidResolver()],
    }),
  }
}

const agent = new Agent({
  config: {
    logger: new ConsoleLogger(LogLevel.Warn),
  },
  dependencies: agentDependencies,
  modules: getAgentModules(),
})
```

The API stays where it was, at `agent.dids`. When you pass `resolvers` or `registrars` to the `DidsModule`, your list replaces the defaults, except for `did:key` and `did:peer`, which are always added.

## Module APIs and types

Default modules are at the top level, for example `agent.dids`, also when you replace them. Other modules are under `agent.modules`, for example `agent.modules.askar` or `agent.modules.tenants`. The exceptions are `didcomm` and `openid4vc`: registered under exactly those keys, they're also at `agent.didcomm` and `agent.openid4vc`. Modules without an API, such as `cache`, have no property on the agent.

The `Agent` class infers these types from the `modules` you pass to the constructor. To type an agent you pass to other functions, derive the type from a function that returns the modules:

```ts
export type MyAgent = Agent<ReturnType<typeof getAgentModules>>

export async function createDid(agent: MyAgent) {
  const { didState } = await agent.dids.create({
    method: 'jwk',
    options: { createKey: { type: { kty: 'EC', crv: 'P-256' } } },
  })
  return didState.did
}
```

`Agent` without a type argument accepts any agent, but loses the types of `agent.modules`.

## Start and stop the agent

```ts
await agent.initialize()
console.log(`Created ${await createDid(agent)}`)

await agent.shutdown()
console.log(`Agent initialized: ${agent.isInitialized}`)
```

`initialize()` initializes the modules: it opens the storage (Askar creates the store on the first run), starts DIDComm transports and adds OpenID4VC routes to the Express app. Then it checks the storage version. Calling `initialize()` on an agent that is already initialized throws.

`shutdown()` stops the modules and their transports and closes the storage. Afterwards `agent.isInitialized` is `false`, and you can initialize the agent again.

## Storage updates

Credo stores the version of its storage format. When you start a newer version of Credo on storage that needs an update, `initialize()` throws `Current agent storage is not up to date`. Set `autoUpdateStorageOnStartup: true` to run the update during `initialize()`, or run it yourself. Credo doesn't back up the storage first, so make a backup before you upgrade. See [Updating](https://credo.js.org/guides/next/updating.md).

With Drizzle, the database schema has its own SQL migrations, which you run separately. See [Drizzle](https://credo.js.org/guides/next/agent-setup/storage/drizzle.md#run-migrations).

## In this section

- [Storage](https://credo.js.org/guides/next/agent-setup/storage.md): Compare Askar and Drizzle, the two storage modules for a Credo agent, and pick the one that fits your platform and deployment.
- [Key management](https://credo.js.org/guides/next/agent-setup/key-management.md): Choose and configure the key management backends of a Credo agent (Askar, Node.js, hardware-backed keys on React Native, or your own), and use agent.kms to create keys and sign.
- [Caching](https://credo.js.org/guides/next/agent-setup/caching.md): Choose and configure the cache a Credo agent uses for resolved DID documents, ledger objects and certificate revocation lists.
- [Multi-tenancy](https://credo.js.org/guides/next/agent-setup/multi-tenancy.md): Run many isolated tenants in one Credo agent with the tenants module, choose how their data is stored, and manage tenant sessions and status.
- [Logging](https://credo.js.org/guides/next/agent-setup/logging.md): Log what a Credo agent does with the built-in ConsoleLogger or your own logger, and choose the log level.
