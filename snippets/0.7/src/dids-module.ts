import { AskarModule } from '@credo-ts/askar'
// start-section-1
import {
  Agent,
  DidsModule,
  JwkDidRegistrar,
  JwkDidResolver,
  KeyDidRegistrar,
  KeyDidResolver,
  PeerDidRegistrar,
  PeerDidResolver,
  WebDidResolver,
} from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { WebVhDidRegistrar, WebVhDidResolver, WebVhModule } from '@credo-ts/webvh'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

const didModules = {
  webvh: new WebVhModule(),
  dids: new DidsModule({
    // These lists replace the defaults, so include the built-in methods you still need
    registrars: [new KeyDidRegistrar(), new PeerDidRegistrar(), new JwkDidRegistrar(), new WebVhDidRegistrar()],
    resolvers: [
      new KeyDidResolver(),
      new PeerDidResolver(),
      new JwkDidResolver(),
      new WebDidResolver(),
      new WebVhDidResolver(),
    ],
  }),
}
// end-section-1

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    ...didModules,
    askar: new AskarModule({
      askar: NativeAskar,
      store: { id: 'dids-module', key: 'dids-module', database: { type: 'sqlite', config: { inMemory: true } } },
    }),
  },
})

await agent.initialize()
console.log(agent.dids.supportedResolverMethods, agent.dids.supportedRegistrarMethods)
await agent.shutdown()
