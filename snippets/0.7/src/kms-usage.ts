import { Agent, TypedArrayEncoder } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { exampleStorage } from './example-storage.js'

const storage = await exampleStorage()

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    ...storage, // Storage and key management, see Agent setup
  },
})
await agent.initialize()

// start-section-1
const { keyId, publicJwk } = await agent.kms.createKey({
  type: { kty: 'OKP', crv: 'Ed25519' },
})

const data = TypedArrayEncoder.fromUtf8String('Hello, Credo')
const { signature } = await agent.kms.sign({ keyId, algorithm: 'EdDSA', data })

const result = await agent.kms.verify({
  key: { publicJwk },
  algorithm: 'EdDSA',
  data,
  signature,
})
console.log(result.verified) // true
// end-section-1

await agent.kms.deleteKey({ keyId })
await agent.shutdown()
