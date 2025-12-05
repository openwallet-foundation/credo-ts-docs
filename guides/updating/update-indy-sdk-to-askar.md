# Migrating from an Indy SDK Wallet to Aries Askar

This documentation explains the process of migrating your Indy SDK wallet to [Aries Askar](https://github.com/hyperledger/aries-askar).

:::danger

While the migration script technically works on Node.js, it is strongly advised not to use it, yet. The migration of issuer records (such as Schemas and Credential Definitions) is not implemented yet. When a credential definition is detected it will revert the migration process and no harm is done.

:::

:::caution

Postgres is not supported. If you are using postgres with Indy SDK and need to update to Aries Askar, please open an issue on [GitHub](https://github.com/openwallet-foundation/credo-ts).

:::

:::caution

The migration script is supported to run on 0.3.x before migrating from 0.3.x to 0.4.x. Please refer to [Migrating from Credo 0.3.x to 0.4.x](./versions/0.3-to-0.4.md) to get to 0.4.x afterwards.

It is important to note that this script must be ran before you update from 0.3.x to 0.4.x.

:::

## What does the migration do internally?

The migration script does the following to make sure everything is migrated properly, and if anything goes wrong, it will revert back to a working state.

### Create a backup

Because undefined behavior might occur, we create a backup in the new `tmp` directory from Credo. if some error occurs, it will be reverted back to the backed-up state and if no error occurs, it will delete the backup from the temporary directory.

### Migrate the database to an Aries Askar structure

The Indy-sdk and Aries Askar have different database structures. So first of all we need to change some table names, decrypt all the items with the old Indy keys, encrypt the items with the new Aries Askar keys and store them inside the new structure.

### Try to open the wallet in the new Aries Askar structure

When the wallet is correctly transformed, the wallet will be attempted to be opened.

### Update the keys

Aries Askar has a specific way to store keys and every key, defined by the category of `Indy::Key` will be migrated.

### Update the DIDs

:::caution

This update script does not transform did records. This is fine for something like `did:peer`, but will cause issues with `indy` and `sov` DIDs. For more information, please check out the [Migrating from Credo 0.3.x to 0.4.x](./versions/0.3-to-0.4.md#removal-of-publicdidseed-and-publicdid)

:::

### Update the credential definitions

:::danger

Updating of credential definitions is not yet supported. This is why it is strongly advised not to run this script in a Node.js environment.

:::

### Update the link secret(s) (master secret)

The link secrets, identified by the category `Indy::MasterSecret`, are updated next. They are stored inside a new `AnonCredsLinkSecretRecord`.

:::caution

Since we have to set a default link secret, some additional logic is added to detect this. You can either supply a `defaultLinkSercetId` as a constructor parameter or it will be based on your `walletId`.

If there is no Indy record with the `defaultLinkSecretId` or the `walletId`, an error will be thrown and the migration will be restored.

:::

### Update the credentials

The credentials, identified by the category `Indy::Credential` are updated last. They are stored in the new `AnonCredsCredentialRecord` as a one-to-one copy. This means that they now support more tags and will make querying a lot easier.

### All the other records

All the other records will be transferred without any updates as they are not Indy specific.

## How to update

Updating does not require a lot of code, but must be done with caution.

It is very important to note that the migration script only has to be run once. If it runs for a second time, it will error saying that the database is already migrated. Also, when the migration is finished, it is common practice to store this state in your persistent app storage. This script does not provide a way to detect if an update has happened, so storing this value will prevent the script from running every time. For more information regarding this topic, please check out [Update Assistant](./update-assistant.md#storing-the-agent-storage-version-outside-of-the-agent-storage).

### Migrate code to Aries Askar, Indy VDR, AnonCreds.

Since Credo 0.4, there have been three new packages introduced that replace Indy SDK: Aries Askar (secure storage and cryptography), Indy VDR (integration with Hyperledger Indy blockchain), and AnonCreds (AnonCreds credential format).

Before setting up the migration script for Aries Askar (the storage), it is advised to first update your code with the new dependencies, and test it in a fresh environment to make sure everything works as expected.

To update your code to use the new packages, remove the `@aries-framework/indy-sdk`, `indy-sdk`, `indy-sdk-react-native`, `@types/indy-sdk` and `@types/indy-sdk-react-native` packages from the dependencies of your project, and remove all related imports from your code.

Then, setup the required dependencies for Aries Askar, Indy VDR, and AnonCreds. It is not required to set up all dependencies. This guide focuses on migration the storage from Indy SDK to Aries Askar, so only the Aries Askar dependency is required.

To setup the new dependencies, follow the getting started guide for each package:

- [Aries Askar](../getting-started/set-up/aries-askar.md)
- [AnonCreds](../getting-started/set-up/anoncreds.md)
- [Indy VDR](../getting-started/set-up/indy-vdr.md)

Once this has been set-up, make sure all code works on a **fresh environment** before continuing with the migration script.

### Add the required dependencies

Once all the new dependencies have been configured for your platform, you can add the migration script to your project:

```sh
yarn add @credo-ts/indy-sdk-to-askar-migration@^0.5.3
```

Below is the minimal code required for the migration to work. It is recommended to turn the logger on as it gives a lot of information regarding the migration.

:::caution

The agent is not allowed to be initialized to run this script. This makes sure nothing else happens during the migration.

:::

```typescript
import { agentDependencies } from '@credo-ts/react-native' // or @credo-ts/node
import { AskarModule } from '@credo-ts/askar'
import { IndySdkToAskarMigrationUpdater } from '@credo-ts/indy-sdk-to-askar-migration'
import { ariesAskar } from '@hyperledger/aries-askar-react-native'

const oldAgent = new Agent({
  config: {
    /* ... */
  },
  modules: {
    // ... other modules (including optionally IndyVdrModule and AnonCredsModule)
    ariesAskar: new AskarModule({
      ariesAskar,
    }),
  },
  dependencies: agentDependencies,
})

// See section below for getting the database path
const dbPath = getMobileIndySdkDatabasePath(oldAgent.config.walletConfig.id)

const updater = await IndySdkToAskarMigrationUpdater.initialize({ dbPath, agent: oldAgent })
await updater.update()
```

### Getting the database path

#### React Native

On Android, the database is commonly located under the `ExternalDirectoryPath`. If you did not follow the default Indy SDK for React Native setup on Android, your path might differ. Check out [Indy SDK React Native Android Setup](https://github.com/hyperledger-archives/indy-sdk-react-native#5-load-indy-library) for the default behavior.

On iOS, the database is commonly located under the `DocumentDirectoryPath`. For iOS this can only change if your phone does not have the `HOME` environment variable set. This is not usual behavior, and if `HOME` is not set, the `base` in the code section below will be `/home/indy/Documents`.

To get the path to the database, you can use the following code, where `walletId` is the `walletConfig.id`.

```typescript
import { Platform } from 'react-native'
import fs from 'react-native-fs'

/**
 * Get the path to and Indy SDK SQlite wallet database on mobile.
 *
 * @note this assumes you are using the default configuration.
 * If you are not, you will need to adjust the path accordingly.
 */
function getMobileIndySdkDatabasePath(walletId: string) {
  const base = Platform.OS === 'android' ? fs.ExternalDirectoryPath : fs.DocumentDirectoryPath

  return `${base}/.indy_client/wallet/${walletId}/sqlite.db`
}
```

#### Node.js

Migration of data from Indy SDK to Aries Askar is not supported yet in Node.js. If you are using Node.js or Postgres and need to update to Aries Askar, please open an issue on [GitHub](https://github.com/openwallet-foundation/credo-ts).
