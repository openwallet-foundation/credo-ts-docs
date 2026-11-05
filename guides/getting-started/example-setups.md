# Example setups

> Complete Credo agent configurations for a mobile wallet, an issuer and verifier service, a multi-tenant service, a DIDComm mediator and tests.

Each recipe on this page is a complete, type-checked agent configuration for a common deployment. Start from the one closest to what you build. The linked pages explain the options.

## Mobile wallet

Start here if you build a wallet app for phones. This React Native app [receives](https://credo.js.org/guides/protocols/openid4vc/receive.md) and [presents](https://credo.js.org/guides/protocols/openid4vc/present.md) credentials with OpenID4VC, and connects to other agents over [DIDComm](https://credo.js.org/guides/protocols/didcomm.md) through a mediator. Askar stores the data and keys, and keys that must stay in the device's secure hardware use the secure environment backend.

Install the packages from [Installation](https://credo.js.org/guides/getting-started/installation.md), and:

```bash
npm install @credo-ts/openid4vc@^0.7.2 @credo-ts/didcomm@^0.7.2 @animo-id/expo-secure-environment@^0.1.5
```

```ts
import { AskarKeyManagementService, AskarModule } from '@credo-ts/askar'
import { Agent, ConsoleLogger, LogLevel } from '@credo-ts/core'
import { KeyManagementModule } from '@credo-ts/core/kms'
import {
  DidCommHttpOutboundTransport,
  DidCommMediatorPickupStrategy,
  DidCommModule,
  DidCommWsOutboundTransport,
} from '@credo-ts/didcomm'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
import { agentDependencies, SecureEnvironmentKeyManagementService } from '@credo-ts/react-native'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'

interface WalletAgentOptions {
  // A raw key from Store.generateRawKey(), kept in the device keychain
  walletKey: string
  // Invitation URL of the mediator that receives DIDComm messages for this wallet
  mediatorInvitationUrl: string
}

export function createWalletAgent({ walletKey, mediatorInvitationUrl }: WalletAgentOptions) {
  return new Agent({
    config: {
      logger: new ConsoleLogger(LogLevel.Warn),
    },
    dependencies: agentDependencies,
    modules: {
      askar: new AskarModule({
        askar: NativeAskar,
        store: { id: 'wallet', key: walletKey, keyDerivationMethod: 'raw' },
        // The Askar backend is registered in the kms module below, so it can be the default
        enableKms: false,
      }),
      kms: new KeyManagementModule({
        backends: [new AskarKeyManagementService(), new SecureEnvironmentKeyManagementService()],
        defaultBackend: 'askar',
      }),
      openid4vc: new OpenId4VcModule(),
      didcomm: new DidCommModule({
        // No inbound transports: messages for the wallet go through the mediator
        transports: {
          outbound: [new DidCommWsOutboundTransport(), new DidCommHttpOutboundTransport()],
        },
        mediationRecipient: {
          mediatorInvitationUrl,
          mediatorPickupStrategy: DidCommMediatorPickupStrategy.PickUpV2LiveMode,
        },
        mediator: false,
      }),
    },
  })
}

export type WalletAgent = ReturnType<typeof createWalletAgent>
```

Askar is the default [key management](https://credo.js.org/guides/agent-setup/key-management.md) backend. A key goes to the secure environment only when you create it with `backend: 'secureEnvironment'`, which supports P-256 keys and ES256 signatures. `walletKey` is a raw key that you generate once and keep in the device keychain, see [Askar](https://credo.js.org/guides/agent-setup/storage/askar.md).

If the wallet only uses OpenID4VC, leave out the `didcomm` module and package. [Mediation](https://credo.js.org/guides/protocols/didcomm/mediation.md) explains the pickup strategies.

## Issuer and verifier service

Start here if your organization issues or verifies credentials from its own backend. This Node.js service issues credentials with [OpenID4VCI](https://credo.js.org/guides/protocols/openid4vc/issuer.md) and verifies presentations with [OpenID4VP](https://credo.js.org/guides/protocols/openid4vc/verifier.md). It stores its records in PostgreSQL with [Drizzle](https://credo.js.org/guides/agent-setup/storage/drizzle.md), its keys in Askar and its cache in Redis, so you can run several instances of it.

```bash
npm install @credo-ts/core@^0.7.2 @credo-ts/node@^0.7.2 @credo-ts/drizzle-storage@^0.7.2 @credo-ts/askar@^0.7.2 @credo-ts/openid4vc@^0.7.2 @credo-ts/redis-cache@^0.7.2 @openwallet-foundation/askar-nodejs@0.6.1 drizzle-orm@^0.44.6 pg express@^5 ioredis
```
```bash
npm install --save-dev @types/express@^5
```

```ts
import { AskarModule } from '@credo-ts/askar'
import { Agent, CacheModule, ClaimFormat, ConsoleLogger, LogLevel } from '@credo-ts/core'
import { DrizzleStorageModule } from '@credo-ts/drizzle-storage'
import { openid4vcBundle } from '@credo-ts/drizzle-storage/openid4vc'
import { agentDependencies } from '@credo-ts/node'
import {
  OpenId4VciCredentialFormatProfile,
  type OpenId4VciCredentialRequestToCredentialMapper,
  OpenId4VcModule,
} from '@credo-ts/openid4vc'
import { RedisCache } from '@credo-ts/redis-cache'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import { drizzle } from 'drizzle-orm/node-postgres'
import express from 'express'
import { Redis } from 'ioredis'

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Environment variable ${name} is not set`)
  return value
}

// The URL wallets use to reach this service, for example https://issuer.example.com
const publicUrl = env('PUBLIC_URL')

// Issues an SD-JWT VC with the claims you set as issuanceMetadata when creating the offer
const credentialRequestToCredentialMapper: OpenId4VciCredentialRequestToCredentialMapper = ({
  credentialConfiguration,
  holderBinding,
  issuanceSession,
}) => {
  if (credentialConfiguration.format !== OpenId4VciCredentialFormatProfile.SdJwtDc) {
    throw new Error(`Unsupported credential format '${credentialConfiguration.format}'`)
  }

  return {
    type: 'credentials',
    format: ClaimFormat.SdJwtDc,
    credentials: holderBinding.keys.map((holder) => ({
      payload: { vct: credentialConfiguration.vct, ...issuanceSession.issuanceMetadata },
      holder,
      issuer: { method: 'did', didUrl: env('ISSUER_DID_URL') },
    })),
  }
}

const app = express()
const redis = new Redis(env('REDIS_URL'))

const agent = new Agent({
  config: {
    logger: new ConsoleLogger(LogLevel.Info),
  },
  dependencies: agentDependencies,
  modules: {
    // Records go in PostgreSQL tables. Run the migrations of the core and openid4vc bundles first.
    storage: new DrizzleStorageModule({
      database: drizzle(env('DATABASE_URL')),
      bundles: [openid4vcBundle],
    }),
    // Drizzle doesn't store keys, so Askar keeps them, in a PostgreSQL database of its own
    askar: new AskarModule({
      askar: NativeAskar,
      enableStorage: false,
      store: {
        // Also the name of the PostgreSQL database
        id: 'issuer-verifier-keys',
        key: env('STORE_KEY'),
        database: {
          type: 'postgres',
          config: { host: env('POSTGRES_HOST') },
          credentials: { account: env('POSTGRES_USER'), password: env('POSTGRES_PASSWORD') },
        },
      },
    }),
    // Shared by all instances of the service
    cache: new CacheModule({ cache: new RedisCache(redis) }),
    openid4vc: new OpenId4VcModule({
      app,
      issuer: { baseUrl: `${publicUrl}/oid4vci`, credentialRequestToCredentialMapper },
      verifier: { baseUrl: `${publicUrl}/oid4vp` },
    }),
  },
})

// Mounts the OpenID4VC routes on the Express app
await agent.initialize()
const server = app.listen(4000)

process.on('SIGTERM', async () => {
  server.close()
  await agent.shutdown()
  // The agent doesn't close the Redis connection
  await redis.quit()
})
```

`credentialRequestToCredentialMapper` decides which credential the issuer signs for a request. This one signs SD-JWT VCs with a DID that the agent created before, set in `ISSUER_DID_URL`. Before you can offer credentials, create an issuer record. [Issuing credentials](https://credo.js.org/guides/protocols/openid4vc/issuer.md) covers the mapper, issuer records and offers.

`agent.initialize()` adds the OpenID4VC routes to the Express app, so start the server after it.

Drizzle doesn't create tables. Run the migrations before every deploy:

```bash
npx drizzle-storage --bundle core --bundle openid4vc migrate --dialect postgres --database-url "$DATABASE_URL"
```

## Multi-tenant service

Start here if you host issuers or verifiers for many organizations in one deployment. Each organization is a tenant with its own DIDs, keys and records. See [Multi-tenancy](https://credo.js.org/guides/agent-setup/multi-tenancy.md).

Install the packages of the issuer and verifier service, and:

```bash
npm install @credo-ts/tenants@^0.7.2
```

```ts
import { AskarModule, AskarMultiWalletDatabaseScheme } from '@credo-ts/askar'
import { Agent, CacheModule, ConsoleLogger, LogLevel } from '@credo-ts/core'
import { DrizzleStorageModule } from '@credo-ts/drizzle-storage'
import { openid4vcBundle } from '@credo-ts/drizzle-storage/openid4vc'
import { tenantsBundle } from '@credo-ts/drizzle-storage/tenants'
import { agentDependencies } from '@credo-ts/node'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
import { RedisCache } from '@credo-ts/redis-cache'
import { TenantsModule } from '@credo-ts/tenants'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import { drizzle } from 'drizzle-orm/node-postgres'
import express from 'express'
import { Redis } from 'ioredis'

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Environment variable ${name} is not set`)
  return value
}

const app = express()
const redis = new Redis(env('REDIS_URL'))

const modules = {
  // The records of all tenants in one PostgreSQL database. Run the migrations of the core,
  // openid4vc and tenants bundles first.
  storage: new DrizzleStorageModule({
    database: drizzle(env('DATABASE_URL')),
    bundles: [openid4vcBundle, tenantsBundle],
  }),
  // Drizzle doesn't store keys, so Askar keeps them: one database, with a profile per tenant
  askar: new AskarModule({
    askar: NativeAskar,
    enableStorage: false,
    multiWalletDatabaseScheme: AskarMultiWalletDatabaseScheme.ProfilePerWallet,
    store: {
      id: 'multi-tenant-keys',
      key: env('STORE_KEY'),
      database: {
        type: 'postgres',
        config: { host: env('POSTGRES_HOST') },
        credentials: { account: env('POSTGRES_USER'), password: env('POSTGRES_PASSWORD') },
      },
    },
  }),
  // Required: the default cache throws as soon as a second agent context (a tenant) uses it
  cache: new CacheModule({ cache: new RedisCache(redis) }),
  openid4vc: new OpenId4VcModule({
    app,
    verifier: { baseUrl: `${env('PUBLIC_URL')}/oid4vp` },
  }),
}

const agent = new Agent({
  config: {
    logger: new ConsoleLogger(LogLevel.Info),
  },
  dependencies: agentDependencies,
  modules: {
    ...modules,
    // Tenant agents share the modules of the root agent. The type argument types their API.
    tenants: new TenantsModule<typeof modules>({ sessionLimit: 500 }),
  },
})

await agent.initialize()
app.listen(4000)
```

Replace the default cache: it works with one agent context only, and throws as soon as a tenant uses it. Use `InMemoryLruCache` for a single instance or `RedisCache` for several, see [Caching](https://credo.js.org/guides/agent-setup/caching.md). Drizzle keeps the records of all tenants in one database. `ProfilePerWallet` does the same for the keys, with an Askar profile per tenant.

Run the migrations with the tenants bundle:

```bash
npx drizzle-storage --bundle core --bundle openid4vc --bundle tenants migrate --dialect postgres --database-url "$DATABASE_URL"
```

Tenant agents use the modules of the root agent, and the OpenID4VC endpoints route each request to the tenant that owns the issuer or verifier. Create a tenant and set it up through a tenant agent:

```ts
export async function createVerifierTenant(label: string) {
  const tenant = await agent.modules.tenants.createTenant({ config: { label } })

  const verifier = await agent.modules.tenants.withTenantAgent({ tenantId: tenant.id }, (tenantAgent) =>
    tenantAgent.openid4vc.verifier.createVerifier({ clientMetadata: { client_name: label } })
  )

  return { tenantId: tenant.id, verifierId: verifier.verifierId }
}
```

## DIDComm mediator

Start here if the mobile wallets in your DIDComm ecosystem need a mediator. This public Node.js service receives DIDComm messages for wallets without an endpoint of their own, and holds them until the wallet picks them up. It stores records in PostgreSQL with Drizzle, keeps keys in Askar and caches in Redis. See [Mediation](https://credo.js.org/guides/protocols/didcomm/mediation.md).

```bash
npm install @credo-ts/core@^0.7.2 @credo-ts/node@^0.7.2 @credo-ts/askar@^0.7.2 @credo-ts/didcomm@^0.7.2 @credo-ts/drizzle-storage@^0.7.2 @credo-ts/redis-cache@^0.7.2 @openwallet-foundation/askar-nodejs@0.6.1 drizzle-orm@^0.44.6 pg ioredis
```

```ts
import { AskarModule } from '@credo-ts/askar'
import { Agent, CacheModule, ConsoleLogger, LogLevel } from '@credo-ts/core'
import { DidCommHttpOutboundTransport, DidCommModule, DidCommWsOutboundTransport } from '@credo-ts/didcomm'
import { DrizzleStorageModule } from '@credo-ts/drizzle-storage'
import { didcommBundle } from '@credo-ts/drizzle-storage/didcomm'
import { agentDependencies, DidCommHttpInboundTransport, DidCommWsInboundTransport } from '@credo-ts/node'
import { RedisCache } from '@credo-ts/redis-cache'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Redis } from 'ioredis'

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Environment variable ${name} is not set`)
  return value
}

const redis = new Redis(env('REDIS_URL'))

const agent = new Agent({
  config: {
    logger: new ConsoleLogger(LogLevel.Info),
    autoUpdateStorageOnStartup: true,
  },
  dependencies: agentDependencies,
  modules: {
    // Run the Drizzle migrations for the core and didcomm bundles before you start the agent
    storage: new DrizzleStorageModule({
      database: drizzle(env('DATABASE_URL')),
      bundles: [didcommBundle],
    }),
    // Drizzle doesn't store keys, so Askar provides the KMS
    askar: new AskarModule({
      askar: NativeAskar,
      enableStorage: false,
      store: {
        id: 'mediator-keys',
        key: env('STORE_KEY'),
        database: {
          type: 'postgres',
          config: { host: env('POSTGRES_HOST') },
          credentials: { account: env('POSTGRES_USER'), password: env('POSTGRES_PASSWORD') },
        },
      },
    }),
    cache: new CacheModule({ cache: new RedisCache(redis) }),
    didcomm: new DidCommModule({
      // The public URLs of the HTTP and WebSocket transports, for example behind a reverse proxy
      endpoints: [env('HTTP_ENDPOINT'), env('WS_ENDPOINT')],
      transports: {
        inbound: [new DidCommHttpInboundTransport({ port: 4000 }), new DidCommWsInboundTransport({ port: 4001 })],
        outbound: [new DidCommHttpOutboundTransport(), new DidCommWsOutboundTransport()],
      },
      connections: { autoAcceptConnections: true },
      mediator: { autoAcceptMediationRequests: true },
      // Message pickup is enabled by default. A mediator doesn't need the other protocols.
      mediationRecipient: false,
      credentials: false,
      proofs: false,
      basicMessages: false,
    }),
  },
})

await agent.initialize()

process.on('SIGTERM', async () => {
  await agent.shutdown()
  await redis.quit()
})
```

Run the migrations before you start it:

```bash
npx drizzle-storage --bundle core --bundle didcomm migrate --dialect postgres --database-url "$DATABASE_URL"
```

Queued messages are kept in memory by default, so they're lost on restart and not shared between instances. For production, pass a persistent `queueTransportRepository` to the `DidCommModule`. [DIDComm Mediator Credo](https://github.com/openwallet-foundation/didcomm-mediator-credo) is a complete mediator that can keep the queue in PostgreSQL or DynamoDB.

`autoUpdateStorageOnStartup` migrates the storage when you upgrade Credo. Back up the database first, see [Updating](https://credo.js.org/guides/updating.md).

## Tests

Start here for unit and integration tests of your own code. Each agent gets its own in-memory SQLite database and keeps its keys in memory, so tests don't share state and nothing is written to disk.

```ts
import { after, before, test } from 'node:test'
import { Agent, type KeyDidCreateOptions } from '@credo-ts/core'
import { KeyManagementModule } from '@credo-ts/core/kms'
import { DrizzleStorageModule } from '@credo-ts/drizzle-storage'
import { coreBundle } from '@credo-ts/drizzle-storage/core'
import { agentDependencies, NodeInMemoryKeyManagementStorage, NodeKeyManagementService } from '@credo-ts/node'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

export async function createTestAgent() {
  // A new in-memory database for every agent keeps parallel tests apart
  const database = drizzle(createClient({ url: ':memory:' }))
  await migrate(database, {
    migrationsFolder: coreBundle.migrations.sqlite.migrationsPath,
    // Give every bundle you add its own migrations table
    migrationsTable: 'credo_migrations__core',
  })

  return new Agent({
    dependencies: agentDependencies,
    modules: {
      storage: new DrizzleStorageModule({ database, bundles: [] }),
      // Keeps the keys in memory
      kms: new KeyManagementModule({
        backends: [new NodeKeyManagementService(new NodeInMemoryKeyManagementStorage())],
      }),
    },
  })
}
```

The Node.js [key management](https://credo.js.org/guides/agent-setup/key-management.md) backend is lighter than Askar and needs no store. DIDComm needs XSalsa20-Poly1305, which only Askar has, so tests that use DIDComm keep the keys in Askar with an in-memory store. A test with Node.js's test runner:

```ts
const agent = await createTestAgent()

before(() => agent.initialize())
after(() => agent.shutdown())

test('creates a did:key', async () => {
  const { didState } = await agent.dids.create<KeyDidCreateOptions>({
    method: 'key',
    options: { createKey: { type: { kty: 'OKP', crv: 'Ed25519' } } },
  })

  if (didState.state !== 'finished') throw new Error('Creating the DID failed')
})
```
