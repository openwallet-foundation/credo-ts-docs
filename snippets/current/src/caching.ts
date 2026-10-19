import { exampleStorage } from './example-storage.js'

const storage = await exampleStorage()

// start-section-1
import { Agent, CacheModule, InMemoryLruCache } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    ...storage, // Storage and key management, see Agent setup
    cache: new CacheModule({
      cache: new InMemoryLruCache({ limit: 500 }),
    }),
  },
})
// end-section-1

await agent.initialize()
console.log('Agent initialized with an in-memory cache')
await agent.shutdown()
