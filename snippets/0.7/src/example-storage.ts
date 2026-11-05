// Storage and key management for the runnable examples in these docs: Drizzle on an in-memory
// SQLite database, and keys in memory. Nothing survives a restart. For a real agent, see
// https://credo.js.org/guides/agent-setup/storage and https://credo.js.org/guides/agent-setup/key-management
import { AskarModule } from '@credo-ts/askar'
import { KeyManagementModule } from '@credo-ts/core/kms'
import { type DrizzleRecordBundle, DrizzleStorageModule } from '@credo-ts/drizzle-storage'
import { coreBundle } from '@credo-ts/drizzle-storage/core'
import { NodeInMemoryKeyManagementStorage, NodeKeyManagementService } from '@credo-ts/node'
import { createClient } from '@libsql/client'
import { NativeAskar, Store } from '@openwallet-foundation/askar-nodejs'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

async function exampleDrizzleStorage(bundles: DrizzleRecordBundle[]) {
  const database = drizzle(createClient({ url: ':memory:' }))
  for (const bundle of [coreBundle, ...bundles]) {
    await migrate(database, {
      migrationsFolder: bundle.migrations.sqlite.migrationsPath,
      // Each bundle has its own migrations table, as the drizzle-storage CLI uses
      migrationsTable: `credo_migrations__${bundle.name.replace('-', '_')}`,
    })
  }

  return new DrizzleStorageModule({ database, bundles })
}

// `bundles` are the Drizzle bundles of the modules the example uses, such as `openid4vcBundle`
export async function exampleStorage(bundles: DrizzleRecordBundle[] = []) {
  return {
    storage: await exampleDrizzleStorage(bundles),
    kms: new KeyManagementModule({
      backends: [new NodeKeyManagementService(new NodeInMemoryKeyManagementStorage())],
    }),
  }
}

// For DIDComm, which needs algorithms only Askar has, such as XSalsa20-Poly1305
export async function exampleStorageWithAskarKeys(bundles: DrizzleRecordBundle[] = []) {
  return {
    storage: await exampleDrizzleStorage(bundles),
    askar: new AskarModule({
      askar: NativeAskar,
      enableStorage: false,
      store: {
        id: `example-keys-${crypto.randomUUID()}`,
        key: Store.generateRawKey(),
        keyDerivationMethod: 'raw',
        database: { type: 'sqlite', config: { inMemory: true } },
      },
    }),
  }
}
