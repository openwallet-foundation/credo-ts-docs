# Cheqd Did Module

In this tutorial we will see how to use the cheqd modules in detail

:::info

This section assumes that

1. You have [set-up your develoment environment](../../getting-started).
2. You have setup the cheqd module [Setup cheqd](../../getting-started/set-up/cheqd/index.md)

:::

### DID Module

The cheqd DID module facilitates the Create, Read, Update, and Delete (CRUD) operations for did:cheqd identifiers. To learn more about "did:cheqd," please refer to the [specification](https://github.com/cheqd/identity-docs/blob/main/architecture/adr-list/adr-001-cheqd-did-method.md)

## Create

The DID can be created in two different ways

## Option 1
A cheqd DID can be created by passing a complete DID Document. This is possible when the keys corresponding to the verification methods provided in the DID Document are already created in the wallet

```typescript showLineNumbers set-up-cheqd.ts section-2

```

## Option 2
If a DID Document is not passed to the registrar, it expects secret and options parameters to create keys and DID Document automatically.

---

### `secret.verificationMethod`

**Type**: `verificationMethod`

#### `verificationMethod.id`

**Type**: `string`

#### `verificationMethod.type`\*

**Type**: `string`

**Default**: `Ed25519VerificationKey2020`

**Members**:

1. `Ed25519VerificationKey2020`
2. `Ed25519VerificationKey2018`
3. `JsonWebKey2020`

---

### `options.methodSpecifiIdAlgo`

Specifies what type of method specific identifier is needed for your DID

**Type**: `string`

**Default**: `uuid`

**Members**:

1. `uuid`
2. `base58btc`

---

### `options.network`

Specifies the cheqd network name to be published

**Type**: `string`

**Default**: `testnet`

**Members**:

1. `testnet`
2. `mainnet`

---

```typescript showLineNumbers set-up-cheqd.ts section-3

```