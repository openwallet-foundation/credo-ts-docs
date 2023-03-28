# Registering a schema and credential definition on an Hyperledger Indy ledger

In this tutorial we will register a schema and credential definition on an Hyperledger Indy ledger using [indy-vdr](https://github.com/hyperledger/indy-vdr).

:::info

This section assumes that

1. You have [set-up your develoment environment](../getting-started).
1. You have basic knowledge of the required fields in the [Agent Config](./agent-config)

:::

### 1. Setting up the agent

First, an agent must be setup with a wallet and an indy vdr module. For these code examples, we will use a Node.js environment.

:::issuer

```typescript showLineNumbers register-schema-and-cred-def.ts section-1

```

:::

### 2. Importing a DID (optional)

In order to register a schema and credential definition, a DID must be added to the agent first. This can be done by caling `agent.dids.create()`, but this does require an endorser DID to be present as the `submitterDid`. For this tutorial a DID will already be registered on the ledger, but it will be imported, whith the associated private key, to be used later when registering the schema and credential definition.

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

After everything is registered on a Hyperledger Indy ledger, we can use it to issue credentials. The next tutorial is all about issuing an AnonCreds credential with this setup.
