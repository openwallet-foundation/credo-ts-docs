// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent, ConsoleLogger, type KeyDidCreateOptions, LogLevel } from '@credo-ts/core'
import { DrizzleStorageModule } from '@credo-ts/drizzle-storage'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import { drizzle } from 'drizzle-orm/libsql'

const agent = new Agent({
  config: {
    logger: new ConsoleLogger(LogLevel.Info),
  },
  dependencies: agentDependencies,
  modules: {
    // Records go in the tables of an SQLite file
    storage: new DrizzleStorageModule({
      database: drizzle('file:agent.db'),
      bundles: [],
    }),
    // Drizzle doesn't store keys, so Askar keeps them
    askar: new AskarModule({
      askar: NativeAskar,
      enableStorage: false,
      store: {
        id: 'my-first-agent',
        // Use a secret from your environment or a secure store in a real application
        key: 'my-first-agent-key',
      },
    }),
  },
})
// end-section-1

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
