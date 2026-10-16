import { AskarModule } from '@credo-ts/askar'
import { Agent, TypedArrayEncoder } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      store: { id: 'kms-example', key: 'kms-example-store-key' },
    }),
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
