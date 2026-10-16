// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar, Store } from '@openwallet-foundation/askar-nodejs'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      store: {
        id: 'test-agent',
        // A random raw key skips the slow key derivation, which keeps tests fast
        key: Store.generateRawKey(),
        keyDerivationMethod: 'raw',
        database: { type: 'sqlite', config: { inMemory: true } },
      },
    }),
  },
})
// end-section-1

await agent.initialize()
await agent.genericRecords.save({ content: { hello: 'world' } })
console.log(`In-memory store has ${(await agent.genericRecords.getAll()).length} record(s)`)
await agent.shutdown()
