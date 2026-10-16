// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import { KeyManagementModule } from '@credo-ts/core/kms'
import { agentDependencies, NodeInMemoryKeyManagementStorage, NodeKeyManagementService } from '@credo-ts/node'
import { NativeAskar, Store } from '@openwallet-foundation/askar-nodejs'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    kms: new KeyManagementModule({
      // Keys only live in memory: they are lost when the process stops
      backends: [new NodeKeyManagementService(new NodeInMemoryKeyManagementStorage())],
    }),
    // Askar for storage only, in memory as well
    askar: new AskarModule({
      askar: NativeAskar,
      enableKms: false,
      store: {
        id: 'test-agent',
        key: Store.generateRawKey(),
        keyDerivationMethod: 'raw',
        database: { type: 'sqlite', config: { inMemory: true } },
      },
    }),
  },
})
// end-section-1

await agent.initialize()
const { keyId } = await agent.kms.createKey({ type: { kty: 'RSA', modulusLength: 2048 } })
console.log(`Created RSA key ${keyId} with the Node KMS`)
await agent.shutdown()
