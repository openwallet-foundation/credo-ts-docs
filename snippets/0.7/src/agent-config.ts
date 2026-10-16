// start-section-1
import { AskarModule } from '@credo-ts/askar'
import {
  Agent,
  ConsoleLogger,
  DidsModule,
  JwkDidRegistrar,
  JwkDidResolver,
  KeyDidRegistrar,
  KeyDidResolver,
  LogLevel,
  WebDidResolver,
} from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

function getAgentModules() {
  return {
    askar: new AskarModule({
      askar: NativeAskar,
      store: { id: 'agent-config-example', key: 'agent-config-example-key' },
    }),
    // Same key as the default module, so it replaces it
    dids: new DidsModule({
      registrars: [new KeyDidRegistrar(), new JwkDidRegistrar()],
      resolvers: [new KeyDidResolver(), new JwkDidResolver(), new WebDidResolver()],
    }),
  }
}

const agent = new Agent({
  config: {
    logger: new ConsoleLogger(LogLevel.Warn),
  },
  dependencies: agentDependencies,
  modules: getAgentModules(),
})
// end-section-1

// start-section-2
export type MyAgent = Agent<ReturnType<typeof getAgentModules>>

export function isAgentReady(agent: MyAgent) {
  // `askar` is not a default module, so its API is under `agent.modules`
  return agent.isInitialized && agent.modules.askar.isStoreOpen
}
// end-section-2

// start-section-3
await agent.initialize()
console.log(`Agent ready: ${isAgentReady(agent)}`)

await agent.shutdown()
console.log(`Agent ready: ${isAgentReady(agent)}`)
// end-section-3
