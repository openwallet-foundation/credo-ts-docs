import type { InitConfig } from '@aries-framework/core'
import { Agent, HttpOutboundTransport, WsOutboundTransport } from '@aries-framework/core'
import { agentDependencies, HttpInboundTransport } from '@aries-framework/node'

// start-section-1
const config: InitConfig = {
  label: 'docs-agent-nodejs',
  walletConfig: {
    id: 'wallet-id',
    key: 'testkey0000000000000000000000000',
  },
}

const agent = new Agent(config, agentDependencies)
// end-section-1

// start-section-2
agent.registerOutboundTransport(new HttpOutboundTransport())
agent.registerOutboundTransport(new WsOutboundTransport())
agent.registerInboundTransport(new HttpInboundTransport({ port: 3000 }))
// end-section-2

// start-section-3
const run = async () => {
  try {
    await agent.initialize()
  } catch (e) {
    console.error(`Something went wrong while setting up the agent! Message: ${e}`)
  }
}
// end-section-3

void run()
