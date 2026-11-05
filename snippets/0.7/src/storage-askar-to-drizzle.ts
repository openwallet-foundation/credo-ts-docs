// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { AskarToDrizzleStorageMigrator } from '@credo-ts/askar-to-drizzle-storage-migration'
import { ConsoleLogger, LogLevel } from '@credo-ts/core'
import { DrizzleStorageModule } from '@credo-ts/drizzle-storage'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import { drizzle } from 'drizzle-orm/libsql'

// The Askar config your agent uses today, with storage still enabled
const askarModule = new AskarModule({
  askar: NativeAskar,
  store: { id: 'my-agent', key: 'my-agent-store-key' },
})

// The Drizzle config your agent will use: an empty, migrated database and a bundle for
// every module that stored records in Askar
const drizzleModule = new DrizzleStorageModule({
  database: drizzle('file:agent.db'),
  bundles: [],
})

const migrator = await AskarToDrizzleStorageMigrator.initialize({
  askarModule,
  drizzleModule,
  agentDependencies,
  logger: new ConsoleLogger(LogLevel.Info),
})

// Copies all records from Askar to Drizzle. The keys stay in Askar.
await migrator.migrate()
// end-section-1

// start-section-2
// Removes the copied records from the Askar store, keeping the keys
await migrator.deleteStorageRecords()
// end-section-2
