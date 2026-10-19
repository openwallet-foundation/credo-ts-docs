// start-section-1
import { Agent } from '@credo-ts/core'
import { KeyManagementModule } from '@credo-ts/core/kms'
import { DrizzleStorageModule } from '@credo-ts/drizzle-storage'
import { coreBundle } from '@credo-ts/drizzle-storage/core'
import { agentDependencies, NodeInMemoryKeyManagementStorage, NodeKeyManagementService } from '@credo-ts/node'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

export async function createTestAgent() {
  // Every in-memory database starts empty, so apply the migrations each time
  const database = drizzle(':memory:')
  for (const bundle of [coreBundle]) {
    await migrate(database, {
      migrationsFolder: bundle.migrations.sqlite.migrationsPath,
      // A migrations table per bundle, as the drizzle-storage CLI uses
      migrationsTable: `credo_migrations__${bundle.name.replace('-', '_')}`,
    })
  }

  return new Agent({
    dependencies: agentDependencies,
    modules: {
      storage: new DrizzleStorageModule({ database, bundles: [] }),
      // Keys in memory as well, with node:crypto
      kms: new KeyManagementModule({
        backends: [new NodeKeyManagementService(new NodeInMemoryKeyManagementStorage())],
      }),
    },
  })
}
// end-section-1

const agent = await createTestAgent()
await agent.initialize()
await agent.genericRecords.save({ content: { hello: 'world' } })
const { keyId } = await agent.kms.createKey({ type: { kty: 'OKP', crv: 'Ed25519' } })
console.log(`In-memory agent has ${(await agent.genericRecords.getAll()).length} record(s) and key ${keyId}`)
await agent.shutdown()
