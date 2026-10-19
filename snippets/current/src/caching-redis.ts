import { exampleStorage } from './example-storage.js'

const storage = await exampleStorage()

// start-section-1
import { Agent, CacheModule } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { RedisCache } from '@credo-ts/redis-cache'
import { Redis } from 'ioredis'

const redis = new Redis('redis://localhost:6379')

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    ...storage, // Storage and key management, see Agent setup
    cache: new CacheModule({
      // Also accepts ioredis options, e.g. new RedisCache({ host: 'localhost', port: 6379 })
      cache: new RedisCache(redis),
      defaultExpiryInSeconds: 300,
    }),
  },
})
// end-section-1

await agent.initialize()

// start-section-2
await agent.shutdown()
// The agent doesn't close the Redis connection for you
await redis.quit()
// end-section-2
