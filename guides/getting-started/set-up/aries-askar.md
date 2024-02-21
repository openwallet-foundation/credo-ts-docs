# Aries Askar

[Aries Askar](https://github.com/hyperledger/aries-askar) provides secure, encrypted storage and cryptographic support for encrypting, decrypting, signing and verifying data. It also provides both the `Wallet` and `StorageService` implementations for the agent.

:::tip

If you're upgrading from the Indy SDK to Aries Askar, see [Migrating from an Indy SDK Wallet to Aries Askar](../updating/update-indy-sdk-to-askar)

:::

### Installing Aries Askar

When using Credo with Aries Askar, there are a few extra dependencies that need to be installed. We need to install the `@credo-ts/askar` package, which implements the needed interfaces for the agent. Secondly, we need to add native bindings for the specific platform `@hyperledger/aries-askar-<platform>`. Currently there are bindings for Node.JS, as `@hyperledger/aries-askar-nodejs`, and React Native as `@hyperlegder/aries-askar-react-native`.

<!--tabs-->

# Node.JS

```console
yarn add @credo-ts/askar@^0.5.0 @hyperledger/aries-askar-nodejs@^0.2.0
```

# React Native

```console
yarn add @credo-ts/askar@^0.5.0 @hyperledger/aries-askar-react-native@^0.2.0
```

<!--/tabs-->

### Adding Aries Askar to the Agent

After installing the dependencies, we can register the Askar Module on the agent.

<!--tabs-->

# Node.JS

```typescript showLineNumbers set-up-askar.ts section-1

```

# React Native

```typescript showLineNumbers set-up-askar-rn.ts section-1

```

<!--/tabs-->
