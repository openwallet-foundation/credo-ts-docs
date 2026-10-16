// start-section-1
import { AskarKeyManagementService, AskarModule } from '@credo-ts/askar'
import { Agent, TypedArrayEncoder } from '@credo-ts/core'
import { KeyManagementModule } from '@credo-ts/core/kms'
import { agentDependencies, NodeInMemoryKeyManagementStorage, NodeKeyManagementService } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    kms: new KeyManagementModule({
      backends: [new AskarKeyManagementService(), new NodeKeyManagementService(new NodeInMemoryKeyManagementStorage())],
      defaultBackend: 'askar',
    }),
    askar: new AskarModule({
      askar: NativeAskar,
      // The Askar backend is already in the backends list above
      enableKms: false,
      store: { id: 'kms-backends-example', key: 'kms-backends-example-store-key' },
    }),
  },
})
// end-section-1

await agent.initialize()

// start-section-2
// Askar supports Ed25519, so the default backend creates this key
const ed25519Key = await agent.kms.createKey({ type: { kty: 'OKP', crv: 'Ed25519' } })

// Askar doesn't support P-521, so this falls back to the node backend
const p521Key = await agent.kms.createKey({ type: { kty: 'EC', crv: 'P-521' } })

// Pass a backend to choose it explicitly
const rsaKey = await agent.kms.createKey({ backend: 'node', type: { kty: 'RSA', modulusLength: 2048 } })

// sign finds the backend that holds the key
const data = TypedArrayEncoder.fromUtf8String('Hello, Credo')
await agent.kms.sign({ keyId: p521Key.keyId, algorithm: 'ES512', data })
// end-section-2

// getPublicKey with an explicit backend throws if that backend doesn't hold the key
await agent.kms.getPublicKey({ keyId: ed25519Key.keyId, backend: 'askar' })
await agent.kms.getPublicKey({ keyId: p521Key.keyId, backend: 'node' })
await agent.kms.getPublicKey({ keyId: rsaKey.keyId, backend: 'node' })
console.log('Ed25519 key in askar, P-521 and RSA keys in node')

await agent.kms.deleteKey({ keyId: ed25519Key.keyId })
await agent.shutdown()
