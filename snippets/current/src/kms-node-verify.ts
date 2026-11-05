import { generateKeyPairSync, sign } from 'node:crypto'

import { exampleStorage } from './example-storage.js'

const { storage } = await exampleStorage()

// start-section-1
import { AskarKeyManagementService, AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import { KeyManagementModule } from '@credo-ts/core/kms'
import { agentDependencies, NodeInMemoryKeyManagementStorage, NodeKeyManagementService } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    storage, // Storage, see Agent setup
    kms: new KeyManagementModule({
      backends: [
        new AskarKeyManagementService(),
        // Only verifies with public keys passed in the call, so nothing is stored in it
        new NodeKeyManagementService(new NodeInMemoryKeyManagementStorage()),
      ],
      defaultBackend: 'askar',
    }),
    askar: new AskarModule({
      askar: NativeAskar,
      enableStorage: false,
      enableKms: false,
      store: { id: 'kms-node-verify-example', key: 'kms-node-verify-example-store-key' },
    }),
  },
})
// end-section-1

await agent.initialize()

// A signature made outside Credo, for example by an RSA certificate authority
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const data = new TextEncoder().encode('Signed elsewhere')
const signature = sign('sha256', data, privateKey)
const { n, e } = publicKey.export({ format: 'jwk' })
if (!n || !e) throw new Error('Expected an RSA public key')

// start-section-2
// Askar can't verify RS256, so Credo falls back to the node backend
const { verified } = await agent.kms.verify({
  key: { publicJwk: { kty: 'RSA', n, e } },
  algorithm: 'RS256',
  data,
  signature,
})
// end-section-2

console.log(`RSA signature verified: ${verified}`)
await agent.shutdown()
