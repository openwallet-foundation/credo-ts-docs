// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent, CacheModule, InMemoryLruCache } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      store: { id: 'caching-example', key: 'caching-example-store-key' },
    }),
    cache: new CacheModule({
      cache: new InMemoryLruCache({ limit: 500 }),
    }),
  },
})
// end-section-1

await agent.initialize()
console.log('Agent initialized with an in-memory cache')
await agent.shutdown()
