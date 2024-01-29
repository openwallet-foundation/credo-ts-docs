import DocCardList from '@theme/DocCardList';

# Indy SDK

[Indy SDK](https://github.com/hyperledger/indy-sdk) provides a distributed ledger based foundation for self-sovereign identity. It can provide the `Wallet` and `StorageService` implementations for the agent, as well as a way to interact with Indy ledgers and an implementation of the legacy (v0.1) [AnonCreds Specification](https://hyperledger.github.io/anoncreds-spec/)

:::caution
The Indy SDK integration in Aries Framework JavaScript is currently in maintenance mode. We recommend new projects to use [Aries Askar](../aries-askar) from the start, and also to migrate existing projects to Aries Askar.
:::

:::caution
The AnonCreds implementation from the Indy SDK only supports the [Hyperledger Indy Legacy AnonCreds Method](https://hyperledger.github.io/anoncreds-methods-registry/#hyperledger-indy-legacy-anoncreds-method) (the pre-standardized implementation), and doesn't support the new Ledger [Agnostic AnonCreds Specification (v1.0)](https://hyperledger.github.io/anoncreds-spec/). Use the new AnonCreds Rust implementation, which is also supported by Aries Framework JavaScript, in combination with [Aries Askar](../aries-askar) and Indy VDR to replace the bevhaviour of the Indy SDK, and support the new features these libraries have to offer.
:::

### Installing the Indy SDK

When using Aries Framework JavaScript with the Indy SDK, there's a few extra dependencies that need to be installed. We need to install the `@aries-framework/indy-sdk` package, which implements the needed interfaces for the agent. Secondly, we need to install the native Indy SDK library and the bindings for our specific platform. Currently there are bindings for Node.JS and React Native.

To start off, install the native Indy SDK library. The setup for this depends on the platform you are using. Follow the instructions for your platform below.

<DocCardList />

After the native Indy SDK library is installed, we can add the Indy SDK libraries.

<!--tabs-->

# Node.JS

```console
yarn add @aries-framework/indy-sdk@^0.4.0 indy-sdk
```

And install the needed types

```console
yarn add --dev @types/indy-sdk
```

# React Native

```console
yarn add @aries-framework/indy-sdk@^0.4.0 indy-sdk-react-native
```

And then install the needed types

```console
yarn add --dev @types/indy-sdk-react-native@npm:@types/indy-sdk
```

<!--/tabs-->

### Adding the Indy SDK to the Agent

After installing the dependencies, we can register the Indy SDK Module on the agent.

<!--tabs-->

# Node.JS

```typescript showLineNumbers set-up-indy-sdk.ts section-1

```

# React Native

```typescript showLineNumbers set-up-indy-sdk-rn.ts section-1

```
