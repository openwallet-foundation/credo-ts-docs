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
label: "my-demo-agent"
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

### `walletConfig.keyDerviationMethod`

The method used for key derivation of the
[`walletConfig.key`](./agent-config#walletconfigkey).

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
database, but a Postgres database could be used as well. Please refer to [TODO:
storage ](https://example.org)

**Type**: `object`

**Default**: `a sqlite database`

---

## `endpoints`

A list of endpoints (schema + host + port) used for invitations and where other
agents might reach you. This could be used to host a website that would
redirect, for example with deep linking, to a wallet where the invitation can be
accepted.

**Type**: `string`

```typescript title="example"
endpoint: ["https://example.org:3000"]
```

---

## `publicDidSeed`

> Soon to be deprecated
>
> Reason for deprecation: this will be generalized

The seed used for initializing the public indy DID of the agent. This does not
register the DID on the ledger. This value MUST be 32 characters long.

**Type**: `string`

```typescript title="example"
publicDidSeed: "testseed000000000000000000000000"
```

---

## `indyLedgers`

An array of indy ledgers to connect to. The list can contain the following
object and it must include either the
[`genesisPath`](./agent-config.md#indyledgersgenesispath) or
[`genesisTransactions`](./agent-config#indyledgersgenesistransactions). It is
important to know that the first ledger in the list ledgers will be used for
registering the schema, credential definition, etc.

An example of the [`genesisTransactions`](./agent-config#indyledgersgenesistransactions) can be found
[here](https://raw.githubusercontent.com/Indicio-tech/indicio-network/main/genesis_files/domain_transactions_testnet_genesis).

**Type**: `IndyPoolConfig[]`

**Default**: `[]`

```typescript title="example"
indyLedgers: [
  {
    id: "indicio-test-net",
    isProduction: false,
    genesisPath: "./constants/indicio-test-net.txn",
    transactionAuthorAgreement: {
      version: "1",
      acceptanceMechanism: "EULA",
    },
  },
]
```

### `indyLedgers.id`\*

**Type**: `string`

Unique identifier of the ledger. This can be picked by the user as long as it
is unique.

### `indyLedgers.isProduction`\*

**Type**: `boolean`

Whether the ledger is a production ledger. This is used for the pick-up algorithm
as production ledgers have priority.

### `indyLedgers.genesisPath`

**Type**: `string`

Filesystem path of the genesis transaction. At this location, there will just be
a JSON object like the
[`indyLedgers.genesisTransaction`](./agent-config#indyledgersgenesistransactions).

### `indyLedgers.genesisTransactions`

**Type**: `string`

Stringified JSON object of the transaction.

### `indyLedgers.transactionAuthorAgreement`

**Type**: `TransactionAuthorAgreement`

JSON representation specifying the version and acceptance mechanism.

---

## `connectToIndyLedgerOnStartup`

Whether to connect to all the Indy ledgers on startup. This might lead to a
slightly lower startup, but will make the following ledger interactions
quicker.

**Type**: `boolean`

**Default**: `true`

```typescript title="example"
connectToIndyledgerOnStartup: false
```

---

## `logger`

A logger instance that implements the `Logger` interface. This can be extremely
helpful for debugging. Aries Framework JavaScript exposes a `ConsoleLogger`
that can be used for simple logs.

**Type**: `Logger`

```typescript title="example"
import { ConsoleLogger, LogLevel } from "@aries-framework/core"

logger: new ConsoleLogger(LogLevel.Test)
```

---

## `didCommMimeType`

The mime-type used for sending and receiving messages. `application/jwe` and
`application/json` are used as fallback but are less desirable as they are
much more ambiguous in their specification.

**Type**: `enum DidCommMimeType`

**Default**: `DidCommMimeType.v0`

**Members**:

**`DidCommMimeType.v0`**

&nbsp;&nbsp;&nbsp; "application/ssi-agent-wire"

**`DidCommMimeType.v1`**

&nbsp;&nbsp;&nbsp; "application/didcomm-envelope-enc"

```typescript title="example"
import { DidCommMimeType } from "@aries-framework/core"

didCommMimeType: DidCommMimeType.v0
```

---

## `autoAcceptCredentials`

Whether to auto-accept incoming credentials and with which strategy.
`AutoAcceptCredential.Always` SHOULD not be used in production. If your
application requires custom validation before automatically accepting a
credential, like accepting every credential from a specific DID, it can easily
build atop of it via the `agent events`, more information can be found [TODO:
agent events](https://example.org).

**Type**: `AutoAcceptCredential`

**Default**: `AutoAcceptCredential.Never`

**Members**:

**`AutoAcceptCredential.Never`**

&nbsp;&nbsp;&nbsp; Never auto-accept any incoming credential

**`AutoAcceptCredential.ContentApproved`**

&nbsp;&nbsp;&nbsp; Incoming credential needs one step of acceptance and the
content is not allowed to be changed in the following steps

**`AutoAcceptCredential.Always`**

&nbsp;&nbsp;&nbsp; Always auto-accept every incoming credential

```typescript title="example"
import { AutoAcceptCredential } from "@aries-framework/core"

autoAcceptCredentials: AutoAcceptCredential.ContentApproved
```

---

## `autoAcceptProofs`

Whether to auto-accept incoming proofs and with which strategy.
`AutoAcceptProof.Always` SHOULD not be used in production. If your
application requires custom validation before automatically accepting a
credential, like accepting every proof request from a specific DID, it can easily
build atop of it via the `agent events`, more information can be found [TODO:
agent events](https://example.org).

**Type**: `AutoAcceptProof`

**Default**: `AutoAcceptProof.Never`

**Members**:

**`AutoAcceptProof.Never`**

&nbsp;&nbsp;&nbsp; Never auto-accept any incoming proof

**`AutoAcceptProof.ContentApproved`**

&nbsp;&nbsp;&nbsp; Incoming proofs need one step of acceptance and the
content is not allowed to be changed in the following steps

**`AutoAcceptProofs.Always`**

&nbsp;&nbsp;&nbsp; Always auto-accept every incoming proof

```typescript title="example"
import { AutoAcceptProof } from "@aries-framework/core"

autoAcceptProofs: AutoAcceptProof.ContentApproved
```

---

## `autoAcceptMediationRequests`

As a mediator, whether to automatically accept mediation requests. If disabled,
the request should be manually accepted via the `mediatorModule`.

**Type**: `boolean`

**Default**: `false`

```typescript title="example"
autoAcceptMediationRequests: true
```

---

## `mediationConnectionsInvitation`

> This property collides with
> [`defaultMediatorId`](./agent-config#defaultmediatorid)
> and [`clearDefaultMediator`](./agent-config#cleardefaultmediator)

Connection invitation used for the default mediator. If specified, the agent
will create a connection, request mediation and store the mediator as the
default for all connections.

**Type**: `string`

```typescript title="example"
mediationConnectionInvite: "https://didcomm.agent.community.animo.id?c_i=ey....(many bytes omitted)...Q=="
```

---

## `defaultMediatorId`

> This property collides with
> [`mediatorConnectionsInvitation`](./agent-config#mediationconnectionsinvitation)
> and [`clearDefaultMediator`](./agent-config#cleardefaultmediator)

The mediator id used as the default mediator. This will override the default
mediator.

**Type**: `string`

```typescript title="example"
defaultMediatorId: "c475bd3e-4baf-40c4-b98b-3b6f131af5ee"
```

---

## `clearDefaultMediator`

> This property collides with
> [`mediatorConnectionsInvitation`](./agent-config#mediationconnectionsinvitation)
> and [`defaultMediatorId`](./agent-config#defaultmediatorid)

Whether to clear the default mediator.

**Type**: `boolean`

**Default**: `false`

```typescript title="example"
clearDefaultMediator: true
```

---

## `mediatorPollingInterval`

Set the default interval to poll the mediator in milliseconds.

**Type**: `number`

**Default**: `5000`

```typescript title="example"
mediatorPollingInterval: 10000
```

---

## `mediatorPickupStratery`

The pickup strategy to get the messages from the mediator. If none is specified
we will use
[`discover features](https://github.com/hyperledger/aries-rfcs/blob/main/features/0557-discover-features-v2/README.md)
to get the preferred strategy.

**Type**: `enum MediatorPickupStrategy`

**Default**: `infer the strategy with feature discovery of the mediator`

**Members**:

**`MediatorPickupStrategy.PickUpV1`**

&nbsp;&nbsp;&nbsp; explicitly pick up messages from the mediator according to
[RFC: 0212 Pickup
Protocol](https://github.com/hyperledger/aries-rfcs/blob/main/features/0212-pickup/README.md)

**`MediatorPickupStrategy.PickUpV2`**

&nbsp;&nbsp;&nbsp; Explicitly pick up messages from the mediator according to
[RFC: 0212 Pickup V2
Protocol](https://github.com/hyperledger/aries-rfcs/blob/main/features/0685-pickup-v2/README.md)

**`MediatorPickupStrategy.Implicit`**

&nbsp;&nbsp;&nbsp; Open a WebSocket with the mediator to implicitly receive
messages. (currently used by [aries cloud agent
python](https://github.com/hyperedger/aries-cloudagent-python))

```typescript title="example"
import { MediatorPickupStrategy } from "@aries-framework/core"

mediatorPickupStrategy: MediatorPickupStrategy.PickUpV2
```

---

## `maximumMessagePickup` (subject to change)

How many the mediator will give back in batches when using `MediatorPickupStrategy.PickUpV2`.

**Type**: `number`

**Default**: `10`

```typescript title="example"
maximumMessagePickup: 20
```

---

## `useLegacyDidSovPrefix`

Whether to use the legacy did:sov prefix `'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec`
or the new didComm prefix `https://didcomm.org`.

**Type**: `boolean`

**Defaul**: `false`

```typescript title="example"
useLegacyDidSovPrefix: true
```

---

## `connectionImageUrl`

A URL to an image used so that other agents can display this. Like the
[`Label`](./agent-config#label) this is completely up to the user to define
this. It MUST not be used got any base of authenticity.

**Type**: `string`

```typescript title="example"
connectionImageUrl: "https://picsum.photos/200"
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
