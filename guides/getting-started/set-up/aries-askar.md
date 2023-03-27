# Aries Askar

[Aries Askar](https://github.com/hyperledger/aries-askar) provides secure, encrypted storage and cryptographic support for encrypting, decrypting, signing and verifiying data. It also provides both the `Wallet` and `StorageService` implementations for the agent.

:::caution
Although Aries Askar is stable and already used in production in agents such as [Aries Cloud Agent Python](https://github.com/hyperledger/aries-cloudagent-python), support for Aries Askar in Aries Framework JavaScript is currently experimental. We recommend new projects to use Aries Askar from the start, and also to migrate existing projects to Aries Askar. However, projects may experience some issues. If you encounter any issues, please [open an issue](https://github.com/hyperledger/aries-framework-javascript/issues/new).

Currently, there are few limitations to using Aries Askar.

- React Native projects leveraging [Expo](https://expo.dev) are not supported at the moment. Support for Expo will be added soon.
- When running in Node.JS, only Node.JS 18 is suported for now. See [Supported Node.JS versions for Aries Askar](#supported-nodejs-versions-for-aries-askar)

:::

:::tip

If you're upgrading from the Indy SDK to Aries Askar, see [Migrating from an Indy SDK Wallet to Aries Askar](../updating/update-indy-sdk-to-askar)

:::

### Installing Aries Askar

When using Aries Framework JavaScript with Aries Askar, there are a few extra dependencies that need to be installed. We need to install the `@aries-framework/askar` package, which implements the needed interfaces for the agent. Secondly, we need to install the Askar bindings for our platform from `@hyperledger/aries-askar-<platform>`. Currently there are bindings for Node.JS and React Native.

<!--tabs-->

# Node.JS

```console
yarn add @aries-framework/askar @hyperledger/aries-askar-nodejs
```

# React Native

```console
yarn add @aries-framework/askar @hyperledger/aries-askar-react-native
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

### Supported Node.JS versions for Aries Askar

Due to an issue in `ref-napi` (which is used in the Node.JS bindings for Aries Askar), performance for Aries Askar in Node.JS is not as expected. A patched version for `ref-napi` has been published that fixes this issue, but this only works in Node.JS 18+.

To use Aries Askar in Node.JS, make sure you're using Node.JS 18 and patch the `ref-napi` package to point towards `@2060.io/ref-napi` in your `package.json`:

<!--tabs-->

# NPM

Using [NPM `overrides`](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides) we can point the `ref-napi` package to `@2060.io/ref-napi`.

```json
{
    "overrides" {
        "ref-napi": "npm:@2060.io/ref-napi"
    }
}
```

# Yarn

Using [Yarn `resolutions`](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/) we can point the `ref-napi` package to `@2060.io/ref-napi`.

```json
{
    "resolutions" {
        "ref-napi": "npm:@2060.io/ref-napi"
    }
}
```

<!--/tabs-->

:::info

See the following issues for more information on the performance botleneck

- https://github.com/hyperledger/aries-askar/issues/76
- https://github.com/node-ffi-napi/ref-napi/issues/72
- https://github.com/node-ffi-napi/ref-napi/pull/73

:::
