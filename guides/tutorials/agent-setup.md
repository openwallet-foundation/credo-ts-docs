# Agent setup

In order to gain access to all the functionality that the Aries JavaScript
ecosystem offer, we have to initialize an agent. The agent is highly
configurable and depending on your use case, it might be different from the
configuration as shown below. We will use a very generic configuration that
allows for the most features and will fit most use cases.

### Prerequisites

1. A [NodeJS](https://nodejs.org/en/) environment, version 14.x.x or higher, or
   [React Native](https://reactnative.dev/docs/environment-setup)
2. [yarn](https://yarnpkg.com/getting-started/install)
   or npm (this tutorial will use yarn)

### Setting up your project

[Aries Framework JavaScript](https://todo.org) supports both a NodeJS and React
Native. This tutorial will assume a React Native environment, but commented
code is added for NodeJS.

#### Installing the dependencies

Execute the following commands inside your project to add the required
dependencies:

```bash
yarn add @aries-framework/core @aries-framework/react-native react-native-fs react-native-get-random-values

# node
# yarn add @aries-framework/core @aries-framework/node
```

At the top of your `index.js` add the following line:

```diff title="index.js"
+ import 'react-native-get-random-values'
```

#### Configuring the agent

Make sure to configure and initialize agent at an early point of the startup of
your application.

The Aries agent provided by [Aries Framework
JavaScript](https://github.com/hyperledger/aries-framework-javascript) is very
extensible. These are all the configuration options with a short description
(**bold** is required):

- **`label`**: The label as seen by other users when creating a connection
- `walletConfig`: configuration for the setup of the wallet. Including this makes
  sure the wallet is initialized when initializing the agent.
  - **`id`**: identifier string
  - **`key`**: TODO
  - `keyDerivationMethod`: What method to use for wallet key derivation
    - `KeyDerivationMethod.Argon2IMod`: Uses the argon2i modular
    - `KeyDerivationMethod.Argon2Int`: Uses argon2i int, less secure but faster
    - `KeyDerivationMethod.Raw`: Skip the derivation
  - `storage`: TODO
    - `type`: storage type
    - TODO: what is [key: string]: unknown here
- `endpoint`: The endpoint (schema + host + port) used for invitations
- `publicDidSeed`: The seed used for initializing the public DID of the agent.
  This does not register the DID on the ledger.
- `indyLedgers`: An array of indy ledgers to connect to. The list can contain
  the following object (it must include either the `genesisPath` or
  `genesisTransaction`):
  - **`id`**: identifier of the ledger
  - **`isProduction`**: Whether the ledger is a production ledger
  - `genesisPath`: filesystem path of the genesis transaction
  - `genesisTransaction`: stringified JSON object of the transaction
- `logger`: A logger instance that implements the `Logger` interface
- `didCommMimeType`: The mime-type used for sending and receiving messages
  - `DidCommMimeType.v0`: "application/ssi-agent-wire"
  - `DidCommMimeType.v1`: "application/didcomm-envelope-enc"
- `autoAcceptMediationRequests`: As a mediator, whether to automatically
  accept mediation requests. If disabled, the request should be manually
  accepted via the `mediatorModule`
- `mediationConnectionsInvitation`: Connection invitation used for the default
  mediator. If specified, the agent will; create a connection, request
  mediation and store the mediator as the default for all connections.
- `defaultMediatorId`: The mediator id used as the default mediator. This will
  override the default mediator.
- `clearDefaultMediator`: Whether to clear the default mediator
- `autoAcceptConnections`: Whether to auto accept connections
- `autoAcceptCredentials`: Whether to accept the incoming credentials
  - `AutoAcceptCredential.always`: Always auto accept the credential no matter
    the changes during the entire flow
  - `AutoAcceptCredential.contentApproved`: If no content changes one manual
    step is required, the rest is automated
  - `AutoAcceptCredential.Never`: Never auto accept a credential
- `autoAcceptProofs`: Whether to auto accept all incoming proof requests:
  - `AutoAcceptProof.always`: Always auto accept the proof requqest or proposal
    no matter the changes during the entire flow
  - `AutoAcceptProof.contentApproved`: If no content changes one manual
    step is required, the rest is automated
  - `AutoAcceptProof.Never`: Never auto accept a proof request of proposal

This can be quite daunting at first, but for most of these options, the default
what you want. An example of a very simple agent might look like this:

```ts
import { Agent, InitConfig } from "@aries-framework/core"
import { agentDependencies } from "@aries-framework/react-native"

const agentConfig: InitConfig = {
  label: "My Agent",
  walletConfig: {
    id: "walletId",
    key: "testKey0000000000000000000000000",
  },
}

const agent = new Agent(agentConfig, agentDependencies)
```

This might be enough already for some use cases, such as one-to-one messaging.
Below is another configuration that sets some sensible options for development:

```ts
import { Agent, AutoAcceptCredential, ConsoleLogger, InitConfig, LogLevel } from "@aries-framework/core"
import { agentDependencies } from "@aries-framework/react-native"
import { MEDIATOR_INVITE_URL, BCOVRIN_TEST_GENESIS } from "./constants"

const agentConfig: InitConfig = {
  label: "My Agent",
  mediatorConnectionsInvite: MEDIATOR_INVITE_URL,
  walletConfig: {
    id: "walletId",
    key: "testKey0000000000000000000000000",
  },
  autoAcceptConnections: true,
  autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
  autoAcceptProofs: AutoAcceptProof.ContentApproved,
  indyLedgers: [
    {
      id: "BCovrin Test",
      genesisTransactions: BCOVRIN_TEST_GENESIS,
      isProduction: false,
    },
  ],
  logger: new ConsoleLogger(LogLevel.info),
}

const agent = new Agent(agentConfig, agentDependencies)
```

These additions add logging, sensible auto acceptance of connections,
credentials and proofs and a test ledger.

#### Adding transports

After creating an `Agent` instance, we have to set an outbound transport that
will handle traffic from the agent. It is also possible to set an inbound
transport in the same way as the outbound transport, but it is built-in, so not
required.

```ts
import { HttpOutboundTransport } from "@aries-framework/core"

agent.registerOutboundTransport(new HttpOuboundTransport())
```

#### Initializing the agent

```ts
await agent.intialize().catch(console.error)
```

When the agent is successfully initialized, and depending on the config, you
have access to all the functionality.

#### Full code snippet

```ts title="e.g. App.tsx"
import {
  Agent,
  AutoAcceptCredential,
  AutoAcceptProof,
  ConsoleLogger,
  InitConfig,
  LogLevel,
  HttpOutboundTransport,
} from "@aries-framework/core"
import { agentDependencies } from "@aries-framework/react-native"
import { MEDIATOR_INVITE_URL, BCOVRIN_TEST_GENESIS } from "./constants"

// Set the default configuration
const agentConfig: InitConfig = {
  label: "My Agent",
  mediatorConnectionsInvite: MEDIATOR_INVITE_URL,
  walletConfig: {
    id: "walletId",
    key: "testKey0000000000000000000000000",
  },
  autoAcceptConnections: true,
  autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
  autoAcceptProofs: AutoAcceptProof.ContentApproved,
  indyLedgers: [
    {
      id: "BCovrin Test",
      genesisTransactions: BCOVRIN_TEST_GENESIS,
      isProduction: false,
    },
  ],
  logger: new ConsoleLogger(LogLevel.info),
}

// Create the agent instance
const agent = new Agent(agentConfig, agentDependencies)

// Register an outbound transport
agent.registerOutboundTransport(new HttpOutboundTransport())

// Initialize the agent with the specified configuration
await agent.initialize().catch(console.error)
```

### Useful Resources

- [Hyperledger Aries RFC - 004:
  Agents](https://github.com/hyperledger/aries-rfcs/blob/main/concepts/0004-agents/README.md)
