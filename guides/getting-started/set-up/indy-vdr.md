# Indy VDR

[Hyperledger Indy VDR](https://github.com/hyperledger/indy-vdr), Verifiable Data Registry, can be used to connect to one or more Indy Node ledger pools given sets of genesis transactions. Methods are provided to construct ledger requests and send them to the validators, collecting the results and ensuring that there is a consensus between the nodes. In the context of Credo, we mainly leverage it to register, and resolve, schemas, credential definitions and DIDs.

### Installing Indy VDR

When using Credo with Indy VDR, there are a few extra dependencies that need to be installed. We need to install the `@hyperledger/indy-vdr`, which contains all the functionality to register objects on an Hyperledger Indy VDR. Secondly, we need to add native bindings for the specific platform `@hyperledger/indy-vdr-<platform>`. Currently there are bindings for Node.JS, as `@hyperledger/indy-vdr-nodejs`, and React Native as `@hyperlegder/indy-vdr-react-native`.

<!--tabs-->

# Node.JS

```console
yarn add @credo-ts/indy-vdr@^0.5.0 @hyperledger/indy-vdr-nodejs@^0.2.0
```

# React Native

```console
yarn add @credo-ts/indy-vdr@^0.5.0 @hyperledger/indy-vdr-react-native@^0.2.0
```

<!--/tabs-->

### Adding Indy VDR to the agent

After installing the dependencies, we can register the Indy VDR module on the agent.

<!--tabs-->

# Node.JS

```typescript showLineNumbers set-up-indy-vdr.ts section-1

```

# React Native

```typescript showLineNumbers set-up-indy-vdr-rn.ts section-1

```

<!--/tabs-->

### Configuration

As you can see below, the Indy VDR module takes the native bindings and a list of networks. This list of networks will be used to resolve and register objects on.

```typescript typescript showLineNumbers set-up-indy-vdr-config.ts section-1

```

#### indyVdr

**Type**: `IndyVdr`

the `indyVdr` key takes a class that implements all the native bindings for Indy VDR. This can be imoprted from the `@hyperledger/indy-vdr-nodejs` package or the `@hyperledger/indy-vdr-react-native` package.

#### networks

**Type**: `IndyVdrPoolConfig[]`

An array of indy networks to connect to. The list can contain the following object and it must [`genesisTransactions`](#indyledgersgenesistransactions).

##### indyNamespace

**Type**: `string`

The Indy namespace aka the name identifying the name of the network connecting to. See also [indy did method identifiers](https://hyperledger.github.io/indy-did-method/#indy-did-method-identifiers)

##### `isProduction`

**Type**: `boolean`

Whether the ledger is a production ledger. This is used for detecting which ledger to use in case of unqualified identifiers as production ledgers have priority.

##### `genesisTransactions`

**Type**: `string`

Stringified JSON object of the transaction.

##### `connectOnStartup`

**Type**: `boolean`

Whether to connect to the ledger on startup. Defaults to `false`.

##### `transactionAuthorAgreement`

**Type**: `TransactionAuthorAgreement`

JSON representation specifying the version and acceptance mechanism. The version is the unique version of the transaction author agreement acceptance mechanism list (AML). The acceptance mechanism refers to the acceptance mechanism label of the item in the AML. For more details you may consult the [indy-node docs on AML](https://github.com/hyperledger/indy-node/blob/master/docs/source/transactions.md#transaction_author_agreement_aml)

##### `transactionAuthorAgreement.version`

**Type**: `string`

The version of the AML acceptance mechanism. This is a string representation of a version number e.g. '1' or '1.4'

##### `transactionAuthorAgreement.acceptanceMechanism`

**Type**: `string`

The acceptance mechanism to choose. This _must_ be _one_ of the available labels of the acceptance mechanisms key-value pairs in the AML e.g. 'EULA'.
