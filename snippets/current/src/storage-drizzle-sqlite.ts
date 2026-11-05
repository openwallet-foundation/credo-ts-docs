// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import { DrizzleStorageModule } from '@credo-ts/drizzle-storage'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import { drizzle } from 'drizzle-orm/libsql'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    storage: new DrizzleStorageModule({
      database: drizzle('file:agent.db'),
      bundles: [],
    }),
    // Drizzle doesn't store keys: Askar provides the KMS
    askar: new AskarModule({
      askar: NativeAskar,
      enableStorage: false,
      store: { id: 'credo-keys', key: 'my-agent-store-key' },
    }),
  },
})

// Run the migrations first: the module doesn't create tables
await agent.initialize()
// end-section-1

await agent.genericRecords.save({ content: { hello: 'world' } })
console.log(`Drizzle storage has ${(await agent.genericRecords.getAll()).length} generic record(s)`)

const { keyId } = await agent.kms.createKey({ type: { kty: 'OKP', crv: 'Ed25519' } })
console.log(`Created key ${keyId} in Askar`)

await agent.shutdown()
