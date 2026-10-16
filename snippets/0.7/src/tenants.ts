// start-section-1
import { AskarModule, AskarMultiWalletDatabaseScheme } from '@credo-ts/askar'
import { Agent, CacheModule, InMemoryLruCache } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { TenantsModule } from '@credo-ts/tenants'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      store: { id: 'multi-tenant-agent', key: 'multi-tenant-agent-store-key' },
      // One Askar store with a profile per tenant
      multiWalletDatabaseScheme: AskarMultiWalletDatabaseScheme.ProfilePerWallet,
    }),
    tenants: new TenantsModule({ sessionLimit: 100, sessionAcquireTimeout: 5000 }),
    // The default cache throws as soon as a second agent context (a tenant) uses it
    cache: new CacheModule({ cache: new InMemoryLruCache({ limit: 5000 }) }),
  },
})

await agent.initialize()
// end-section-1

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

// start-section-6
await agent.modules.tenants.deleteTenantById(tenantRecord.id)
// end-section-6

await agent.shutdown()
