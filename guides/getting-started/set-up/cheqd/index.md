import DocCardList from '@theme/DocCardList';

# Cheqd

[cheqd](https://github.com/cheqd/sdk) cheqd is a blockchain network, built in the Cosmos ecosystem for self-sovereign identity. It bridges the DeFi ecosystem with the decentralised identity ecosystem, and provides an implementation of the the new Ledger [Agnostic AnonCreds Specification (v1.0)](https://hyperledger.github.io/anoncreds-spec/).


### Installing cheqd

When using Aries Framework JavaScript with the cheqd, there's a few extra dependencies that need to be installed. We need to install the `@aries-framework/cheqd` package, which implements the needed interfaces for the agent.

To enable react-native support we need to follow the steps below

<DocCardList />

# React Native

In the package.json file add the below code snippet, which replaces the cosmjs dependencies witht he cosmjs-rn packages
```json
 "resolutions": {
    "@cosmjs/amino": "npm:@cosmjs-rn/amino@^0.27.1",
    "@cosmjs/encoding": "npm:@cosmjs-rn/encoding@^0.27.1",
    "@cosmjs/math": "npm:@cosmjs-rn/math@^0.27.1",
    "@cosmjs/stargate": "npm:@cosmjs-rn/stargate@^0.27.1",
    "@cosmjs/tendermint-rpc": "npm:@cosmjs-rn/tendermint-rpc@^0.27.1",
    "@cosmjs/utils": "npm:@cosmjs-rn/utils@^0.27.1",
    "@cosmjs/proto-signing": "npm:@cosmjs-rn/proto-signing@^0.27.1",
    "@cosmjs/crypto": "npm:@cosmjs-rn/crypto@^0.27.1"
  }
```

Following that we need to add a buffer polyfill

```console
    yarn add buffer
```

create a shim.js file with the below code snippet
```typescript
    import { Buffer } from 'buffer'
    global.Buffer = Buffer
```

import to shim.js file into your file where the App is imported

<!--/tabs-->

### Adding the cheqd to the Agent

After installing the dependencies, we can register the cheqd Module on the agent by adding the below code snippet to the agent constructor.

<!--tabs-->

```typescript showLineNumbers

    dids: new DidsModule({
      registrars: [new CheqdDidRegistrar()],
      resolvers: [new CheqdDidResolver()],
    }),

    // AnonCreds
    anoncreds: new AnonCredsModule({
      registries: [new CheqdAnonCredsRegistry()],
    }),

    // Add cheqd module
    cheqd: new CheqdModule(new CheqdModuleConfig({
        networks: [
          {
            network: '<mainnet or testnet>',
            cosmosPayerSeed: '<cosmos payer seed or mnemonic>',
          },
        ],
      })),

```
