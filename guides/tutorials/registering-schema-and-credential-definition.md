# Registering a schema and credential definition on an AnonCreds Registry

In this tutorial we will register a schema and credential definition on an AnonCredsRegistry e.g. Hyperledger Indy ledger [indy-vdr](https://github.com/hyperledger/indy-vdr), [cheqd](https://github.com/hyperledger/aries-framework-javascript/packages/cheqd).

:::info

This section assumes that

1. You have [set-up your development environment](../getting-started).
1. You have basic knowledge of the required fields in the [Agent Config](./agent-config)

:::

### 1. Setting up the agent

First, an agent must be setup with a wallet and an indy-vdr or cheqd module. For these code examples, we will use a Node.js environment.

:::issuer

```typescript showLineNumbers register-schema-and-cred-def.ts section-1

```

:::

### 2. Importing a DID (optional)

:::info

There are many ledgers which can be used to register DIDs on for development.

#### Indy VDR

We recommend [bcovrin test net](http://test.bcovrin.vonx.io/). This network allows very easily to register a DID from a seed which can then be used as the `privateKey` in the snippet below. The seed is used as the private key for legacy compatibility with the Hyperledger Indy-SDK. The [genesis transactions](http://test.bcovrin.vonx.io/genesis) can also be retrieved for easy integration.

#### Cheqd

Follow the [cheqd setup](../getting-started//set-up/cheqd/index.md) and [cheqd DID module](./cheqd/index.md) to setup the network and create a DID. Cheqd supports a mainnet for production and a testnet for development purposes.

:::

In order to register a schema and credential definition, a DID must be added to the agent first. This can be done by calling `agent.dids.create()`, but this does require an endorser DID to be present as the `submitterDid`. For this tutorial a DID will already be registered on the ledger, but it will be imported, with the associated private key, to be used later when registering the schema and credential definition.

This section can be omitted if your agent already has a DID in its wallet.

:::issuer

```typescript showLineNumbers register-schema-and-cred-def.ts section-2

```

:::

### 3. Registering a schema

When you have a registered DID on a network and in your wallet, you can register a schema. Registering a schema requires four fields: `issuerId`, `name`, `version` and `attrNames`. It is important to note that the `issuerId` must be the same as a DID in your wallet.

:::issuer

```typescript showLineNumbers register-schema-and-cred-def.ts section-3

```

:::

### 3. Registering a credential definition

After registering a schema, a credential definition can be registered based on the schema. The credential definition, amongst more things, binds the schema to a specific issuer. Schemas can be reused between issuers, but a credential definition is specific to an issuer. In a credential definition revocation can also be specified. This section will not go in-depth about revocation.

:::issuer

```typescript showLineNumbers register-schema-and-cred-def.ts section-4

```

:::

### Using it

After everything is registered on a AnonCredsRegistry, we can use it to issue credentials. The next tutorial is all about issuing an AnonCreds credential with this setup.

### Useful Resources

- [Cheqd AnonCreds Specification](https://docs.cheqd.io/identity/guides/anoncreds)
