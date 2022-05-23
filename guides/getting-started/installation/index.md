# Setup

> This guide assumes you have followed the install guides from the previous
> section for your platform and a valid [Node.js](https://nodejs.org) or [React
> Native](https://reactnative.dev) project setup.

### Installing the required dependencies

First we have to install the minimal amount of dependencies that are required
for using the Aries Ecosystem.

<!--tabs-->

# Node.js

```console
yarn add @aries-framework/core @aries-framework/node express
```

# React Native

```console
yarn add @aries-framework/core @aries-framework/react-native react-native-fs react-native-get-random-values
```

<!--/tabs-->

### Additional setup

<!--tabs-->

# Node.js

no additional setup is required

# React Native

Since [React Native](https://reactnative.dev) does not have an implementation
for
[`crypto.getRandomValues()`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues)
we have to setup a polyfill for this. We have to do this at the entrypoint of
the application. This could is most likely `index.(js|ts|jsx|tsx)` at the root
of your application.

```diff title="index.tsx" showLineNumbers
+ import 'react-native-get-random-values'
```

<!--/tabs-->

### Setting up the agent

> this section does not assume any knowledge of the agent configuration.
> [Here](../../tutorials/agent-config) we will discuss in-depth what every
> field in the configuration does and when to set it.

In order to use the agent in the application we have to configure and
initialize it. This following configuration is quite generic and possibly not
enough for your specific use cases. Please refer to the
[tutorials](../../tutorials/index) for a more use-case-specific agent setup.

<!--tabs-->

# Node.js

```typescript showLineNumbers
import type { InitConfig } from "@aries-framework/core"
import { Agent } from "@aries-framework/core"
import { AgentDependencies } from "@aries-framework/node"

const config: InitConfig = {
  label: "docs-nodejs-agent",
  walletConfig: {
    id: "wallet-id",
    key: "testkey0000000000000000000000000",
  },
}

const agent = new Agent(config, AgentDependencies)
```

# React Native

```typescript showLineNumbers
import type { InitConfig } from "@aries-framework/core"
import { Agent } from "@aries-framework/core"
import { AgentDependencies } from "@aries-framework/react-native"

const config: InitConfig = {
  label: "docs-rn-agent",
  walletConfig: {
    id: "wallet-id",
    key: "testkey0000000000000000000000000",
  },
}

const agent = new Agent(config, AgentDependencies)
```

<!--/tabs-->

### Setting up the transports

After creating an `Agent` instance, we have to set an outbound transport that
will handle traffic from the agent. It is also possible to set an inbound
transport in the same way as the outbound transport, but it is built-in, so not
required.

<!--tabs-->

# Node.js

Sets up an HTTP outbound and inbound transport.

```typescript showLineNumbers
import { HttpOutboundTransport, WsOutboundTransport, HttpInboundTransport } from "@aries-framework/core"

agent.registerOutboundTransport(new HttpOuboundTransport())
agent.registerInboundtransport(new HttpInboundTransport({ port: 3000 }))
```

# React Native

For mobile agents the WebSocket transport is often required. We will go into
more depth about the reasons for this in the mediation section [TODO: mediator
section](https://example.org)

```typescript showLineNumbers
import { WsOutboundTransport } from "@aries-framework/core"

agent.registerOutboundTransport(new WsOutboundTransport())
```

<!--/tabs-->

### Initializing the agent

```typescript showLineNumbers
// ...

const agent = new Agent(config, AgentDependencies)

const initialize = async () => await agent.initialize().catch(console.error)
```

### Full code snippet

<!--tabs-->

# Node.js

```typescript showLineNumbers
import type { InitConfig } from "@aries-framework/core"
import { Agent } from "@aries-framework/core"
import { AgentDependencies } from "@aries-framework/node"
import express from "express"

// Simple express app required for the inbound transport
const app = express()

// The agent initialization configuration
const config: InitConfig = {
  label: "docs-nodejs-agent",
  walletConfig: {
    id: "wallet-id",
    key: "testkey0000000000000000000000000",
  },
}

// Creating an agent instance
const agent = new Agent(config, AgentDependencies)

// Registering the required in- and outbound transports
agent.registerOutboundTransport(new HttpOuboundTransport())
agent.registerInboundtransport(new HttpInboundTransport({ app, port: 3000 }))

// Function to initialize the agent
const initialize = async () => await agent.initialize().catch(console.error)
```

# React Native

```typescript showLineNumbers
import type { InitConfig } from "@aries-framework/core"
import { Agent, WsOutboundTransport } from "@aries-framework/core"
import { AgentDependencies } from "@aries-framework/react-native"

// The agent initialization configuration
const config: InitConfig = {
  label: "docs-rn-agent",
  walletConfig: {
    id: "wallet-id",
    key: "testkey0000000000000000000000000",
  },
}

// Creating an agent instance
const agent = new Agent(config, AgentDependencies)

// Registering the required outbound transport
agent.registerOutboundTransport(new WsOutboundTransport())

// Function to initialize the agent
const initialize = async () => await agent.initialize().catch(console.error)
```

<!--/tabs-->

### Useful resources

- [Hyperledger Aries RFC - 004:
  Agents](https://github.com/hyperledger/aries-rfcs/blob/main/concepts/0004-agents/README.md)
