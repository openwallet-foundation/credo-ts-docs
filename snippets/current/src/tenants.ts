// start-section-1
import { AskarModule, AskarMultiWalletDatabaseScheme } from '@credo-ts/askar'
import { Agent, CacheModule, InMemoryLruCache } from '@credo-ts/core'
import { DrizzleStorageModule } from '@credo-ts/drizzle-storage'
import { tenantsBundle } from '@credo-ts/drizzle-storage/tenants'
import { agentDependencies } from '@credo-ts/node'
import { TenantInactiveError, TenantStatus, TenantsModule } from '@credo-ts/tenants'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import { drizzle } from 'drizzle-orm/libsql'

// Run the migrations of the core and tenants bundles first
const database = drizzle('file:agent.db')

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    // The records of all tenants in one database
    storage: new DrizzleStorageModule({ database, bundles: [tenantsBundle] }),
    askar: new AskarModule({
      askar: NativeAskar,
      enableStorage: false,
      store: { id: 'credo-keys', key: 'my-agent-store-key' },
      // The keys of all tenants in one Askar store, with a profile per tenant
      multiWalletDatabaseScheme: AskarMultiWalletDatabaseScheme.ProfilePerWallet,
    }),
    tenants: new TenantsModule({ sessionLimit: 100, sessionAcquireTimeout: 5000 }),
    // The default cache throws as soon as a second agent context (a tenant) uses it
    cache: new CacheModule({ cache: new InMemoryLruCache({ limit: 5000 }) }),
  },
})

// end-section-1

import { coreBundle } from '@credo-ts/drizzle-storage/core'
import { migrate } from 'drizzle-orm/libsql/migrator'

// The same migrations as in storage-drizzle-migrate.ts, with the tenants bundle
for (const bundle of [coreBundle, tenantsBundle]) {
  await migrate(database, {
    migrationsFolder: bundle.migrations.sqlite.migrationsPath,
    migrationsTable: `credo_migrations__${bundle.name.replace('-', '_')}`,
  })
}
await agent.initialize()

// start-section-2
const tenantRecord = await agent.modules.tenants.createTenant({
  config: { label: 'Tenant 1' },
})
// end-section-2

// start-section-3
// Opens a session, runs the callback and always ends the session
const did = await agent.modules.tenants.withTenantAgent({ tenantId: tenantRecord.id }, async (tenantAgent) => {
  const { didState } = await tenantAgent.dids.create({
    method: 'key',
    options: { createKey: { type: { kty: 'OKP', crv: 'Ed25519' } } },
  })
  return didState.did
})
// end-section-3
console.log(`Tenant ${tenantRecord.id} created ${did}`)

// start-section-4
const tenantAgent = await agent.modules.tenants.getTenantAgent({ tenantId: tenantRecord.id })
try {
  const createdDids = await tenantAgent.dids.getCreatedDids()
  console.log(`Tenant has ${createdDids.length} DID(s)`)
} finally {
  // Every session counts against the session limit until you end it
  await tenantAgent.endSession()
}
// end-section-4

// start-section-5
await agent.modules.tenants.updateTenantStatus(tenantRecord.id, TenantStatus.Inactive)

try {
  await agent.modules.tenants.withTenantAgent({ tenantId: tenantRecord.id }, async () => {})
} catch (error) {
  if (!(error instanceof TenantInactiveError)) throw error
  console.log(`Tenant ${error.tenantId} is inactive`)
}

// Admin tasks can still open a session for an inactive tenant
await agent.modules.tenants.withTenantAgent({ tenantId: tenantRecord.id, allowInactive: true }, async (tenantAgent) => {
  console.log(`Inactive tenant still has ${(await tenantAgent.dids.getCreatedDids()).length} DID(s)`)
})
// end-section-5

// start-section-6
await agent.modules.tenants.deleteTenantById(tenantRecord.id)
// end-section-6

await agent.shutdown()
