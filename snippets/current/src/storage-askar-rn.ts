// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/react-native'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'

// walletKey: created once with Store.generateRawKey() and kept in the device keychain
export async function initializeAgent(walletKey: string) {
  const agent = new Agent({
    dependencies: agentDependencies,
    modules: {
      askar: new AskarModule({
        askar: NativeAskar,
        store: {
          id: 'wallet',
          key: walletKey,
          keyDerivationMethod: 'raw',
        },
      }),
    },
  })

  // Creates the store on the first run, opens it on later runs
  await agent.initialize()
  return agent
}
// end-section-1
