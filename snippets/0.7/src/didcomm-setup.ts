// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import {
  DidCommConnectionEventTypes,
  type DidCommConnectionStateChangedEvent,
  DidCommDidExchangeState,
  DidCommHttpOutboundTransport,
  DidCommModule,
  DidCommWsOutboundTransport,
} from '@credo-ts/didcomm'
import { agentDependencies, DidCommHttpInboundTransport, DidCommWsInboundTransport } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      store: { id: 'acme-agent', key: 'acme-agent-key' },
    }),
    didcomm: new DidCommModule({
      // The public URLs other agents use to reach this agent, in order of preference
      endpoints: ['http://localhost:4040', 'ws://localhost:4041'],
      transports: {
        inbound: [new DidCommHttpInboundTransport({ port: 4040 }), new DidCommWsInboundTransport({ port: 4041 })],
        outbound: [new DidCommHttpOutboundTransport(), new DidCommWsOutboundTransport()],
      },
      connections: { autoAcceptConnections: true },
    }),
  },
})

await agent.initialize()
// end-section-1

// start-section-2
agent.events.on<DidCommConnectionStateChangedEvent>(
  DidCommConnectionEventTypes.DidCommConnectionStateChanged,
  ({ payload }) => {
    const { connectionRecord, previousState } = payload
    console.log(`Connection ${connectionRecord.id}: ${previousState} -> ${connectionRecord.state}`)

    if (connectionRecord.state === DidCommDidExchangeState.Completed) {
      console.log(`Connected with ${connectionRecord.theirLabel}`)
    }
  }
)
// end-section-2

await agent.shutdown()
