// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent, ConsoleLogger, type KeyDidCreateOptions, LogLevel } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/react-native'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'

const agent = new Agent({
  config: {
    logger: new ConsoleLogger(LogLevel.Info),
  },
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      store: {
        id: 'my-first-agent',
        // Use a key from the device's secure storage in a real app
        key: 'my-first-agent-key',
      },
    }),
  },
})
// end-section-1

// Metro doesn't support top-level await, so the steps run in a function
export async function runFirstAgent() {
  // start-section-2
  await agent.initialize()
  // end-section-2

  // start-section-3
  const { didState } = await agent.dids.create<KeyDidCreateOptions>({
    method: 'key',
    options: {
      createKey: { type: { kty: 'OKP', crv: 'Ed25519' } },
    },
  })

  if (didState.state !== 'finished') {
    throw new Error(`Creating the DID failed: ${didState.state === 'failed' ? didState.reason : didState.state}`)
  }

  const didDocument = await agent.dids.resolveDidDocument(didState.did)
  console.log(JSON.stringify(didDocument.toJSON(), null, 2))
  // end-section-3

  // start-section-4
  await agent.shutdown()
  // end-section-4
}
