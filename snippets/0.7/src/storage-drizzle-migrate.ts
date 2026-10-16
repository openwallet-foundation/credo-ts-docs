// start-section-1
import { coreBundle } from '@credo-ts/drizzle-storage/core'
import { openid4vcBundle } from '@credo-ts/drizzle-storage/openid4vc'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

const database = drizzle('file:agent.db')

// The core bundle first, then the bundles you pass to the DrizzleStorageModule
for (const bundle of [coreBundle, openid4vcBundle]) {
  await migrate(database, {
    migrationsFolder: bundle.migrations.sqlite.migrationsPath,
    // The table names the drizzle-storage CLI uses, so you can switch between the CLI and this code
    migrationsTable: `credo_migrations__${bundle.name.replace('-', '_')}`,
  })
}
// end-section-1

console.log('Applied the Credo migrations')
