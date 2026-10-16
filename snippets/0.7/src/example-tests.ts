// start-section-1
import { randomUUID } from 'node:crypto'
import { after, before, test } from 'node:test'
import { AskarModule } from '@credo-ts/askar'
import { Agent, type KeyDidCreateOptions } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar, Store } from '@openwallet-foundation/askar-nodejs'

export function createTestAgent() {
  return new Agent({
    dependencies: agentDependencies,
    modules: {
      askar: new AskarModule({
        askar: NativeAskar,
        store: {
          // A unique id keeps parallel tests apart
          id: `test-${randomUUID()}`,
          // A raw key skips the slow key derivation
          key: Store.generateRawKey(),
          keyDerivationMethod: 'raw',
          database: { type: 'sqlite', config: { inMemory: true } },
        },
      }),
    },
  })
}
// end-section-1

// start-section-2
const agent = createTestAgent()

before(() => agent.initialize())
after(() => agent.shutdown())

test('creates a did:key', async () => {
  const { didState } = await agent.dids.create<KeyDidCreateOptions>({
    method: 'key',
    options: { createKey: { type: { kty: 'OKP', crv: 'Ed25519' } } },
  })

  if (didState.state !== 'finished') throw new Error('Creating the DID failed')
})
// end-section-2
