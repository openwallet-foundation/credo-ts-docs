import { exampleStorage } from './example-storage.js'

const storage = await exampleStorage()

// start-section-1
import { Agent, ConsoleLogger, LogLevel } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'

const agent = new Agent({
  config: {
    // Logs Info, Warn, Error and Fatal messages
    logger: new ConsoleLogger(LogLevel.Info),
  },
  dependencies: agentDependencies,
  modules: {
    ...storage, // Storage and key management, see Agent setup
  },
})
// end-section-1

await agent.initialize()
await agent.shutdown()
