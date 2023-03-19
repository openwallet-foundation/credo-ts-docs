# Migrate From an Indy-sdk wallet to Aries Askar

This documentation explains the process of migrating your Indy-sdk wallet to
[Aries Askar](https://github.com/hyperledger/aries-askar).

:::danger

While the migration script techinically works on node.js, it is strongly
advised not to use it, yet. The mean reason for this is that the Credential
Definition migration is not done yet. When a credential definition is detected
it will revert the migration process and no harm is done.

:::

:::caution

Postgres is not supported, yet.

:::

:::caution

The migration script is supported for 0.4.x (or moving from 0.3.x to 0.4.x).
Please refer to [Migrating from AFJ 0.3.x to 0.4.x](./versions/0.3-to-0.4.md)
to get to 0.4.x.

:::

## What does the migration do internally?

The migration script does the following to make sure everything is migrated
properly, and if anything goes wrong, it will revert back to a working state.

### Create a backup

Because undefined behaviour might occur, we create a backup in the new `tmp`
directory from Aries Framework JavaScript. if some error occurs, it will be
reverted back to the backed-up state and if no error occurs, it will delete the
backup from the temporary directory.

### Migrate the database to an Aries Askar structure

The Indy-sdk and Aries Askar have different database structures. So first of
all we need to change some table names, decrypt all the items with the old Indy
keys, encrypt the items with the new Aries Askar keys and store them inside the
new structure.

### Try to open the wallet in the new Aries Askar structure

When the wallet is correctly transformed, the wallet will be attempted to be
openend.

### Update the keys

Aries Askar has a specific way to store keys and every key, defined by the
category of `Indy::Key` will be migrated.

### Update the credential definitions

:::danger

Migration of credential definitions is not yet supported. This is why it is
strongly advised not to run this script in a node.js environment.

:::

### Update the link secret(s) (master secret)

The link sercets, identified by the category `Indy::MasterSecret`, are updated
next. They are stored inside a new `AnonCredsLinkSecretRecord`.

:::caution

Since we have to set a default link secret, some additional logic is added to
detect this. You can either supply a `defaultLinkSercetId` as a constructor
parameter or it will be based on your `walletId`.

If there is no Indy record with the `defaultLinkSecretId` or the `walletId`, an
error will be thrown and the migration will be restored.

:::

### Update the credentials

The credentials, identified by the category `Indy::Credential` are updated
last. They are stored in the new `AnonCredsCredentialRecord` as a one-to-one
copy. This means that they now support more tags and will make querying a lot
easier.

### All the other records

All the other records will be transferred without any updates as they are not
Indy specific.

## How to update

Updating does not require a lot of code, but must be done with caution.

### add the required dependencies:

```sh
yarn add @hyperledger/aries-askar-react-native @aries-framework/indy-sdk-to-askar-migration react-native-fs
```

Below is the minimal code required for the migration to work. It is recommended
to turn the logger on as it gives a lot of information regarding the migration.

:::caution

The agent is not allowed to be initialized to run this script. This makes sure
nothing else happens during the migration.

:::

```typescript
import { IndySdkToAskarMigrationUpdater } from '@hyperledger/indy-sdk-to-askar-migration'
import { agentDependencies } from '@aries-framework/react-native'
import { AskarModule } from '@aries-framework/askar'

const oldAgent = new Agent({
  config: {
    /* ... */
  },
  modules: {
    modules: { askar: new AskarModule() },
  },
  dependencies: agentDependencies,
})

const dbPath = '' // see section below

const updater = await IndySdkToAskarMigrationUpdater.initialize({ dbPath, agent })
await updater.update()
```

### Getting the database path

#### Android

On android, the database is located under the `ExternalDirectoryPath`.

```typescript
import fs from 'react-native-fs'

const base = fs.ExternalDirectoryPath
const indyClient = '.indy_client'
const wallet = 'wallet'
const walletId = agent.config.walletConfig.walletId
const file = 'sqlite.db'

const dbPath = `${base}/${indyClient}/${wallet}/${walletId}/${file}`
```

#### iOS

On android, the database is located under the `DocumentDirectoryPath`.

```typescript
import fs from 'react-native-fs'

const base = fs.DocumentDirectoryPath
const indyClient = '.indy_client'
const wallet = 'wallet'
const walletId = agent.config.walletConfig.walletId
const file = 'sqlite.db'

const dbPath = `${base}/${indyClient}/${wallet}/${walletId}/${file}`
```
