# Using PostgreSQL as Database in Node.js

By default the Indy SDK will use an SQLite database for storage. In mobile environments this is sufficient and allows us to keep storage local to the device, but in server environments we oftentimes want a more scalable storage solution. By leveraging the PostgreSQL plugin for Indy SDK we can use PostgreSQL as a storage solution instead of SQLite.

This document describes the installation process of the Postgres plugin for IndySDK and how you need to configure AFJ to use it.

## Installation of the Postgres Plugin

For installation of the Postgres plugin, please refer to the platform specific guides:

- [macOS](./macos.md)
- [Linux](./linux.md)
- [Windows](./windows.md)

## Using the Postgres Plugin in AFJ

```ts
import { Agent, InitConfig } from '@aries-framework/core'
import { agentDependencies, IndyPostgresStorageConfig, loadPostgresPlugin, WalletScheme } from '@aries-framework/node'

// IndyPostgresStorageConfig defines interface for the Postgres plugin configuration.
const storageConfig: IndyPostgresStorageConfig = {
  type: 'postgres_storage',
  config: {
    url: 'localhost:5432',
    wallet_scheme: WalletScheme.DatabasePerWallet,
  },
  credentials: {
    account: 'postgres',
    password: 'postgres',
    admin_account: 'postgres',
    admin_password: 'postgres',
  },
}

// load the postgres wallet plugin before agent initialization
loadPostgresPlugin(storageConfig.config, storageConfig.credentials)

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
})
```
