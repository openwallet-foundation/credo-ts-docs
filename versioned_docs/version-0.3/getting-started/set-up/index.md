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
yarn add @aries-framework/core@^0.3.0 @aries-framework/node@^0.3.0
```

# React Native

```console
yarn add @aries-framework/core@^0.3.0 @aries-framework/react-native@^0.3.0 react-native-fs react-native-get-random-values indy-sdk-react-native@^0.3.1
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

In addition you need add support for resolving modules with the `.cjs` extension, as this is used by some of AFJ's dependencies and not automatically supported by React Native.

```js title="metro.config.js" showLineNumbers
module.exports = {
  // ... other Metro config options ...
  resolver: {
    // make sure this includes `cjs` (and other extensions you need)
    sourceExts: ['js', 'json', 'ts', 'tsx', 'cjs'],
  },
}
```

Finally, if you're using [Expo](https://expo.dev) you need to add a custom resolution 'hack' that removes support for the legacy unimodules.

**Yarn**

For yarn we can replace the `@unimodules/react-native-adapter` and `@unimodules/core` dependencies with an empty directory. Make sure to create the `noop` directory in the root of your project and create a `.gitkeep` file in the directory so that the directory is committed to your repository.

```json title="package.json" showLineNumbers
{
  // ... other package.json options ...
  "resolutions": {
    "@unimodules/react-native-adapter": "./noop",
    "@unimodules/core": "./noop"
  }
}
```

**NPM**

Not supported at the moment. NPM overrides work different than Yarn resolutions, and thus we can't use the same trick. If you're using NPM, feel free to open a PR with a working solution.

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
import type { InitConfig } from '@aries-framework/core'
import { Agent } from '@aries-framework/core'
import { agentDependencies } from '@aries-framework/node'

const config: InitConfig = {
  label: 'docs-nodejs-agent',
  walletConfig: {
    id: 'wallet-id',
    key: 'testkey0000000000000000000000000',
  },
}

const agent = new Agent({
  config,
  dependencies: agentDependencies,
})
```

# React Native

```typescript showLineNumbers
import type { InitConfig } from '@aries-framework/core'
import { Agent } from '@aries-framework/core'
import { agentDependencies } from '@aries-framework/react-native'

const config: InitConfig = {
  label: 'docs-rn-agent',
  walletConfig: {
    id: 'wallet-id',
    key: 'testkey0000000000000000000000000',
  },
}

const agent = new Agent({
  config,
  dependencies: agentDependencies,
})
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
import { HttpOutboundTransport, WsOutboundTransport } from '@aries-framework/core'
import { HttpInboundTransport } from '@aries-framework/node'

agent.registerOutboundTransport(new HttpOutboundTransport())
agent.registerInboundTransport(new HttpInboundTransport({ port: 3000 }))
```

# React Native

For mobile agents the WebSocket transport is often required. We will go into
more depth about the reasons for this in the mediation section [TODO: mediator
section](https://example.org)

```typescript showLineNumbers
import { WsOutboundTransport, HttpOutboundTransport } from '@aries-framework/core'

agent.registerOutboundTransport(new WsOutboundTransport())
agent.registerOutboundTransport(new HttpOutboundTransport())
```

<!--/tabs-->

### Initializing the agent

```typescript showLineNumbers
// ...

const agent = new Agent({
  config,
  dependencies: agentDependencies,
})

const initialize = async () => await agent.initialize().catch(console.error)
```

### Full code snippet

<!--tabs-->

# Node.js

```typescript showLineNumbers
import type { InitConfig } from '@aries-framework/core'
import { Agent, HttpOutboundTransport } from '@aries-framework/core'
import { agentDependencies, HttpInboundTransport } from '@aries-framework/node'

// The agent initialization configuration
const config: InitConfig = {
  label: 'docs-nodejs-agent',
  walletConfig: {
    id: 'wallet-id',
    key: 'testkey0000000000000000000000000',
  },
}

// Creating an agent instance
const agent = new Agent({
  config,
  dependencies: agentDependencies,
})

// Registering the required in- and outbound transports
agent.registerOutboundTransport(new HttpOutboundTransport())
agent.registerInboundTransport(new HttpInboundTransport({ port: 3000 }))

// Function to initialize the agent
const initialize = async () => await agent.initialize().catch(console.error)
```

# React Native

```typescript showLineNumbers
import type { InitConfig } from '@aries-framework/core'
import { Agent, WsOutboundTransport, HttpOutboundTransport } from '@aries-framework/core'
import { agentDependencies } from '@aries-framework/react-native'

// The agent initialization configuration
const config: InitConfig = {
  label: 'docs-rn-agent',
  walletConfig: {
    id: 'wallet-id',
    key: 'testkey0000000000000000000000000',
  },
}

// Creating an agent instance
const agent = new Agent({
  config,
  dependencies: agentDependencies,
})

// Registering the required outbound transport
agent.registerOutboundTransport(new HttpOutboundTransport())
agent.registerOutboundTransport(new WsOutboundTransport())

// Function to initialize the agent
const initialize = async () => await agent.initialize().catch(console.error)
```

<!--/tabs-->

### Useful resources

- [Hyperledger Aries RFC - 004:
  Agents](https://github.com/hyperledger/aries-rfcs/blob/main/concepts/0004-agents/README.md)
