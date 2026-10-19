// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      store: {
        id: 'my-agent',
        // Load the key from a secret store in production
        key: 'my-agent-store-key',
      },
    }),
  },
})

// Creates the store on the first run, opens it on later runs
await agent.initialize()
// end-section-1

await agent.genericRecords.save({ content: { hello: 'world' } })
const records = await agent.genericRecords.getAll()
console.log(`Stored ${records.length} generic record(s)`)

await agent.shutdown()
