import type { InitConfig } from '@credo-ts/core'

const config: InitConfig = {
  label: 'docs-agent-nodejs',
  walletConfig: {
    id: 'wallet-id',
    key: 'testkey0000000000000000000000000',
  },
}

import { AnonCredsModule } from '@credo-ts/anoncreds'
import { AskarModule } from '@credo-ts/askar'
// start-section-1
import { Agent } from '@credo-ts/core'
import { IndyVdrAnonCredsRegistry, IndyVdrModule } from '@credo-ts/indy-vdr'
import { agentDependencies } from '@credo-ts/node'
import { anoncreds } from '@hyperledger/anoncreds-nodejs'
import { indyVdr } from '@hyperledger/indy-vdr-nodejs'
import { askar } from '@openwallet-foundation/askar-nodejs'

const agent = new Agent({
  config,
  dependencies: agentDependencies,
  modules: {
    indyVdr: new IndyVdrModule({
      indyVdr,
      networks: [
        {
          isProduction: false,
          indyNamespace: 'bcovrin:test',
          genesisTransactions: '<genesis_transactions>',
          connectOnStartup: true,
        },
      ],
    }),
    anoncreds: new AnonCredsModule({
      registries: [new IndyVdrAnonCredsRegistry()],
      anoncreds,
    }),
    // Indy VDR can optionally be used with Askar as wallet and storage implementation
    askar: new AskarModule({
      ariesAskar: askar,
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
