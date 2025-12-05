import type { InitConfig } from '@credo-ts/core'

const config: InitConfig = {
  label: 'docs-agent-nodejs',
  walletConfig: {
    id: 'wallet-id',
    key: 'testkey0000000000000000000000000',
  },
}

// start-section-1
import { Agent } from '@credo-ts/core'
// or import from '@credo-ts/react-native' for React Native
import { agentDependencies } from '@credo-ts/node'

import { OpenId4VcHolderModule } from '@credo-ts/openid4vc'

const agent = new Agent({
  config,
  dependencies: agentDependencies,
  modules: {
    // no configuration required for holder module
    openId4VcHolderModule: new OpenId4VcHolderModule(),
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
