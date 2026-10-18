// start-section-1
import { after, before, test } from 'node:test'
import { Agent, type KeyDidCreateOptions } from '@credo-ts/core'
import { KeyManagementModule } from '@credo-ts/core/kms'
import { DrizzleStorageModule } from '@credo-ts/drizzle-storage'
import { coreBundle } from '@credo-ts/drizzle-storage/core'
import { agentDependencies, NodeInMemoryKeyManagementStorage, NodeKeyManagementService } from '@credo-ts/node'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

export async function createTestAgent() {
  // A new in-memory database for every agent keeps parallel tests apart
  const database = drizzle(createClient({ url: ':memory:' }))
  await migrate(database, {
    migrationsFolder: coreBundle.migrations.sqlite.migrationsPath,
    // Give every bundle you add its own migrations table
    migrationsTable: 'credo_migrations__core',
  })

  return new Agent({
    dependencies: agentDependencies,
    modules: {
      storage: new DrizzleStorageModule({ database, bundles: [] }),
      // Keeps the keys in memory
      kms: new KeyManagementModule({
        backends: [new NodeKeyManagementService(new NodeInMemoryKeyManagementStorage())],
      }),
    },
  })
}
// end-section-1

// start-section-2
const agent = await createTestAgent()

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
