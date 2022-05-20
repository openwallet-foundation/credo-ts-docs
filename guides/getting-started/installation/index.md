# Setup

> This guide assumes you have followed the install guides from the previous
> section for your platform and a valid [Node.js](https://nodejs.org) or [React
> Native](https://reactnative.dev) project setup.

### Installing the required dependencies

First we have to install the minimal amount of dependencies that are required
for using the Aries Ecosystem.

```console title="Node.js"
yarn add @aries-framework/core @aries-framework/node
```

```console title="React Native"
yarn add @aries-framework/core @aries-framework/react-native react-native-fs react-native-get-random-values
```

### Additional setup

#### Node.js

no additional setup is required

#### React Native

Since [React Native](https://reactnative.dev) does not have an implementation
for
[`crypto.getRandomValues()`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues)
we have to setup a polyfill for this. We have to do this at the entrypoint of
the application. This could is most likely `index.(js|ts|jsx|tsx)` at the root
of your application.

```diff title="index.tsx" showLineNumbers
+ import 'react-native-get-random-values'
```

### Setting up the agent

> This section assumes basic knowledge of [TODO: agent
> config](https://example.org)

In order to use the agent in the application we have to configure and
initialize it. This following configuration is quite generic and possibly not
enough for your specific use cases. Please refer to the [TODO: setup
guide](https://example.org) for a more use-case-specific agent setup.

#### Node.js

```typescript title="index.ts" showLineNumbers
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

#### React Native

```typescript title="index.ts" showLineNumbers
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

### Initializing the agent

```typescript title="index.ts"
// ...

const agent = new Agent(config, AgentDependencies)

const initialize = async () => await agent.initialize().catch(console.error)
```
