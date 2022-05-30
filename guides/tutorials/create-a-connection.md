# Create a connection

> This section assumes the following items:
>
> 1. A [valid environment](../getting-started/prerequisites) for development
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
Native](../getting-started/prerequisites/react-native) or
[Node.js](../getting-started/prerequisites/react-native), it might vary.

In this tutorial _Bob_ will be in a [React Native
environment](../getting-started/prerequisites/react-native) and _Acme Corp_ in
a [Node.js environment](../getting-started/prerequisites/nodejs).

#### Bob

For bob we need to setup a basic agent with a wallet, mediator and outbound
transport.

:::bob

```typescript showLineNumbers
import { Agent, InitConfig, HttpOutboundTransport, WsOutboundTransport } from "@aries-framework/core"
import { agentDependencies } from "@aries-framework/react-native"

const config: InitConfig = {
  label: "demo-agent-bob",
  walletConfig: {
    id: "main",
    key: "demoagentbob00000000000000000000",
  },
  mediatorConnectionsInvite: "https://didcomm.agent.community.animo.id?c_i=ey...(many bytes omitted)...Q==",
  autoAcceptConnections: true,
}

const agent = new Agent(config, agentDependencies)

agent.registerOutboundTransport(new WsOutboundTransport())
agent.registerOutboundTransport(new HttpOutboundTransport())

await agent.initialize()
```

:::

#### Acme

For bob we need to setup a basic agent with a wallet, inbound and outbound
transport.

:::acme

```typescript showLineNumbers
import { Agent, InitConfig, WsOutboundTransport, HttpInboundTransport } from "@aries-framework/core"
import { agentDependencies } from "@aries-framework/node"

const config: InitConfig = {
  label: "demo-agent-acme",
  walletConfig: {
    id: "main",
    key: "demoagentacme0000000000000000000",
  },
  autoAcceptConnections: true,
}

const agent = new Agent(config, agentDependencies)

agent.registerOutboundTransport(new WsOutboundTransport())
agent.registerOutboundTransport(new HttpOutboundTransport())
agent.registerInboundTransport(new HttpInboundTransport({ port: 3000 }))

await agent.initialize()
```

:::

#### 2. Creating an invitation

Now that we have setup both agents, we can create an invitation from _Acme Corp_.

<!-- tabs -->

# New

This method will create an invitation using the legacy method according to [0434: Out-of-Band Protocol 1.1](https://github.com/hyperledger/aries-rfcs/blob/main/features/0434-outofband/README.md).

:::acme

```typescript showLineNumbers
const outOfBandRecord = await agent.oob.createInvitation()

const serializedInvitation = outOfBandRecord.outOfBandInvitation.toUrl({ domain: "https://example.org" })
```

:::

# Legacy

This method will create an invitation using the legacy method according to [0160: Connection Protocol](https://github.com/hyperledger/aries-rfcs/blob/main/features/0160-connection-protocol/README.md).

:::acme

```typescript showLineNumbers
const { invitation } = await agent.oob.createLegacyInvitation()

const serializedInvitation = invitation.toUrl({ domain: "https://example.org" })
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

```typescript showLineNumbers
const { outOfBandRecord } = await agent.oob.receiveInvitationFromUrl(url)
```

:::

### 4. (additional) listen to incoming connection responses

When you quickly want to use the event or the data of a response to a
connection request, you can start an [TODO: agent event
listener](https://example.org).

:::acme

```typescript showLineNumbers
import { ConnectionEventTypes, ConnectionStateChangedEvent, DidExchangeState } from "@aries-framework/node"

agent.events.on<ConnectionStateChangedEvent>(ConnectionEventTypes.ConnectionStateChanged, ({ payload, type }) => {
  if (payload.connectionRecord.outOfBandId !== outOfBandRecord.id) return
  if (payload.connectionRecord.state === DidExchangeState.Completed) {
    // the connection is now ready for usage in other protocols!
    console.log(`Connection for out of band id ${outOfBandRecord.id} completed`)
  }
  // custom business logic
})
```

:::

### 5. Full code snippets

Below are both code snippets for each agent. These can be used as base but
should be editted to fit your use case. The
[`walletConfig.key`](./agent-config#walletconfigkey) must be changed as it can
lead to other people knowing your "password" to your wallet.

:::acme

```typescript showLineNumbers
import {
  Agent,
  InitConfig,
  ConnectionEventTypes,
  ConnectionStateChangedEvent,
  WsOutboundTransport,
  HttpInboundTransport,
  HttpOutboundTransport,
} from "@aries-framework/core"
import { agentDependencies } from "@aries-framework/node"

const run = async () => {
  // Simple agent configuration. This sets some basic fields like the wallet
  // configuration and the label.
  const config: InitConfig = {
    label: "demo-agent-acme",
    walletConfig: {
      id: "main",
      key: "demoagentacme0000000000000000000",
    },
    autoAcceptConnections: true,
  }

  // A new instance of an agent is created here
  const agent = new Agent(config, agentDependencies)

  // Register a simple `WebSocket` outbound transport
  agent.registerOutboundTransport(new WsOutboundTransport())

  // Register a simple `Http` outbound transport
  agent.registerOutboundTransport(new HttpOutboundTransport())

  // Register a simple `Http` inbound transport
  agent.registerInboundTransport(new HttpInboundTransport({ port: 3000 }))

  // Initialize the agent
  await agent.initialize()

  // Create an `out-of-band` invitation that we can send to another agent
  const outOfBandRecord = await agent.oob.createInvitation()

  // Start an optional event listener to see if a connection event has happened
  // with the specific `outOfBandId`.
  agent.events.on<ConnectionStateChangedEvent>(ConnectionEventTypes.ConnectionStateChanged, ({ payload, type }) => {
    if (payload.connectionRecord.outOfBandId !== outOfBandRecord.id) return
    if (payload.connectionRecord.state === DidExchangeState.Completed) {
      // the connection is now ready for usage in other protocols!
      console.log(`Connection for out of band id ${outOfBandRecord.id} completed`)
    }
    // custom business logic
  })

  // Serialize the invitation to a url so that we can easily transfer it over
  // HTTP or embed it in a QR code and scan it as another agent
  const serializedInvitation = outOfBandRecord.outOfBandInvitation.toUrl({ domain: "https://example.org" })

  // The last step will be a mocked function that creates a QR code from a
  // string, this is not handled by the Aries JavaScript Ecosystem, but a
  // third-party library should be used
  const QR = mockEmbedInQR(serializedInvitation)
}

void run()
```

:::

:::bob

```typescript showLineNumbers
import { Agent, InitConfig, WsOutboundTransport, HttpOutboundTransport } from "@aries-framework/core"
import { agentDependencies } from "@aries-framework/react-native"

const run = async () => {
  // Simple agent configuration. This sets some basic fields like the wallet
  // configuration and the label. It also sets the mediator invitation url,
  // because this is most likely required in a mobile environment.
  const config: InitConfig = {
    label: "demo-agent-bob",
    walletConfig: {
      id: "main",
      key: "demoagentbob00000000000000000000",
    },
    mediatorConnectionsInvite: "https://didcomm.agent.community.animo.id?c_i=ey...(many bytes omitted)...Q==",
    autoAcceptConnections: true,
  }

  // A new instance of an agent is created here
  const agent = new Agent(config, agentDependencies)

  // Register a simple `WebSocket` outbound transport
  agent.registerOutboundTransport(new WsOutboundTransport())

  // Register a simple `Http` outbound transport
  agent.registerOutboundTransport(new HttpOutboundTransport())

  // Initialize the agent
  await agent.initialize()

  // Here we mock the scanning of the QR code created by Acme Corp
  const url = mockScanQR()

  // With the url extracted from the QR code, the agent can accept it and this
  // will return an oobRecord and an optional connectionRecord
  const { oobRecord, connectionRecord } = await agent.receiveInvitationFromUrl(url)
}

void run()
```

:::
