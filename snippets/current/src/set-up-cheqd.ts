import type { InitConfig } from '@aries-framework/core'

const config: InitConfig = {
  label: 'docs-agent-react-native',
  walletConfig: {
    id: 'wallet-id',
    key: 'testkey0000000000000000000000000',
  },
}

// start-section-1
import { Agent, DidsModule } from '@aries-framework/core'
import { agentDependencies } from '@aries-framework/react-native'
import { AskarModule } from '@aries-framework/askar'
import { ariesAskar } from '@hyperledger/aries-askar-react-native'

import { CheqdAnonCredsRegistry, CheqdDidRegistrar, CheqdDidResolver, CheqdModule, CheqdModuleConfig } from '@aries-framework/cheqd'
import { AnonCredsModule } from '@aries-framework/anoncreds'

const agent = new Agent({
  config,
  dependencies: agentDependencies,
  modules: {
    dids: new DidsModule({
      registrars: [new CheqdDidRegistrar()],
      resolvers: [new CheqdDidResolver()],
    }),

    // AnonCreds
    anoncreds: new AnonCredsModule({
      registries: [new CheqdAnonCredsRegistry()],
    }),

    // Add cheqd module
    cheqd: new CheqdModule(new CheqdModuleConfig({
        networks: [
          {
            network: '<mainnet or testnet>',
            cosmosPayerSeed: '<cosmos payer seed or mnemonic>',
          },
        ],
      })),
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
