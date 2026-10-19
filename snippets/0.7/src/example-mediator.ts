// start-section-1
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
// end-section-1
