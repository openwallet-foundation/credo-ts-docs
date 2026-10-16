// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent, ConsoleLogger, LogLevel } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

const agent = new Agent({
  config: {
    // Logs Info, Warn, Error and Fatal messages
    logger: new ConsoleLogger(LogLevel.Info),
  },
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      store: { id: 'logging-example', key: 'logging-example-key' },
    }),
  },
})
// end-section-1

await agent.initialize()
await agent.shutdown()
