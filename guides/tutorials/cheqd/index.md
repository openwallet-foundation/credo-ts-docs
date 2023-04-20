# Cheqd Did Module

In this tutorial we will see how to use the cheqd modules in detail

:::info

This section assumes that

1. You have [set-up your develoment environment](../../getting-started).
2. You have setup the cheqd module [setup cheqd](../../getting-started/set-up/cheqd/index.md)

:::

## DID Module

The cheqd DID module facilitates the Create, Read, Update, and Delete (CRUD) operations for did:cheqd identifiers. To learn more about "did:cheqd," please refer to the [specification](https://github.com/cheqd/identity-docs/blob/main/architecture/adr-list/adr-001-cheqd-did-method.md)

### Create DID

The DID can be created in two different ways

#### Parameters

1. `method`\*: `cheqd`
2. `secret`
3. `options`\*
4. `didDocument`

##### Option 1

Provide a DID Document payload according to the w3c did core specification in the request body. This is possible when the keys corresponding to the verification methods provided in the DID Document are already created in the wallet

```typescript showLineNumbers set-up-cheqd.ts section-2

```

##### Option 2

If a DID Document is not passed to the registrar, it requires the secret parameter with a verificationMethod to construct the DID Document.

```typescript showLineNumbers set-up-cheqd.ts section-3

```

### Update DID

To update a DID Document, fetch the body of the DID Document you want to change from the DID Resolver, make the relevant updates and pass it as the parameter

#### Parameters

1. `did`\*
2. `didDocument`\*: The updated DID Document
3. `options`
4. `secret`

```typescript showLineNumbers set-up-cheqd.ts section-4

```

### Deactivate DID

A DID can be deactivated, it can still be resolved

#### Parameters

1. `did`\*
2. `options`

```typescript showLineNumbers set-up-cheqd.ts section-5

```

### Types

---

#### `secret.verificationMethod`

**Type**: `verificationMethod`

##### `verificationMethod.id`\*

**Type**: `string`

##### `verificationMethod.type`\*

**Type**: `string`

**Default**: `Ed25519VerificationKey2020`

**Members**:

1. `Ed25519VerificationKey2020`
2. `Ed25519VerificationKey2018`
3. `JsonWebKey2020`

##### `verificationMethod.privateKey`

**Type**: `string`

---

#### `options.methodSpecificIdAlgo`

Specifies what type of method specific identifier is needed for your DID

**Type**: `string`

**Default**: `uuid`

**Members**:

1. `uuid`
2. `base58btc`

---

#### `options.network`\*

Specifies the cheqd network name to be published

**Type**: `string`

**Default**: `testnet`

**Members**:

1. `testnet`
2. `mainnet`

---

#### `options.versionId`

Specifies the version of the DID Document to be published

**Type**: `string`
