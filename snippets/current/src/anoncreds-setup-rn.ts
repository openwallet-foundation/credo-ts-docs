// start-section-1
import { AnonCredsModule } from '@credo-ts/anoncreds'
import { AskarModule } from '@credo-ts/askar'
import { CheqdDidResolver, CheqdModule } from '@credo-ts/cheqd'
import { CheqdAnonCredsRegistry } from '@credo-ts/cheqd/anoncreds'
import { Agent, DidsModule } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/react-native'
import { NativeAnoncreds } from '@hyperledger/anoncreds-react-native'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    // Derive the store key from secure storage or user input, see the Askar page
    askar: new AskarModule({ askar: NativeAskar, store: { id: 'wallet', key: '<store key>' } }),
    // A holder only resolves objects, so it needs no payer seed
    cheqd: new CheqdModule({ networks: [{ network: 'testnet' }] }),
    dids: new DidsModule({ resolvers: [new CheqdDidResolver()] }),
    anoncreds: new AnonCredsModule({
      anoncreds: NativeAnoncreds,
      registries: [new CheqdAnonCredsRegistry()],
    }),
  },
})

await agent.initialize()
// end-section-1
