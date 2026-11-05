// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import { DrizzleStorageModule } from '@credo-ts/drizzle-storage'
import { openid4vcBundle } from '@credo-ts/drizzle-storage/openid4vc'
import { agentDependencies } from '@credo-ts/node'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import { drizzle } from 'drizzle-orm/node-postgres'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    storage: new DrizzleStorageModule({
      database: drizzle('postgresql://credo:credo-password@localhost:5432/credo'),
      // The core bundle is always included. Add one bundle per module that stores records.
      bundles: [openid4vcBundle],
    }),
    // Drizzle doesn't store keys: Askar provides the KMS, in its own Postgres database
    askar: new AskarModule({
      askar: NativeAskar,
      enableStorage: false,
      store: {
        id: 'credo-keys',
        key: 'my-agent-store-key',
        database: {
          type: 'postgres',
          config: { host: 'localhost:5432' },
          credentials: { account: 'credo', password: 'credo-password' },
        },
      },
    }),
    openid4vc: new OpenId4VcModule(),
  },
})

// Run the migrations first: the module doesn't create tables
await agent.initialize()
// end-section-1

await agent.shutdown()
