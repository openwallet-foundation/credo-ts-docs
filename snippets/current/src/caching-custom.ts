// start-section-1
import type { AgentContext, Cache, CacheOptions } from '@credo-ts/core'

export class MapCache implements Cache {
  private entries = new Map<string, { value: unknown; expiresAt?: number }>()

  // Isolate entries per agent context unless the caller asks for the global scope
  private key(agentContext: AgentContext, key: string, options?: CacheOptions) {
    return options?.scope === 'global' ? `global:${key}` : `${agentContext.contextCorrelationId}:${key}`
  }

  public async get<CacheValue>(agentContext: AgentContext, key: string, options?: CacheOptions) {
    const namespacedKey = this.key(agentContext, key, options)
    const entry = this.entries.get(namespacedKey)
    if (!entry) return null

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.entries.delete(namespacedKey)
      return null
    }

    return entry.value as CacheValue
  }

  public async set<CacheValue>(
    agentContext: AgentContext,
    key: string,
    value: CacheValue,
    expiresInSeconds?: number,
    options?: CacheOptions
  ) {
    this.entries.set(this.key(agentContext, key, options), {
      value,
      expiresAt: expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : undefined,
    })
  }

  public async remove(agentContext: AgentContext, key: string, options?: CacheOptions) {
    this.entries.delete(this.key(agentContext, key, options))
  }
}

// end-section-1

import { Agent, CacheModule } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { exampleStorage } from './example-storage.js'

const cache = new MapCache()
const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    ...(await exampleStorage()),
    cache: new CacheModule({ cache }),
  },
})

await agent.initialize()
await cache.set(agent.context, 'greeting', 'hello', 60)
await cache.set(agent.context, 'greeting', 'hello everyone', 60, { scope: 'global' })
console.log(
  await cache.get(agent.context, 'greeting'),
  '/',
  await cache.get(agent.context, 'greeting', { scope: 'global' })
)
await agent.shutdown()
