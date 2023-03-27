# Indy VDR

[Hyperledger Indy VDR](https://github.com/hyperledger/indy-vdr), Verifiable
Data Registry, can be used to connect to one or more Indy Node ledger pools
given sets of genesis transactions. Methods are provided to construct ledger
requests and send them to the validators, collecting the results and ensuring
that there is a consensus between the nodes. In the context of Aries Framework
JavaScript, we mainly leverage it to register, and resolve, schemas, credential
definitions and dids.

:::caution

Support for Indy VDR in Aries Framework JavaScript is currently experimental.
We recommend new projects to use Indy VDR from the start, and also to migrate
existing projects to Indy VDR, from the indy-sdk. However, projects may
experience some issues. If you encounter any issues, please [open an
issue](https://github.com/hyperledger/aries-framework-javascript/issues/new).

Currently, there are few limitations to using Indy VDR.

- React Native projects leveraging [Expo](https://expo.dev) are not supported
  at the moment. Support for Expo will be added soon.
- React Native Android support starts from 11 right now. Work is being done on
  support for lower versions.
- When running in Node.JS, only Node.JS 18 is suported for now. See [Supported
  Node.JS versions for Indy VDR](#supported-nodejs-versions-for-indy-vdr)

:::

### Installing Indy VDR

When using Aries Framework JavaScript with Indy VDR, there are a few extra
dependencies that need to be installed. We need to install the
`@hyperledger/indy-vdr`, which contains all the functionality to register
objects on an Hyperledger Indy VDR. Secondly, we need to add native bindings
for the specific platform `@hyperledger/indy-vdr-<platform>`. Currently there
are bindings for Node.JS, `nodejs` and React Native, `react-native`.

<!--tabs-->

# Node.JS

```console
yarn add @aries-framework/indy-vdr @hyperledger/indy-vdr-nodejs
```

# React Native

```console
yarn add @aries-framework/indy-vdr @hyperledger/indy-vdr-react-native
```

<!--/tabs-->

### Adding Indy VDR to the agent

After installing the dependencies, we can register the Indy VDR module on the
agent.

<!--tabs-->

# Node.JS

```typescript showLineNumbers set-up-indy-vdr.ts section-1

```

# React Native

```typescript showLineNumbers set-up-indy-vdr-rn.ts section-1

```

<!--/tabs-->

As you can see, the Indy VDR module takes the native bindings and a list of
networks. This list of networks will be used to resolve and register objects
on. The list of networks is compatible with the older
[`indyLedgers`](../../tutorials/agent-config/index.md#indyLedgers).

### Supported Node.JS versions for Indy VDR

Due to an issue in `ref-napi` (which is used in the Node.JS bindings for
Indy VDR), performance for Indy VDR in Node.JS is not as expected. A
patched version for `ref-napi` has been published that fixes this issue, but
this only works in Node.JS 18+.

To use Indy VDR in Node.JS, make sure you're using Node.JS 18 and patch the
`ref-napi` package to point towards `@2060.io/ref-napi` in your `package.json`:

<!--tabs-->

# NPM

Using [NPM
`overrides`](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides)
we can point the `ref-napi` package to `@2060.io/ref-napi`.

```json
{
    "overrides" {
        "ref-napi": "npm:@2060.io/ref-napi"
    }
}
```

# Yarn

Using [Yarn
`resolutions`](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/)
we can point the `ref-napi` package to `@2060.io/ref-napi`.

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
