// start-section-1
import type { InitConfig } from '@aries-framework/core'
import { Agent } from '@aries-framework/core'
import { agentDependencies } from '@aries-framework/react-native'

const config: InitConfig = {
  label: 'docs-agent-react-native',
  walletConfig: {
    id: 'wallet-id',
    key: 'testkey0000000000000000000000000',
  },
}

const agent = new Agent({
  config,
  dependencies: agentDependencies,
})
// end-section-1

// start-section-2
import { HttpOutboundTransport, WsOutboundTransport } from '@aries-framework/core'

// ... agent setup from prevous section ...

agent.registerOutboundTransport(new HttpOutboundTransport())
agent.registerOutboundTransport(new WsOutboundTransport())
// end-section-2

// TODO: we probably want to make this more specific to React Native,
// so using it in a components and recommending to use the react hooks
// start-section-3
agent
  .initialize()
  .then(() => {
    console.log('Agent initialized!')
  })
  .catch((e) => {
    console.error(`Something went wrong while setting up the agent! Message: ${e}`)
  })
// end-section-3
