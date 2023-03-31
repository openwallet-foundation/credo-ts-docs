import type { InitConfig } from '@aries-framework/core'

const config: InitConfig = {
  label: 'docs-agent-react-native',
  walletConfig: {
    id: 'wallet-id',
    key: 'testkey0000000000000000000000000',
  },
}

// start-section-1
import { Agent } from '@aries-framework/core'
import { agentDependencies } from '@aries-framework/node'
import { IndySdkModule } from '@aries-framework/indy-sdk'
import indySdk from 'indy-sdk'

const agent = new Agent({
  config,
  dependencies: agentDependencies,
  modules: {
    // Register the Indy SDK module on the agent
    indySdk: new IndySdkModule({
      indySdk,
    }),
  },
})
// end-section-1

await agent
  .initialize()
  .then(() => {
    console.log('Agent initialized!')
  })
  .catch((e) => {
    console.error(`Something went wrong while setting up the agent! Message: ${e}`)
  })
