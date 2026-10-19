import { exampleStorage } from './example-storage.js'

const { storage } = await exampleStorage()

// start-section-1
import { Agent } from '@credo-ts/core'
import { KeyManagementModule } from '@credo-ts/core/kms'
import { agentDependencies, NodeInMemoryKeyManagementStorage, NodeKeyManagementService } from '@credo-ts/node'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    kms: new KeyManagementModule({
      // Keys only live in memory: they are lost when the process stops
      backends: [new NodeKeyManagementService(new NodeInMemoryKeyManagementStorage())],
    }),
    storage, // Storage, see Agent setup
  },
})
// end-section-1

await agent.initialize()
const { keyId } = await agent.kms.createKey({ type: { kty: 'RSA', modulusLength: 2048 } })
console.log(`Created RSA key ${keyId} with the Node KMS`)
await agent.shutdown()
