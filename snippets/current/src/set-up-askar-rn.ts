import type { InitConfig } from '@credo-ts/core'

const config: InitConfig = {
  label: 'docs-agent-react-native',
  walletConfig: {
    id: 'wallet-id',
    key: 'testkey0000000000000000000000000',
  },
}

// start-section-1
import { Agent } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/react-native'
import { AskarModule } from '@credo-ts/askar'
import { ariesAskar } from '@hyperledger/aries-askar-react-native'

const agent = new Agent({
  config,
  dependencies: agentDependencies,
  modules: {
    // Register the Askar module on the agent
    askar: new AskarModule({
      ariesAskar,
    }),
  },
})
// end-section-1

agent
  .initialize()
  .then(() => {
    console.log('Agent initialized!')
  })
  .catch((e) => {
    console.error(`Something went wrong while setting up the agent! Message: ${e}`)
  })
