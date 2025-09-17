import DocCardList from '@theme/DocCardList';

# Hedera

[Hedera](https://hedera.com) is an open public network governed by leading organizations worldwide. Hedera uses revolutionary consensus technology based on hashgraph to support decentralized applications — all without compromising speed, efficiency, and security. The consensus is leaderless, meaning no single node controls the transaction order, which reduces the risk of a single point of failure and attacks. The codebase is managed by the Linux Foundation Decentralized Trust (LF Decentralized Trust) under the Hiero project, which provides vendor-independent code governance and peace of mind for developers.

Hedera is a large and trusted network and a great option for Self-Sovereign Identity (SSI), providing high performance and low costs of operations.
In particular, Hedera can be used as Verifiable Data Registry (VDR) for [Hedera DID Method](https://github.com/hashgraph/did-method/blob/master/hedera-did-method-specification.md) and [AnonCreds Verifiable Credentials](https://github.com/hyperledger/anoncreds-spec) by leveraging Hedera Consensus Service (HCS).

Details on Hedera AnonCreds VDR implementation approach can be found in [Hiero AnonCreds Method](https://dsrcorporation.github.io/hedera-anoncreds-method/).

### Installing Hedera

To use Credo with Hedera, you need to install several additional dependencies. Specifically, the package `@credo-ts/hedera` must be installed, which implements the necessary interfaces for the agent. The `@credo-ts/hedera` package depends on a set of third-party packages from the [@hiero-did-sdk-js](https://github.com/hiero-ledger/hiero-did-sdk-js) family, which provide direct interaction with the Hedera network. Additionally, for proper functionality, you need to install extra libraries compatible with your chosen framework to support these dependencies.

#### Node

To use Hedera Credo module in Node environment, you need to install the ZSTD package. 

<!--tabs-->

# NPM

```console
npm install zstd-napi
```

# Yarn

```console
yarn add zstd-napi
```

# PNPM

```console
pnpm install zstd-napi
```

<!--/tabs-->


#### React Native

To use Hedera Credo module in React Native environment, you need to install the ZSTD package and the crypto package.

<!--tabs-->

# NPM

```console
npm install react-native-zstd
npm install react-native-quick-crypto
npm install buffer
```

# Yarn

```console
yarn add react-native-zstd
yarn add react-native-quick-crypto
yarn add buffer
```

# PNPM

```console
npm install react-native-zstd
pnpm install react-native-quick-crypto
pnpm install buffer
```
<!--/tabs-->

Following that we need to add a buffer polyfill. Create a `shim.js` file with the below code snippet

```typescript
import { Buffer } from 'buffer'
global.Buffer = Buffer
```

Import `shim.js` file into your file where the App is imported


### Adding the Hedera to the Agent

After installing the dependencies, we can register the Hedera Module on the agent by adding the below code snippet to the agent constructor.

<!--tabs-->

```typescript showLineNumbers set-up-hedera.ts section-1

```

HederaModule allows you to use multiple networks simultaneously. It also supports both standard and custom networks built on top of Hedera. These network settings can be specified in the configuration. For more detailed information, you can refer to the client guide documentation available from the [Hiero DID SDK JS](https://hiero-ledger.github.io/hiero-did-sdk-js/documentation/latest/03-implementation/components/client-guide.html) project.


### Tutorials

- [Hedera DID Module](../../../tutorials/hedera/index.md)
- [Register Schema and Credential Definition](../../../tutorials/registering-schema-and-credential-definition.md)
- [Issue an AnonCreds Credential over DIDComm](../../../tutorials/issue-an-anoncreds-credential-over-didcomm.md)
