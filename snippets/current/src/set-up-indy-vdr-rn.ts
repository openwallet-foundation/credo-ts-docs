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

import { IndyVdrAnonCredsRegistry, IndyVdrModule } from '@credo-ts/indy-vdr'
import { indyVdr } from '@hyperledger/indy-vdr-react-native'
import { AnonCredsModule } from '@credo-ts/anoncreds'
import { anoncreds } from '@hyperledger/anoncreds-react-native'

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
