# Migrating from an Indy SDK Wallet to Aries Askar

This documentation explains the process of migrating your Indy SDK wallet to [Aries Askar](https://github.com/hyperledger/aries-askar).

:::danger

While the migration script technically works on node.js, it is strongly advised not to use it, yet. The migration of issuer records (such as Schemas and Credential Definitions) is not implemented yet. When a credential definition is detected it will revert the migration process and no harm is done.

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

Updating of credential definitions is not yet supported. This is why it is strongly advised not to run this script in a node.js environment.

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

### add the required dependencies

```sh
yarn add @hyperledger/aries-askar-react-native @credo-ts/indy-sdk-to-askar-migration react-native-fs
```

Below is the minimal code required for the migration to work. It is recommended to turn the logger on as it gives a lot of information regarding the migration.

:::caution

The agent is not allowed to be initialized to run this script. This makes sure nothing else happens during the migration.

:::

```typescript
import { agentDependencies } from '@credo-ts/react-native'
import { AskarModule } from '@credo-ts/askar'
import { IndySdkToAskarMigrationUpdater } from '@credo-ts/indy-sdk-to-askar-migration'
import { ariesAskar } from '@hyperledger/aries-askar-react-native'

const oldAgent = new Agent({
  config: {
    /* ... */
  },
  modules: {
    ariesAskar: new AskarModule({
      ariesAskar,
    }),
  },
  dependencies: agentDependencies,
})

const dbPath = '' // see section below

const updater = await IndySdkToAskarMigrationUpdater.initialize({ dbPath, agent })
await updater.update()
```

### Getting the database path

#### Android

On android, the database is commonly located under the `ExternalDirectoryPath`.

If you did not follow the default indy-sdk for React Native setup, your path might differ. Check out [step 5 of the Android setup for Indy SDK React Native](https://github.com/hyperledger/indy-sdk-react-native#5-load-indy-library) for the default behavior.

```typescript
import fs from 'react-native-fs'

const base = fs.ExternalDirectoryPath
const indyClient = '.indy_client'
const wallet = 'wallet'
const walletId = agent.config.walletConfig.id
const file = 'sqlite.db'

const dbPath = `${base}/${indyClient}/${wallet}/${walletId}/${file}`
```

#### iOS

On iOS, the database is commonly located under the `DocumentDirectoryPath`.

For iOS this can only change if your phone does not have the `HOME` environment variable set. This is not usual behavior, and if `HOME` is not set, the `base` in the code section below will be `/home/indy/Documents`.

```typescript
import fs from 'react-native-fs'

const base = fs.DocumentDirectoryPath
const indyClient = '.indy_client'
const wallet = 'wallet'
const walletId = agent.config.walletConfig.id
const file = 'sqlite.db'

const dbPath = `${base}/${indyClient}/${wallet}/${walletId}/${file}`
```
