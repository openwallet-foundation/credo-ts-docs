# AnonCreds RS

[AnonCreds RS](https://github.com/hyperledger/anoncreds-rs) is a direct implementation of the [AnonCreds V1.0 specification](https://hyperledger.github.io/anoncreds-spec/) that provides functionality like; creating a schema object, creating a credential definition object, creating a credential, verifying a proof presentation and much more.

:::caution

Support for the AnonCreds RS library in Aries Framework JavaScript is currently experimental. We recommend new projects to use AnonCreds RS from the start, and also to migrate existing projects to AnonCreds, from the Indy Sdk. However, projects may experience some issues. If you encounter any issues, please [open an issue](https://github.com/hyperledger/aries-framework-javascript/issues/new).

Currently, there are few limitations to using AnonCreds RS.

- React Native projects leveraging [Expo](https://expo.dev) are not supported at the moment. Support for Expo will be added soon.
- When running in Node.JS, only Node.JS 18 is suported for now. See [Supported Node.JS versions for AnonCreds RS](#supported-nodejs-versions-for-anoncreds-rs)

:::

### Installing AnonCreds RS

When using Aries Framework JavaScript with AnonCreds RS, there are a few extra dependencies that need to be installed. We need to install `@hyperledger/anoncreds` package, which contains the interfaces, and `@hyperledger/anoncreds-rs` package which is an implementation which depends on a wrapper of anoncreds-rs. Secondly, we need to add native bindings for the specific platform `@hyperledger/anoncreds-<platform>`. Currently there are bindings for Node.JS, as `@hyperledger/anoncreds-nodejs`, and React Native as `@hyperlegder/anoncreds-react-native`.

<!--tabs-->

# Node.JS

```console
yarn add @aries-framework/anoncreds@alpha @aries-framework/anoncreds-rs@alpha @hyperledger/anoncreds-nodejs
```

# React Native

```console
yarn add @aries-framework/anoncreds@alpha @aries-framework/anoncreds-rs@alpha @hyperledger/anoncreds-react-native
```

<!--/tabs-->

### Adding AnonCreds RS to the agent

After installing the dependencies, we should register both the `AnonCreds` and `AnonCredsRs` module on the agent.

<!--tabs-->

# Node.JS

```typescript showLineNumbers set-up-anoncreds-rs.ts section-1

```

# React Native

```typescript showLineNumbers set-up-anoncreds-rs-rn.ts section-1

```

<!--/tabs-->

### Configuration

As you can see, the AnonCreds module takes a list of registry modules. These modules will be used to resolve the AnonCreds objects. We recommend [Indy VDR](./indy-vdr) as an AnonCreds registry for Hyperledger Indy networks, but [Indy SDK](./indy-sdk) can also be used.

### Supported Node.JS versions for AnonCreds RS

Due to an issue in `ref-napi` (which is used in the Node.JS bindings for AnonCreds RS), performance for AnonCreds RS in Node.JS is not as expected. A patched version for `ref-napi` has been published that fixes this issue, but this only works in Node.JS 18+.

To use AnonCreds RS in Node.JS, make sure you're using Node.JS 18 and patch the `ref-napi` package to point towards `@2060.io/ref-napi` in your `package.json`:

<!--tabs-->

# NPM

Using [NPM `overrides`](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides) we can point the `ref-napi` package to `@2060.io/ref-napi`.

```json
{
  "overrides": {
    "ref-napi": "npm:@2060.io/ref-napi"
  }
}
```

# Yarn

Using [Yarn `resolutions`](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/) we can point the `ref-napi` package to `@2060.io/ref-napi`.

```json
{
  "resolutions": {
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
