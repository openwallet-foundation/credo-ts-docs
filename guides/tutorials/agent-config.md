# Agent Config

temp file to keep the config, but not have it inside the `agent-setup` (we can
move this somewhere else, I just did not know where right now)

The Aries agent provided by [Aries Framework
JavaScript](https://github.com/hyperledger/aries-framework-javascript) is very
extensible. These are all the configuration options with a short description:

## `label`\*

The label as seen by other users when creating a connection

**Type**: `string`

```typescript title="example"
label: "my-demo-agent"
```

---

## `walletConfig`

configuration for the setup of the wallet. Including this

**Type**: `WalletConfig`

```typescript title="example"
import { KeyDerivationMethod } from '@aries-framework/core'

walletConfig: {
  id: 'foo',
  key: 'testkey000000000000000000000',
  keyDerivationMethod: KeyDerivationMethod.Argon2IMod
}
```

### `walletConfig.id`\*

Identifier string

**Type**: `string`

### `walletConfig.key`\*

Key to unlock the wallet with

**Type**: `string`

### `walletConfig.keyDerviationMethod`

The method used for key derivation of the [`walletConfig.key`](./agent-config#walletconfigkey)

**Type**: `enum KeyDerivationMethod`

**Default**: `KeyDerivationMethod.Argon2IMod`

**Members**:

**`KeyDerivationMethod.Argon2IMod`**

&nbsp;&nbsp;&nbsp; uses Argon2I modular (most secure option, but slower)

**`KeyDerivationMethod.Argon2Int`**

&nbsp;&nbsp;&nbsp; uses Argon2 integer (less secure, but faster)

**`KeyDerivationMethod.Raw`**

&nbsp;&nbsp;&nbsp; uses no derivation method (least secure, but the fastest).
It is recommended with this option to use your own derivation before

### `walletConfig.storage`

TODO

---

## `endpoint`

The endpoint (schema + host + port) used for invitations

**Type**: `string`

```typescript title="example"
endpoint: "https://example.org:3000"
```

---

## `publicDidSeed`

The seed used for initializing the public DID of the agent. This does not
register the DID on the ledger.

**Type**: `string`

```typescript title="example"
publicDidSeed: "testseed000000000000000000000000"
```

---

## `indyLedgers`

An array of indy ledgers to connect to. The list can contain the following
object (it must include either the
[`genesisPath`](./agent-config.md#indyledgersgenesispath) or
[`genesisTransactions`](./agent-config#indyledgersgenesistransactions) .

An example of a [`genesisTransactions`](./agent-config#indyledgersgenesistransactions) can be found
[here](https://raw.githubusercontent.com/Indicio-tech/indicio-network/main/genesis_files/domain_transactions_testnet_genesis).

**Type**: `IndyPoolConfig[]`

**Default**: `[]`

```typescript title="example"
indyLedgers: [
  {
    id: "indicio-test-net",
    isProduction: false,
    genesisPath: "./constants/indicio-test-net.txn",
  },
]
```

### `indyLedgers.id`\*

**Type**: `string`

Identifier of the ledger

### `indyLedgers.isProduction`\*

**Type**: `boolean`

Whether the ledger is a production ledger

### `indyLedgers.genesisPath`

**Type**: `string`

Filesystem path of the genesis transaction

### `indyLedgers.genesisTransactions`

**Type**: `string`

Stringified JSON object of the transaction

---

## `connectToIndyLedgerOnStartup`

Connect to the indy ledger on startup

**Type**: `boolean`
**Default**: `true`

```typescript title="example"
connectToIndyledgerOnStartup: false
```

---

## `logger`

A logger instance that implements the `Logger` interface.

**Type**: `Logger`

```typescript title="example"
import { ConsoleLogger, LogLevel } from '@aries-framework/core'

logger: new ConsoleLogger(LogLevel.Test),
```

---

## `didCommMimeType`

The mime-type used for sending and receiving messages.

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

Whether to auto accept incoming credentials and with which strategy

**Type**: `AutoAcceptCredential`

**Default**: `AutoAcceptCredential.Never`

**Members**:

**`AutoAcceptCredential.Never`**

&nbsp;&nbsp;&nbsp; Never auto accept any incoming credential

**`AutoAcceptCredential.ContentApproved`**

&nbsp;&nbsp;&nbsp; Incoming credential needs one step of acceptance and the
content is not allowed to be changed in the following steps

**`AutoAcceptCredential.Always`**

&nbsp;&nbsp;&nbsp; Always auto accept every incoming credential

---

## `autoAcceptProofs`

Whether to auto accept incoming proof and with which strategy

**Type**: `AutoAcceptProof`

**Default**: `AutoAcceptProof.Never`

**Members**:

**`AutoAcceptProof.Never`**

&nbsp;&nbsp;&nbsp; Never auto accept any incoming proof

**`AutoAcceptProof.ContentApproved`**

&nbsp;&nbsp;&nbsp; Incoming proofs needs one step of acceptance and the
content is not allowed to be changed in the following steps

**`AutoAcceptProofs.Always`**

&nbsp;&nbsp;&nbsp; Always auto accept every incoming proof

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

Connection invitation used for the default mediator. If specified, the agent
will; create a connection, request mediation and store the mediator as the
default for all connections.

**Type**: `string`

```typescript title="example"
mediationConnectionInvite: "https://didcomm.agent.community.animo.id?c_i=eyJAdHlwZSI6ICJkaWQ6c292OkJ6Q2JzTlloTXJqSGlxWkRUVUFTSGc7c3BlYy9jb25uZWN0aW9ucy8xLjAvaW52aXRhdGlvbiIsICJAaWQiOiAiYTEwYTYzNGEtNGEyNy00OTA3LWJlZGYtOWFiOTJiMTcwOTQ5IiwgInJlY2lwaWVudEtleXMiOiBbIjN5dVB6QmduNW95dmVpNUNvTWlHbnJVR3QzSjl5VW5VZlV1Y1ZITTZCOEV5Il0sICJzZXJ2aWNlRW5kcG9pbnQiOiAiaHR0cHM6Ly9kaWRjb21tLmFnZW50LmNvbW11bml0eS5hbmltby5pZCIsICJsYWJlbCI6ICJBbmltbyBDb21tdW5pdHkgQWdlbnQifQ=="
```

---

## `defaultMediatorId`

The mediator id used as the default mediator. This will override the default
mediator.

**Type**: `string`

```typescript title="example"
defaultMediatorId: "c475bd3e-4baf-40c4-b98b-3b6f131af5ee"
```

---

## `clearDefaultMediator`

Whether to clear the default mediator.

**Type**: `boolean`

**Default**: `false`

```typescript title="example"
clearDefaultMediator: true
```

---

## `mediatorPollingInterval`

Set the default interval to poll the mediator in miliseconds.

**Type**: `number`

**Default**: `5000`

```typescript title="example"
mediatorPollingInterval: 10000
```

---

## `mediatorPickupStratery`

The pickup strategy to get the messages form the mediator

**Type**: `enum MediatorPickupStrategy`

**Members**:

**`MediatorPickupStrategy.PickUpV1`**

&nbsp;&nbsp;&nbsp; TODO

**`MediatorPickupStrategy.PickUpV2`**

&nbsp;&nbsp;&nbsp; TODO

**`MediatorPickupStrategy.Implicit`**

&nbsp;&nbsp;&nbsp; TODO

**`MediatorPickupStrategy.Explicit`**

&nbsp;&nbsp;&nbsp; TODO

```typescript title="example"
import { MediatorPickupStrategy } from "@aries-framework/core"

mediatorPickupStrategy: MediatorPickupStrategy.PickUpV2
```

---

## `maximumMessagePickup`

TODO

**Type**: `number`

**Default**: `10`

```typescript title="example"
maximumMessagePickup: 20
```

---

## `useLegacyDidSovPrefix`

Whether to use the legacy did:sov prefix `'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec`
or the new didComm prefix`https://didcomm.org`.

**Type**: `boolean`

**Defaul**: `false`

```typescript title="example"
useLegacyDidSovPrefix: true
```

---

## `connectionImageUrl`

A url to an image used so that other agents can display this.

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
