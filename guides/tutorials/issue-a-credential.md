# Issue a credential

Using [AnonCreds](https://anoncreds-wg.github.io/anoncreds-spec/) and the
[Issue Credential V2
Protocol](https://github.com/hyperledger/aries-rfcs/blob/main/features/0453-issue-credential-v2/README.md)
or the [Issue Credential V1
Protocol](https://github.com/hyperledger/aries-rfcs/blob/main/features/0036-issue-credential/README.md).

> This section assumes the following items:
>
> 1. A [valid environment](../getting-started/prerequisites) for development
>
> 1. Basic knowledge of the required fields in the [agent
>    config](./agent-config)
> 1. A [connection between the _Holder_ and _Issuer_](https://example.org)

In this tutorial we will issue a credential from the _issuer_ to a _holder_. We
will start with setting up both their agents with the minimal configuration
required to follow this tutorial. After the initialization we will then create
a schema , credential definition and a credential as the _issuer_ and send the
credential over to the _holder_. The _holder_ will then accept this credential
automatically stores it in their wallet.

### 1. Setting up the agents

First for both agents we must setup and initialize an agent to work with.
Depending on your target, [React
Native](../getting-started/prerequisites/react-native) or
[Node.js](../getting-started/prerequisites/react-native), it might vary.

In this tutorial the _Holder_ will be in a [React Native
environment](../getting-started/prerequisites/react-native) and the _Issuer_ in
a [Node.js environment](../getting-started/prerequisites/nodejs).

#### Holder

For the _Holder_ we need to setup a basic agent with a wallet, mediator,
outbound transport and a ledger.

:::holder

```typescript showLineNumbers
import {
  Agent,
  AutoAcceptCredential,
  InitConfig,
  HttpOutboundTransport,
  WsOutboundTransport,
} from "@aries-framework/core"
import { agentDependencies } from "@aries-framework/react-native"

const getGenesisTransaction = async (url: string) => {
  const response = await fetch(url)

  return await response.text()
}

const genesisTransactionsBCovrinTestNet = await getGenesisTransaction("http://test.bcovrin.vonx.io/genesis")

const config: InitConfig = {
  label: "demo-agent-holder",
  walletConfig: {
    id: "main",
    key: "demoagentholder00000000000000000",
  },
  indyLedgers: [
    {
      id: "bcovin-test-net",
      isProduction: false,
      genesisTransactions: genesisTransactionsBCovrinTestNet,
    },
  ],
  mediatorConnectionsInvite: "https://example.com?c_i=ey...(many bytes omitted)...Q==",
  autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
}

const agent = new Agent(config, agentDependencies)

agent.registerOutboundTransport(new WsOutboundTransport())
agent.registerOutboundTransport(new HttpOutboundTransport())

await agent.initialize()
```

:::

#### Issuer

For the _Issuer_ the setup is almost the same as the _Holder_. The difference
is, is that the _Issuer_ does not need a mediator but an
`HttpInboundTransport`.

It is very important for the issuer to have a public DID, for the binding with
a credential definition. For this demo we will use [BCovrin
Test](http://test.bcovrin.vonx.io). If you want to follow this tutorial, you
have to register a public DID [here](http://test.bcovrin.vonx.io) via the
`Wallet Seed` field (this must be the same as the seed inside the config).

:::issuer

```typescript showLineNumbers
import {
  Agent,
  AutoAcceptCredential,
  InitConfig,
  HttpInboundTransport,
  HttpOutboundTransport,
  WsOutboundTransport,
} from "@aries-framework/core"
import { agentDependencies } from "@aries-framework/node"
import fetch from "node-fetch"

const getGenesisTransaction = async (url: string) => {
  const response = await fetch(url)

  return await response.text()
}

const genesisTransactionsBCovrinTestNet = await getGenesisTransaction("http://test.bcovrin.vonx.io/genesis")

const config: InitConfig = {
  label: "demo-agent-issuer",
  walletConfig: {
    id: "main",
    key: "demoagentissuer00000000000000000",
  },
  publicDidSeed: "demoissuerdidseed00000000000000",
  indyLedgers: [
    {
      id: "bcovrin-test-net",
      isProduction: false,
      genesisTransactions: genesisTransactionsBCovrinTestNet,
    },
  ],
  autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
}

const agent = new Agent(config, agentDependencies)

agent.registerOutboundTransport(new WsOutboundTransport())
agent.registerOutboundTransport(new HttpOutboundTransport())
agent.registerInboundTransport(new HttpInboundTransport({ port: 3000 }))

await agent.initialize()
```

:::

### 2. Registering the schema and credential definition

When we want to issue a credential we must first create a blueprint, the
schema, of the credential and bind it to a specific issuer, the credential
definition. This binding makes sure that when you want to verify the
credential, you can request that it must be issued from a specific party.

:::issuer

```typescript showLineNumbers
const schema = await agent.ledger.registerSchema({
  name: "identity",
  version: "1.0",
  attributes: ["Name", "Date of birth"],
})

const credentialDefinition = await agent.ledger.registerCredentialDefinition({
  schema,
  supportRevocation: false,
  tag: "default",
})
```

:::

### 3. Listening for incoming credentials

:::holder

```typescript showLineNumbers
import { CredentialStateChangedEvent, CredentialEventTypes } from "@aries-framework/core"

agent.events.on<CredentialStateChangedEvent>(CredentialEventTypes.CredentialStateChanged, ({ payload, type }) => {
  switch (payload.credentialRecord.state) {
    case CredentialState.OfferReceived:
      // custom logic here
      agent.credentials.acceptOffer({ credentialRecordId: payload.credentialRecord.id })
  }
})
```

:::

### 4. Issuing a credential

Now that everything is setup on both sides, the _Issuer_ can now offer a
credential to the _Holder_.

> In this example we do not instantiate a connection and assume that there is
> one. Please refer to this guide [TODO: here](https://example.org) to get a
> connection and connectionId

<!-- tabs -->

# V1

:::issuer

```typescript showLineNumbers
import { CredentialProtocolVersion, CredentialPreviewAttribute } form '@aries-framework/core'

const credentialExchangeRecord = agent.credentials.offerCredential({
  connectionId,
  protocolVersion: CredentialProtocolVersion.V1,
  credentialFormats: {
    indy: {
      attributes: [
        new CredentialPreviewAttribute({
          name: "Name",
          value: "Jane Holder",
        }),
        new CredentialPreviewAttribute({
          name: "Date of birth",
          value: "10-08-1990",
        }),
      ],
    },
  },
})
```

:::

# V2

:::issuer

```typescript showLineNumbers
import { CredentialProtocolVersion, CredentialPreviewAttribute } form '@aries-framework/core'

const credentialExchangeRecord = agent.credentials.offerCredential({
  connectionId,
  protocolVersion: CredentialProtocolVersion.V2,
  credentialFormats: {
    indy: {
      attributes: [
        new CredentialPreviewAttribute({
          name: "Name",
          value: "Jane Holder",
        }),
        new CredentialPreviewAttribute({
          name: "Date of birth",
          value: "10-08-1990",
        }),
      ],
    },
  },
})
```

:::

<!-- /tabs -->

### 5. Full code snippets

Below are both code snippets for each agent. These can be used as base but
should be editted to fit your use case. The
[`walletConfig.key`](./agent-config#walletconfigkey) must be changed as it can
lead to other people knowing your "password" to your wallet.

:::holder

```typescript showLineNumbers
import {
  Agent,
  AutoAcceptCredential,
  CredentialStateChangedEvent,
  CredentialEventTypes,
  InitConfig,
  HttpOutboundTransport,
  WsOutboundTransport,
} from "@aries-framework/core"
import { agentDependencies } from "@aries-framework/react-native"

// Function to retrieve the genesis transactions from a url
const getGenesisTransaction = async (url: string) => {
  const response = await fetch(url)

  return await response.text()
}

// get the genesis transactions
const genesisTransactionsBCovrinTestNet = await getGenesisTransaction("http://test.bcovrin.vonx.io/genesis")

const run = async () => {
  // Simple agent configuration. This sets some basic fields like the wallet
  // configuration, label, a mediator and a test ledger.
  const config: InitConfig = {
    label: "demo-agent-holder",
    walletConfig: {
      id: "main",
      key: "demoagentholder00000000000000000",
    },
    indyLedgers: [
      {
        id: "bcovin-test-net",
        isProduction: false,
        genesisTransactions: genesisTransactionsBCovrinTestNet,
      },
    ],
    mediatorConnectionsInvite: "https://example.com?c_i=ey...(many bytes omitted)...Q==",
    autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
  }

  // A new instance of an agent is created here
  const agent = new Agent(config, agentDependencies)

  // Register a simple `WebSocket` outbound transport
  agent.registerOutboundTransport(new WsOutboundTransport())

  // Register a simple `HTTP` outbound transport
  agent.registerOutboundTransport(new HttpOutboundTransport())

  // Initialize the agent
  await agent.initialize()

  // Listen to credential events
  // The implementation here listens to every credential event and when an
  // offer comes in, the agent accepts it
  // It is very likely that you want the user to view the credential and accept
  // it based on user input
  // It is done like this for demo purposes
  agent.events.on<CredentialStateChangedEvent>(CredentialEventTypes.CredentialStateChanged, ({ payload }) => {
    switch (payload.credentialRecord.state) {
      // Handle the `OfferReceived` state
      case CredentialState.OfferReceived:
        // custom logic here
        // Accept the credential offer
        agent.credentials.acceptOffer({ credentialRecordId: payload.credentialRecord.id })
    }
  })
}

// Start the whole process
void run()
```

:::

<!-- tabs -->

# V1

:::issuer

```typescript showLineNumbers
import {
  Agent,
  AutoAcceptCredential,
  CredentialProtocolVersion,
  CredentialPreviewAttribute,
  InitConfig,
  HttpInboundTransport,
  HttpOutboundTransport,
  WsOutboundTransport,
} from "@aries-framework/core"
import { agentDependencies } from "@aries-framework/node"
import fetch from "node-fetch"

// Function to retrieve the genesis transactions from a url
const getGenesisTransaction = async (url: string) => {
  const response = await fetch(url)

  return await response.text()
}

// get the genesis transactions
const genesisTransactionsBCovrinTestNet = await getGenesisTransaction("http://test.bcovrin.vonx.io/genesis")

const run = async () => {
  // Simple agent configuration. This sets some basic fields like the wallet
  // configuration, label and a test ledger.
  const config: InitConfig = {
    label: "demo-agent-issuer",
    walletConfig: {
      id: "main",
      key: "demoagentissuer00000000000000000",
    },
    publicDidSeed: "demoissuerdidseed00000000000000",
    indyLedgers: [
      {
        id: "bcovrin-test-net",
        isProduction: false,
        genesisTransactions: genesisTransactionsBCovrinTestNet,
      },
    ],
    autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
  }

  // A new instance of an agent is created here
  const agent = new Agent(config, agentDependencies)

  // Register a simple `WebSocket` outbound transport
  agent.registerOutboundTransport(new WsOutboundTransport())

  // Register a simple `HTTP` outbound transport
  agent.registerOutboundTransport(new HttpOutboundTransport())

  // Register a simple `HTTP` inbound transport
  // This is a simple `express` app that listens on port `3000`
  // You can pass your own `express` app, with custom logic, in here as well
  // under the key `app`
  agent.registerInboundTransport(new HttpInboundTransport({ port: 3000 }))

  // Initialize the agent
  await agent.initialize()

  // Register a schema that is required as a blueprint for a credential offer
  const schema = await agent.ledger.registerSchema({
    name: "identity",
    version: "1.0",
    attributes: ["Name", "Date of birth"],
  })

  // Register the credential definition on the ledger, this is required as it
  // is a binding between the issuer and the schema
  const credentialDefinition = await agent.ledger.registerCredentialDefinition({
    schema,
    supportRevocation: false,
    tag: "default",
  })

  // Offer the credential to another agent via the connectionId
  // This connectionId is not provided here and must be supplied via, for
  // example, `agent.connections.getAll()`
  const credentialExchangeRecord = agent.credentials.offerCredential({
    connectionId,
    protocolVersion: CredentialProtocolVersion.V1,
    credentialFormats: {
      indy: {
        attributes: [
          new CredentialPreviewAttribute({
            name: "Name",
            value: "Jane Holder",
          }),
          new CredentialPreviewAttribute({
            name: "Date of birth",
            value: "10-08-1990",
          }),
        ],
      },
    },
  })
}

void run()
```

:::

# V2

:::issuer

```typescript showLineNumbers
import {
  Agent,
  AutoAcceptCredential,
  CredentialProtocolVersion,
  CredentialPreviewAttribute,
  InitConfig,
  HttpInboundTransport,
  HttpOutboundTransport,
  WsOutboundTransport,
} from "@aries-framework/core"
import { agentDependencies } from "@aries-framework/node"
import fetch from "node-fetch"

// Function to retrieve the genesis transactions from a url
const getGenesisTransaction = async (url: string) => {
  const response = await fetch(url)

  return await response.text()
}

// get the genesis transactions
const genesisTransactionsBCovrinTestNet = await getGenesisTransaction("http://test.bcovrin.vonx.io/genesis")

const run = async () => {
  // Simple agent configuration. This sets some basic fields like the wallet
  // configuration, label and a test ledger.
  const config: InitConfig = {
    label: "demo-agent-issuer",
    walletConfig: {
      id: "main",
      key: "demoagentissuer00000000000000000",
    },
    publicDidSeed: "demoissuerdidseed00000000000000",
    indyLedgers: [
      {
        id: "bcovrin-test-net",
        isProduction: false,
        genesisTransactions: genesisTransactionsBCovrinTestNet,
      },
    ],
    autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
  }

  // A new instance of an agent is created here
  const agent = new Agent(config, agentDependencies)

  // Register a simple `WebSocket` outbound transport
  agent.registerOutboundTransport(new WsOutboundTransport())

  // Register a simple `HTTP` outbound transport
  agent.registerOutboundTransport(new HttpOutboundTransport())

  // Register a simple `HTTP` inbound transport
  // This is a simple `express` app that listens on port `3000`
  // You can pass your own `express` app, with custom logic, in here as well
  // under the key `app`
  agent.registerInboundTransport(new HttpInboundTransport({ port: 3000 }))

  // Initialize the agent
  await agent.initialize()

  // Register a schema that is required as a blueprint for a credential offer
  const schema = await agent.ledger.registerSchema({
    name: "identity",
    version: "1.0",
    attributes: ["Name", "Date of birth"],
  })

  // Register the credential definition on the ledger, this is required as it
  // is a binding between the issuer and the schema
  const credentialDefinition = await agent.ledger.registerCredentialDefinition({
    schema,
    supportRevocation: false,
    tag: "default",
  })

  // Offer the credential to another agent via the connectionId
  // This connectionId is not provided here and must be supplied via, for
  // example, `agent.connections.getAll()`
  const credentialExchangeRecord = agent.credentials.offerCredential({
    connectionId,
    protocolVersion: CredentialProtocolVersion.V2,
    credentialFormats: {
      indy: {
        attributes: [
          new CredentialPreviewAttribute({
            name: "Name",
            value: "Jane Holder",
          }),
          new CredentialPreviewAttribute({
            name: "Date of birth",
            value: "10-08-1990",
          }),
        ],
      },
    },
  })
}

void run()
```

<!-- /tabs -->
