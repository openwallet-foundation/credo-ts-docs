// start-section-1
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
// end-section-1
