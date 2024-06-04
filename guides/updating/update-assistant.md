# Update Assistant

The Update Assistant helps you update the storage objects from Credo to newer versions. This documents describes the different ways you can leverage the Update Assistant from fully managed to more manual approaches.

- [Update Strategies](#update-strategies)
  - [Manually instantiating the update assistant on agent startup](#manually-instantiating-the-update-assistant-on-agent-startup)
  - [Storing the agent storage version outside of the agent storage](#storing-the-agent-storage-version-outside-of-the-agent-storage)
  - [Automatically update on agent startup](#automatically-update-on-agent-startup)
- [Backups](#backups)
  - [Disabling backups](#disabling-backups)
- [Tenant Migration](#tenant-migration)
  - [Automatically update on tenant startup](#automatically-update-on-tenant-startup)
  - [Manually upgrading tenant storage](#manually-upgrading-tenant-storage)

## Update Strategies

There are three options on how to leverage the update assistant on agent startup:

- [Update Strategies](#update-strategies)
  - [Manually instantiating the update assistant on agent startup](#manually-instantiating-the-update-assistant-on-agent-startup)
  - [Storing the agent storage version outside of the agent storage](#storing-the-agent-storage-version-outside-of-the-agent-storage)
  - [Automatically update on agent startup](#automatically-update-on-agent-startup)
- [Backups](#backups)
  - [Disabling backups](#disabling-backups)
- [Tenant Migration](#tenant-migration)
  - [Automatically update on tenant startup](#automatically-update-on-tenant-startup)
  - [Manually upgrading tenant storage](#manually-upgrading-tenant-storage)

Note that the Update Assistant only supports updating the root wallet storage. If you are leveraging the tenants module, read [Tenant Migration](#tenant-migration) for more information on how to update storage for each tenant.

In addition, for all update methods you can configure whether a backup should be created before the update process starts. In the case the upgrade fails, the backup will be restored. In general we recommend to keep this option enabled (it is enabled by default), but there are a few important exceptions so make sure to read the section on [backups](#backups) carefully for more information.

### Manually instantiating the update assistant on agent startup

When the version of the storage is stored inside the agent storage, it means we need to check if the agent needs to be updated on every agent startup. We'll initialize the update assistant and check whether the storage is up to date. The advantage of this approach is that you don't have to store anything yourself, and have full control over the workflow.

```ts
import { UpdateAssistant, Agent } from '@credo-ts/core'

// or @credo-ts/node
import { agentDependencies } from '@credo-ts/react-native'

// First create the agent
const agent = new Agent({
  config,
  dependencies: agentDependencies,
})

// Then initialize the update assistant with the update config
const updateAssistant = new UpdateAssistant(agent, {
  v0_1ToV0_2: {
    mediationRoleUpdateStrategy: 'allMediator',
  },
})

// Initialize the update assistant so we can read the current storage version
// from the wallet. If you manually initialize the wallet you should do this _before_
// calling initialize on the update assistant
// await agent.wallet.initialize(walletConfig)
await updateAssistant.initialize()

// Check if the agent is up to date, if not call update
if (!(await updateAssistant.isUpToDate())) {
  await updateAssistant.update({
    // If you don't want to create a backup before the update process starts
    // (see )
    createBackupBeforeUpdate: false,
  })
}

// Once finished initialize the agent. You should do this on every launch of the agent
await agent.initialize()
```

### Storing the agent storage version outside of the agent storage

When the version of the storage is stored outside of the agent storage, you don't have to initialize the `UpdateAssistant` on every agent agent startup. You can just check if the storage version is up to date and instantiate the `UpdateAssistant` if not. The advantage of this approach is that you don't have to instantiate the `UpdateAssistant` on every agent startup, but this does mean that you have to store the storage version yourself.

When a wallet has been exported and later imported you don't always have the latest version available. If this is the case you can always rely on Method 1 or 2 for updating the wallet, and storing the version yourself afterwards. You can also get the current version by calling `await updateAssistant.getCurrentAgentStorageVersion()`. Do note the `UpdateAssistant` needs to be initialized before calling this method.

```ts
import { UpdateAssistant, Agent } from '@credo-ts/core'

// or @credo-ts/node
import { agentDependencies } from '@credo-ts/react-native'

// The storage version will normally be stored in e.g. persistent storage on a mobile device
let currentStorageVersion: VersionString = '0.1'

// First create the agent
const agent = new Agent({
  config,
  dependencies: agentDependencies,
})

// We only initialize the update assistant if our stored version is not equal
// to the frameworkStorageVersion of the UpdateAssistant. The advantage of this
// is that we don't have to initialize the UpdateAssistant to retrieve the current
// storage version.
if (currentStorageVersion !== UpdateAssistant.frameworkStorageVersion) {
  const updateAssistant = new UpdateAssistant(agent, {
    v0_1ToV0_2: {
      mediationRoleUpdateStrategy: 'recipientIfEndpoint',
    },
  })

  // Same as with the previous strategy, if you normally call agent.wallet.initialize() manually
  // you need to call this before calling updateAssistant.initialize()
  await updateAssistant.initialize()

  await updateAssistant.update()

  // Store the version so we can leverage it during the next agent startup and don't have
  // to initialize the update assistant again until a new version is released
  currentStorageVersion = UpdateAssistant.frameworkStorageVersion
}

// Once finished initialize the agent. You should do this on every launch of the agent
await agent.initialize()
```

### Automatically update on agent startup

This is by far the easiest way to update the agent, but has the least amount of flexibility and is not configurable. This means you will have to use the default update options to update the agent storage. You can find the default update config in the respective version migration guides (e.g. in [0.1-to-0.2](/guides/updating/versions/0.1-to-0.2.md)).

:::caution

If you're using the `autoUpdateStorageOnStartup` option and hosting multiple Credo instances that point to the same database, you need to make sure that they won't all try to update the storage on startup. Only one instance should try to update the storage, and thus in cases where multiple instances are hosted pointing to the same database, this approach is not recommended.

:::

```ts
import { UpdateAssistant, Agent } from '@credo-ts/core'

// or @credo-ts/node
import { agentDependencies } from '@credo-ts/react-native'

// First create the agent, setting the autoUpdateStorageOnStartup option to true
const agent = new Agent({
  config: {
    ...config,
    autoUpdateStorageOnStartup: true,
    createBackupBeforeStorageUpdate: true,
  },
  dependencies: agentDependencies,
})

// Then we call initialize, which under the hood will call the update assistant if the storage is not update to date.
await agent.initialize()
```

## Backups

Before starting the update, the update assistant will automatically create a backup of the wallet. If the migration succeeds the backup won't be used. If the backup fails, another backup will be made of the migrated wallet, after which the backup will be restored.

The backups can be found at the following locations. The `backupIdentifier` is generated at the start of the update process and generated based on the current timestamp.

- Backup path: `${agent.config.fileSystem.basePath}/afj/migration/backup/${backupIdentifier}`
- Migration backup: `${agent.config.fileSystem.basePath}/afj/migration/backup/${backupIdentifier}-error`

### Disabling backups

In general we recommend keeping backups before storage updates enabled. However, there are a few scenarios where you should disable backups in Credo before updating the storage:

- You are using Aries Askar with an SQLite database and multi-tenancy with `AskarMultiWalletDatabaseScheme.ProfilePerWallet` as the database scheme. Credo supports creating backups of SQLite databases, however as as each tenant is stored as a profile in the same database, if a backup is restored it will overwrite the storage of the whole database, and thus for all tenants. In future versions we will add support for more granular control of the backup.
- You are using Aries Askar with a Postgres database. We don't support creating backups for Postgres, and we advice you to create a backup of your database yourself before updating the storage.

## Tenant Migration

Migration of tenant storage is an additional process that needs to be performed when updating to a new breaking version of Credo. When you have migrated the storage of the root wallet, you can start up the agent and use it for the root wallet. But the tenant will still be using an older version of the storage.

:::info

Future versions of Credo are expected to work with the latest two major storage versions, writing using the latest format, but allowing to read also the previous storage format version. This allows to gradually upgrade your infrastructure to a new version, requiring as minimal downtime as possible.

:::

:::caution

If you're using an Aries Askar with an SQLite database while also leveraging multi-tenancy and using `AskarMultiWalletDatabaseScheme.ProfilePerWallet` as the database scheme, you need to make sure to disable `backupBeforeStorageUpdate` in the `updateOptions` when updating the storage of a tenant. See [Disabling backups](#disabling-backups) for more information.

:::

### Automatically update on tenant startup

The `autoUpdateStorageOnStartup` also works for tenants within an agent, meaning that you can automatically update the storage of a tenant when the tenant is first opened after the upgrade. Compared to the root wallet, which is updated when the agent starts, a tenant will be automatically upgraded when the tenant is first opened.

The same rules apply as with the auto updating of storage on startup, so make sure to read section on [Automatically update on agent startup](#automatically-update-on-agent-startup).

:::caution

If you're using a multi-instance setup with the same storage backend, you need to make sure that only one instance updates the storage of a tenant. This is tricky to do with auto updating, and therefore we recommend to use the manual approach.

:::

### Manually upgrading tenant storage

If you want to manually upgrade the storage of a tenant, you can use the `getTenantsWithOutdatedStorage` method to get a list of tenants that have outdated storage. Then you can use the `updateTenantStorage` method to update the storage of a tenant. This method will return a promise that resolves when the storage has been updated. If the storage is already up to date, the promise will resolve immediately. If an error occurs during the updating, an error will be thrown, just like if you would use the Update Assistant.

```ts
const outdatedTenantsAfterUpdate = await agent.modules.tenants.getTenantsWithOutdatedStorage()

for (const tenant of outdatedTenantsAfterUpdate) {
  await agent.modules.tenants.updateTenantStorage({
    tenantId: tenant.id,
    updateOptions: {
      // NOTE: if you're using Askar with SQLite and AskarMultiWalletDatabaseScheme.ProfilePerWallet, OR you use Postgres, you should disable backups
      // by credo and create them manually beforehand.
      createBackupBeforeUpdate: true,
    },
  })
}
```

You can use the manual approach to update the storage of a tenant, even while `autoUpdateStorageOnStartup` is enabled, but you need to make sure that the auto update won't be run for the tenant you are manually updating, so we recommend to disable `autoUpdateStorageOnStartup` when manually updating the storage of a tenant.

After you've upgraded the storage of a tenant, you can use the tenant as usual.
