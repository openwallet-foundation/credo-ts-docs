import { exampleStorage } from './example-storage.js'

const storage = await exampleStorage()

// start-section-1
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

function getAgentModules() {
  return {
    ...storage, // Storage and key management, see Agent setup
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

export async function createDid(agent: MyAgent) {
  const { didState } = await agent.dids.create({
    method: 'jwk',
    options: { createKey: { type: { kty: 'EC', crv: 'P-256' } } },
  })
  return didState.did
}
// end-section-2

// start-section-3
await agent.initialize()
console.log(`Created ${await createDid(agent)}`)

await agent.shutdown()
console.log(`Agent initialized: ${agent.isInitialized}`)
// end-section-3
