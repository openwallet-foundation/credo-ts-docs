// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import {
  DidCommHttpOutboundTransport,
  DidCommMediatorPickupStrategy,
  DidCommModule,
  DidCommWsOutboundTransport,
} from '@credo-ts/didcomm'
import { agentDependencies } from '@credo-ts/react-native'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'

// The invitation URL your mediator hands out
const mediatorInvitationUrl = 'https://mediator.example.com/invite?oob=eyJ...'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      store: { id: 'wallet', key: 'wallet-key' },
    }),
    didcomm: new DidCommModule({
      // No endpoints and no inbound transports: messages reach the wallet through the mediator
      transports: {
        outbound: [new DidCommWsOutboundTransport(), new DidCommHttpOutboundTransport()],
      },
      mediationRecipient: {
        mediatorInvitationUrl,
        mediatorPickupStrategy: DidCommMediatorPickupStrategy.PickUpV2LiveMode,
      },
      // A wallet doesn't act as a mediator
      mediator: false,
    }),
  },
})

await agent.initialize()
// end-section-1
