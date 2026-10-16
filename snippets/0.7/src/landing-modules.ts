import { AskarModule } from '@credo-ts/askar'
import { Agent, CacheModule, InMemoryLruCache } from '@credo-ts/core'
import { DidCommModule } from '@credo-ts/didcomm'
import { agentDependencies } from '@credo-ts/node'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
import { TenantsModule } from '@credo-ts/tenants'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

const store = {
  id: 'credo',
  key: process.env.STORE_KEY ?? '',
  database: {
    type: 'postgres' as const,
    config: { host: 'localhost:5432' },
    credentials: {
      account: 'credo',
      password: process.env.POSTGRES_PASSWORD ?? '',
    },
  },
}

// start-section-1
const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    // Storage and keys, here Askar on PostgreSQL
    askar: new AskarModule({ askar: NativeAskar, store }),
    // Replace the default cache, required with tenants
    cache: new CacheModule({ cache: new InMemoryLruCache({ limit: 500 }) }),
    tenants: new TenantsModule(),
    // Exchange protocols
    openid4vc: new OpenId4VcModule(),
    didcomm: new DidCommModule(),
  },
})
// end-section-1

await agent.initialize()
