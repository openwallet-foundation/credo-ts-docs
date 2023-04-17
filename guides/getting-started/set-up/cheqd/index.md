import DocCardList from '@theme/DocCardList';

# cheqd

[cheqd](https://github.com/cheqd/sdk) is a blockchain network, built in the Cosmos ecosystem for Self-Sovereign Identity (SSI). The cheqd Network leverages the [cheqd DID method](https://docs.cheqd.io/identity/architecture/adr-list/adr-001-cheqd-did-method) and enables [DID-Linked Resources](https://docs.cheqd.io/identity/architecture/adr-list/adr-002-did-linked-resources) to be written to the network, associated with a DID and controlled using the verification methods in the DID Document. 

Through this approach, the cheqd Network is able to natively support the [Ledger Agnostic AnonCreds Specification (v1.0)](https://hyperledger.github.io/anoncreds-spec/) through its [AnonCreds Object Method](https://docs.cheqd.io/identity/guides/anoncreds) (as well as VC-JWT and JSON-LD). 

cheqd also has a dedicated token, $CHEQ, used for identity writes to the network, voting in a decentralised governance framework as well as for various payment flows between verifiers, holders and issuers of Verifiable Credentials.


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
