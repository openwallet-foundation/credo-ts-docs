# Agent setup

To gain access to all the Aries JavaScript ecosystem's functionality, we have
to initialize an agent. The agent is highly configurable, and depending on your
use case, it might be different from the configuration as shown below. We will
use a very generic configuration that allows for the most features and will fit
most use cases.

### Prerequisites

1. A [NodeJS](https://nodejs.org/en/) environment, version 14.x.x or higher, or
   [React Native](https://reactnative.dev/docs/environment-setup)
2. [yarn](https://yarnpkg.com/getting-started/install)
   or npm (this tutorial will use yarn)

### Setting up your project

[Aries Framework JavaScript](https://todo.org) supports both NodeJS and React
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

At the top of the entry point of your application, add the following line:

```diff
+ import 'react-native-get-random-values'
```

#### Configuring the agent

Make sure to configure and initialize the agent at an early point of the
startup of your application.

An example of a very simple agent might look like this:

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

This configuration might be enough for some use cases, such as one-to-one messaging.
Below is another configuration that sets some sensible options for development:

```ts
import { Agent, AutoAcceptCredential, ConsoleLogger, InitConfig, LogLevel } from "@aries-framework/core"
import { agentDependencies } from "@aries-framework/react-native"

const agentConfig: InitConfig = {
  label: "My Agent",
  walletConfig: {
    id: "walletId",
    key: "testKey0000000000000000000000000",
  },
  autoAcceptConnections: true,
  autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
  autoAcceptProofs: AutoAcceptProof.ContentApproved,
  logger: new ConsoleLogger(LogLevel.info),
}

const agent = new Agent(agentConfig, agentDependencies)
```

These additions add logging, sensible auto acceptance of connections,
credentials and proofs.

> This configuration is not enough for a React Native environment. This is
> because a mediator is required. In the section [TODO: MEDIATOR SECTION] we
> will discuss this further.

#### Adding transports

After creating an `Agent` instance, we have to set an outbound transport that
will handle traffic from the agent. It is also possible to set an inbound
transport in the same way as the outbound transport, but it is built-in, so not
required.

```ts
import { HttpOutboundTransport, WsOutboundTransport, HttpInboundTransport } from "@aries-framework/core"

// A simple HTTP outbound transport
agent.registerOutboundTransport(new HttpOuboundTransport())

// For mobile agents the WebSocket transport is often required. We will go into
// more depth about the reasons for this in the mediation section [TODO:
// MEDIATION SECTION]
agent.registerOutboundTransport(new WsOutboundTransport())

// TODO: This should be split up with the tabs
// For NodeJS without a mediator
import express from "express"

const app = express()

agent.registerInboundtransport(new HttpInboundTransport({ app, port: 3000 }))
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

const run = async () => {
  // Set the default configuration
  const agentConfig: InitConfig = {
    label: "My Agent",
    walletConfig: {
      id: "walletId",
      key: "testKey0000000000000000000000000",
    },
    autoAcceptConnections: true,
    autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
    autoAcceptProofs: AutoAcceptProof.ContentApproved,
    logger: new ConsoleLogger(LogLevel.info),
  }

  // Create the agent instance
  const agent = new Agent(agentConfig, agentDependencies)

  // Register an outbound transport
  agent.registerOutboundTransport(new HttpOutboundTransport())

  // Initialize the agent with the specified configuration
  await agent.initialize().catch(console.error)
}
```

### Useful Resources

- [Hyperledger Aries RFC - 004:
  Agents](https://github.com/hyperledger/aries-rfcs/blob/main/concepts/0004-agents/README.md)
