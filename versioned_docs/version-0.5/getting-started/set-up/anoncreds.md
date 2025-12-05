# AnonCreds

The AnonCreds module provides functionality for issuing and verifying [AnonCreds](https://hyperledger.github.io/anoncreds-spec/) credentials in Credo. The AnonCreds implementation is based on [AnonCreds RS](https://github.com/hyperledger/anoncreds-rs), a direct implementation of the [AnonCreds V1.0 specification](https://hyperledger.github.io/anoncreds-spec/) that provides functionality like; creating a schema object, creating a credential definition object, creating a credential, verifying a proof presentation and much more.

### Installing

When using Credo with AnonCreds, there are a few extra dependencies that need to be installed. We need to install `@credo-ts/anoncreds` package, which contains the interfaces, and `@hyperledger/anoncreds-<platform>` package which is an implementation which depends on a wrapper of anoncreds-rs. Currently there are bindings for Node.js, as `@hyperledger/anoncreds-nodejs`, and React Native as `@hyperlegder/anoncreds-react-native`.

<!--tabs-->

# Node.js

```console
yarn add @credo-ts/anoncreds@^0.5.3 @hyperledger/anoncreds-nodejs@^0.2.2
```

# React Native

```console
yarn add @credo-ts/anoncreds@^0.5.3 @hyperledger/anoncreds-react-native@^0.2.2
```

<!--/tabs-->

### Adding AnonCreds to the agent

After installing the dependencies, we should register the `AnonCredsModule` on the agent.

<!--tabs-->

# Node.js

```typescript showLineNumbers set-up-anoncreds.ts section-1

```

# React Native

```typescript showLineNumbers set-up-anoncreds-rn.ts section-1

```

<!--/tabs-->

### Configuration

As you can see, the AnonCreds module takes a list of registry modules. These modules will be used to resolve the AnonCreds objects. [Indy VDR](./indy-vdr) can be used as an AnonCreds registry for Hyperledger Indy networks, and [Cheqd](./cheqd) can be used as an AnonCreds registry for Cheqd networks.
