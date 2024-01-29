// start-section-1
import { Agent, InitConfig } from '@aries-framework/core'
import { IndySdkModule } from '@aries-framework/indy-sdk'
import {
  agentDependencies,
  IndySdkPostgresStorageConfig,
  loadIndySdkPostgresPlugin,
  IndySdkPostgresWalletScheme,
} from '@aries-framework/node'
import indySdk from 'indy-sdk'

// IndySdkPostgresStorageConfig defines interface for the Postgres plugin configuration.
const storageConfig = {
  type: 'postgres_storage',
  config: {
    url: 'localhost:5432',
    wallet_scheme: IndySdkPostgresWalletScheme.DatabasePerWallet,
  },
  credentials: {
    account: 'postgres',
    password: 'postgres',
    admin_account: 'postgres',
    admin_password: 'postgres',
  },
} satisfies IndySdkPostgresStorageConfig

// load the postgres wallet plugin before agent initialization
loadIndySdkPostgresPlugin(storageConfig.config, storageConfig.credentials)

const agentConfig: InitConfig = {
  label: 'My Agent',
  // walletConfig.id and walletConfig.key are still required
  walletConfig: {
    id: 'walletId',
    key: 'testKey0000000000000000000000000',
    // storage is added and defines the postgres plugin configuration
    storage: storageConfig,
  },
}

const agent = new Agent({
  config: agentConfig,
  dependencies: agentDependencies,
  modules: {
    indySdk: new IndySdkModule({
      indySdk,
    }),
  },
})
// end-section-1
