# Hedera Did Module

In this tutorial we will see how to use the Hedera modules in detail.

:::info

This section assumes that

1. You have [set-up your develoment environment](../../getting-started/index.md).
2. You have setup the Hedera module [setup hedera](../../getting-started/set-up/hedera/index.md)

:::

## DID Module

The Hedera DID module facilitates the Create, Read, Update, and Delete (CRUD) operations for `did:hedera` identifiers. To learn more about `did:hedera`, please refer to the [specification](https://github.com/hashgraph/did-method/blob/master/hedera-did-method-specification.md)

### Create DID

The DID can be created in two different ways

#### Parameters

```typescript showLineNumbers
{
  method: 'hedera'
  options?: {
    network?: HederaNetwork | string
  }
  secret?: {
    rootKeyId?: string
    keys?: DidDocumentKey[]
  },
  didDocument?: DidDocument
}
```

1. `method`: `hedera` - (required) DidMethod identifier
2. `options` - Target network for did document creation. Can be optional if used the single Hedera network, is required if plugin configured for using several networks. Can be equal "mainnet", "testnet", "previewnet", "local-node" or custom network name, defined when the Hedera module was [initialized](../../getting-started/set-up/hedera/index.md).
3. `secret` - (optional) A KMS keyset for using. Keys are required for signing Hedera transaction.
4. `didDocument` - (optional) Did document for initializing

##### Option 1

Provide a DID Document payload according to the w3c did core specification in the request body. This is possible when the keys corresponding to the verification methods provided in the DID Document are already created in the wallet

```typescript showLineNumbers set-up-hedera.ts section-2

```

##### Option 2

If a DID Document is not passed to the registrar, it requires the secret parameter with a verificationMethod to construct the DID Document.

```typescript showLineNumbers set-up-hedera.ts section-3

```

### Update DID

To update a DID Document, fetch the body of the DID Document you want to change from the DID Resolver, make the relevant updates and pass it as the parameter

#### Parameters

```typescript showLineNumbers
{
  did: string
  secret: {
    keys: DidDocumentKey[]
  }
  didDocumentOperation: DidDocumentOperation
  didDocument: DidDocument | Partial<DidDocument>
}
```

1. `did` - (required) Did identifier. Target Hedera network will be defined by `did` automatically.
2. `secret` - (required) A KMS keyset for using. Keys are required for signing Hedera transaction.
3. `didDocumentOperation` - Update did document action. Can be equal 'setDidDocument', 'addToDidDocument' or 'removeFromDidDocument'
4. `didDocument` - (required) Did document properties for applying to the changing document

#### Example

```typescript showLineNumbers set-up-hedera.ts section-4

```

### Deactivate DID

A DID can be deactivated, it can still be resolved

#### Parameters

```typescript showLineNumbers
{
  did: string
}
```

1. `did` - (required) Did identifier. Target Hedera network will be defined by `did` automatically.

#### Example

```typescript showLineNumbers set-up-hedera.ts section-5

```
