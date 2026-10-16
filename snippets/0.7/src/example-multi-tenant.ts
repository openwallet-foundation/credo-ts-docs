// start-section-1
import { AskarModule, AskarMultiWalletDatabaseScheme } from '@credo-ts/askar'
import { Agent, CacheModule, ConsoleLogger, LogLevel } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
import { RedisCache } from '@credo-ts/redis-cache'
import { TenantsModule } from '@credo-ts/tenants'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
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
  askar: new AskarModule({
    askar: NativeAskar,
    // One Postgres database, with a profile per tenant
    multiWalletDatabaseScheme: AskarMultiWalletDatabaseScheme.ProfilePerWallet,
    store: {
      id: 'multi-tenant',
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
// end-section-1

// start-section-2
export async function createVerifierTenant(label: string) {
  const tenant = await agent.modules.tenants.createTenant({ config: { label } })

  const verifier = await agent.modules.tenants.withTenantAgent({ tenantId: tenant.id }, (tenantAgent) =>
    tenantAgent.openid4vc.verifier.createVerifier({ clientMetadata: { client_name: label } })
  )

  return { tenantId: tenant.id, verifierId: verifier.verifierId }
}
// end-section-2
