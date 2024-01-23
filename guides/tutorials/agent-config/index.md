# Agent Config

The Aries agent provided by [Aries Framework
JavaScript](https://github.com/hyperledger/aries-framework-javascript) is very
extensible. These are all the configuration options with a short description:

## `label`\*

The label is seen by other users when creating a connection. This should not
be used as a base for authenticity, as it is entirely up to the user to
set this.

**Type**: `string`

```typescript title="example"
label: 'my-demo-agent'
```

---

## `walletConfig`

Configuration for the setup of the wallet. Including this in the agent
configuration makes it possible that, when initializing the agent, the wallet
will also be initialized. When an application requires the agent without an
initialized wallet for any reason, this can be omitted and later on the wallet
can be initialized separately.

**Type**: `WalletConfig`

```typescript title="example"
import { KeyDerivationMethod } from '@aries-framework/core'

walletConfig: {
  id: 'foo',
  key: 'testkey000000000000000000000',
  keyDerivationMethod: KeyDerivationMethod.Argon2IMod,
  storage: {
    type: 'postgres_storage',
    ... // depends on the storage type
  }
}
```

### `walletConfig.id`\*

Identifier string. Using another value here will open a new wallet.

**Type**: `string`

### `walletConfig.key`\*

Key to unlock the wallet with. This value MUST be kept as a secret and should
be seem like a password.

**Type**: `string`

### `walletConfig.keyDerivationMethod`

The method used for key derivation of the
[`walletConfig.key`](#walletconfigkey).

When using `KeyDerivationMethod.Raw`, it is strongly recommended to get the raw
key via
[`indy_generate_wallet_key`](https://github.com/hyperledger/indy-sdk/blob/1c7096dd95d0fd53881070f66907df4b9e61b874/libindy/src/api/wallet.rs#L560).
If you really must implement your own key generation, it is required to be a
base58-encoded
[ChaCha20-Poly1305](https://en.wikipedia.org/wiki/ChaCha20-Poly1305) key.

> For the advanced readers
> [here](https://www.password-hashing.net/argon2-specs.pdf) is the
> specification of Argon2.

**Type**: `enum KeyDerivationMethod`

**Default**: `KeyDerivationMethod.Argon2IMod`

**Members**:

**`KeyDerivationMethod.Argon2IMod`**

&nbsp;&nbsp;&nbsp; uses Argon2I modular (most secure option, but slower)

**`KeyDerivationMethod.Argon2Int`**

&nbsp;&nbsp;&nbsp; uses Argon2 integer (less secure, but faster)

**`KeyDerivationMethod.Raw`**

&nbsp;&nbsp;&nbsp; uses no derivation method.
It is recommended to use the
[`indy_generate_wallet_key`](https://github.com/hyperledger/indy-sdk/blob/1c7096dd95d0fd53881070f66907df4b9e61b874/libindy/src/api/wallet.rs#L560)
for key generation.

### `walletConfig.storage`

Specify which storage is being used for the wallet. The default is an SQLite
database, but a Postgres database could be used as well.

**Type**: `object`

**Default**: An SQLite database

---

## `endpoints`

A list of endpoints (schema + host + port) used for invitations and where other
agents might reach you. This could be used to host a website that would
redirect, for example with deep linking, to a wallet where the invitation can be
accepted.

**Type**: `string`

```typescript title="example"
endpoints: ['https://example.org:3000']
```

---

## `logger`

A logger instance that implements the `Logger` interface. This can be extremely
helpful for debugging. Credo exposes a `ConsoleLogger`
that can be used for simple logs. See [Logging](./logging) for more details on creating your own logger instance.

**Type**: `Logger`

```typescript title="example"
import { ConsoleLogger, LogLevel } from '@aries-framework/core'

logger: new ConsoleLogger(LogLevel.info)
```

---

## `didCommMimeType`

The mime-type used for sending and receiving messages. `application/jwe` and
`application/json` are used as fallback but are less desirable as they are
much more ambiguous in their specification.

**Type**: `enum DidCommMimeType`

**Default**: `DidCommMimeType.V1`

**Members**:

**`DidCommMimeType.V0`**

&nbsp;&nbsp;&nbsp; "application/ssi-agent-wire"

**`DidCommMimeType.V1`**

&nbsp;&nbsp;&nbsp; "application/didcomm-envelope-enc"

```typescript title="example"
import { DidCommMimeType } from '@aries-framework/core'

didCommMimeType: DidCommMimeType.V1
```

---

## `useDidSovPrefixWhereAllowed`

Whether to emit the legacy did:sov prefix `did:sov:BzCbsNYhMrjHiqZDTUASHg;spec` in the `@type` of messages for messages that allow it. A message can allow emitting the legacy prefix by setting the `allowDidSovPrefix` on the message class. This is the case for all core messages that have been defined before the [Migration to `https://didcomm.org` message type](https://github.com/hyperledger/aries-rfcs/blob/main/features/0348-transition-msg-type-to-https/README.md), to allow for the best possible interoperability with other agents.

**Type**: `boolean`

**Default**: `false`

```typescript title="example"
useDidSovPrefixWhereAllowed: true
```

---

## `useDidKeyInProtocols`

Whether to use `did:key` in protocols by default as defined in [RFC 0360: did:key Usage](https://github.com/hyperledger/aries-rfcs/blob/main/features/0360-use-did-key/README.md). Adopting this RFC can break interop with agents that haven't adopted this RFC yet. The framework does it best to automatically detect whether the other agent supports `did:key`, however in some cases we can't determine this. In those cases this parameter can be used to force the framework to use `did:key` or not.

**Type**: `boolean`

**Default**: `true`

```typescript title="example"
useDidKeyInProtocols: true
```

---

## `connectionImageUrl`

A URL to an image used so that other agents can display this. Like the
[`Label`](#label) this is completely up to the user to define
this. It MUST not be used got any base of authenticity.

**Type**: `string`

```typescript title="example"
connectionImageUrl: 'https://picsum.photos/200'
```

---

## `autoUpdateStorageOnStartup`

Whether the storage should automatically be updated when a newer version of
[Aries Framework
JavaScript](https://github.com/hyperledger/aries-framework-javascript) is used.

**Type**: `boolean`

**Default**: `false`

```typescript title="example"
autoUpdateStorageOnStartup: true
```

---
