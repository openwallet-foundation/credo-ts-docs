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
import { agentDependencies } from '@credo-ts/node'
import { AskarModule } from '@credo-ts/askar'
import { ariesAskar } from '@hyperledger/aries-askar-nodejs'

import { anoncreds } from '@hyperledger/anoncreds-nodejs'
import { AnonCredsModule } from '@credo-ts/anoncreds'
import { IndyVdrAnonCredsRegistry } from '@credo-ts/indy-vdr'

const agent = new Agent({
  config,
  dependencies: agentDependencies,
  modules: {
    // Register the Askar module on the agent
    // This is included as we need a wallet on our agent
    askar: new AskarModule({
      ariesAskar,
    }),
    anoncreds: new AnonCredsModule({
      // Here we add an Indy VDR registry as an example, any AnonCreds registry
      // can be used
      registries: [new IndyVdrAnonCredsRegistry()],
      anoncreds,
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
