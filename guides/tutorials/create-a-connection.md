# Create a connection

> This section assumes the following items:
>
> 1. A [valid environment](../getting-started/installation) for development
>
> 1. basic knowledge of the required fields in the [agent
>    config](./agent-config)

In this tutorial we will create a connection as _Acme Corp_ with _Bob_. We will
start with setting up both their agents with the minimal configuration required
to follow this tutorial. After the initialization we will then create an
invitation as _Acme Corp_ and send it over to _Bob_. _Bob_ will then accept
this invitation and at that point they have established a connection and they
know how to reach each other for sending a basic message, issuing a credential,
verifying a proof, etc.

### 1. Setting up the agents

First for both agents we must setup and initialize an agent to work with.
Depending on your target, [React
Native](../getting-started/installation/react-native) or
[Node.js](../getting-started/installation/react-native), it might vary.

In this tutorial _Bob_ will be in a [React Native
environment](../getting-started/installation/react-native) and _Acme Corp_ in
a [Node.js environment](../getting-started/installation/nodejs).

#### Bob

For bob we need to setup a basic agent with a wallet, mediator and outbound
transport.

:::bob

```typescript showLineNumbers create-a-connection.ts section-1

```

:::

#### Acme

For Acme we need to setup a basic agent with a wallet, inbound and outbound
transport.

:::acme

```typescript showLineNumbers create-a-connection.ts section-2

```

:::

#### 2. Creating an invitation

Now that we have setup both agents, we can create an invitation from _Acme Corp_.

<!-- tabs -->

# New

This method will create an invitation using the legacy method according to [0434: Out-of-Band Protocol 1.1](https://github.com/hyperledger/aries-rfcs/blob/main/features/0434-outofband/README.md).

:::acme

```typescript showLineNumbers create-a-connection.ts section-3
const outOfBandRecord = await agent.oob.createInvitation()

const serializedInvitation = outOfBandRecord.outOfBandInvitation.toUrl({ domain: 'https://example.org' })
```

:::

# Legacy

This method will create an invitation using the legacy method according to [0160: Connection Protocol](https://github.com/hyperledger/aries-rfcs/blob/main/features/0160-connection-protocol/README.md).

:::acme

```typescript showLineNumbers create-a-connection.ts section-4

```

:::

<!-- /tabs -->

### 3. Receiving the invitation

After we have created the invitation we have to transmit it to the other
agent. Common practise, when sending it to a holder, it to embed the url inside
a QR code. This QR code can then be scanned by the holder, in this case _Bob_.
After this, because both have set `autoAcceptConnections` to `true`, the
connection is established.

:::bob

```typescript create-a-connection.ts section-5

```

:::

### 4. (additional) listen to incoming connection responses

When you quickly want to use the event or the data of a response to a
connection request, you can start an [TODO: agent event
listener](https://example.org).

Another use case for this would be to get the `connectionRecord` of the
connection as it is only created when the invitation has been received by the
other agent. The `connectionRecord` is very essential in processes like [TODO:
issuing a credential](https://example.org) or [TODO: verifying a
proof](https://example.org).

The `connectionRecord` can also be retrieved with
`agent.connections.findAllByOutOfBandId(id)`, but with this method there is no
way of knowing if the invitation has been received.

:::acme

```typescript showLineNumbers create-a-connection.ts section-6

```

:::

### 5. Full code snippets

Below are both code snippets for each agent. These can be used as base but
should be editted to fit your use case. The
[`walletConfig.key`](./agent-config#walletconfigkey) must be changed as it can
lead to other people knowing your "password" to your wallet.

```typescript showLineNumbers create-a-connection.ts

```

### Useful resources

- [0160: Connection Protocol](https://github.com/hyperledger/aries-rfcs/blob/main/features/0160-connection-protocol/README.md)
- [0434: Out-of-Band Protocol 1.1](https://github.com/hyperledger/aries-rfcs/blob/main/features/0434-outofband/README.md)
