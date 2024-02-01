import DocCardList from '@theme/DocCardList';

# cheqd

[cheqd](https://github.com/cheqd/sdk) is a blockchain network, built in the Cosmos ecosystem for Self-Sovereign Identity (SSI). The cheqd Network leverages the [cheqd DID method](https://docs.cheqd.io/identity/architecture/adr-list/adr-001-cheqd-did-method) and enables [DID-Linked Resources](https://docs.cheqd.io/identity/architecture/adr-list/adr-002-did-linked-resources) to be written to the network, associated with a DID and controlled using the verification methods in the DID Document.

Through this approach, the cheqd Network is able to natively support the [Ledger Agnostic AnonCreds Specification (v1.0)](https://hyperledger.github.io/anoncreds-spec/) through its [AnonCreds Object Method](https://docs.cheqd.io/identity/guides/anoncreds) (as well as VC-JWT and JSON-LD).

cheqd also has a dedicated token, $CHEQ, used for identity writes to the network, voting in a decentralised governance framework as well as for various payment flows between verifiers, holders and issuers of Verifiable Credentials.

### Installing cheqd

When using Credo with the cheqd, there's a few extra dependencies that need to be installed. We need to install the `@credo-ts/cheqd` package, which implements the needed interfaces for the agent.

#### React Native

To enable react-native support we need to follow the steps below

In the package.json file add the below code snippet, which replaces the cosmjs dependencies with he cosmjs-rn packages

<!--tabs-->

# NPM

Using [NPM `overrides`](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides) we can point the `cosmjs` packages to `cosmjs-rn`.

```json
{
  "overrides": {
    "@cosmjs/amino": "npm:@cosmjs-rn/amino@^0.27.1",
    "@cosmjs/encoding": "npm:@cosmjs-rn/encoding@^0.27.1",
    "@cosmjs/math": "npm:@cosmjs-rn/math@^0.27.1",
    "@cosmjs/stargate": "npm:@cosmjs-rn/stargate@^0.27.1",
    "@cosmjs/tendermint-rpc": "npm:@cosmjs-rn/tendermint-rpc@^0.27.1",
    "@cosmjs/utils": "npm:@cosmjs-rn/utils@^0.27.1",
    "@cosmjs/proto-signing": "npm:@cosmjs-rn/proto-signing@^0.27.1",
    "@cosmjs/crypto": "npm:@cosmjs-rn/crypto@^0.27.1"
  }
}
```

# Yarn

Using [Yarn `resolutions`](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/) we can point the `cosmjs` packages to `cosmjs-rn`.

```json
{
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
}
```

<!--/tabs-->

Following that we need to add a buffer polyfill

```console
yarn add buffer
```

create a shim.js file with the below code snippet

```typescript
import { Buffer } from 'buffer'
global.Buffer = Buffer
```

`import shim.js` file into your file where the App is imported

### Adding the cheqd to the Agent

After installing the dependencies, we can register the cheqd Module on the agent by adding the below code snippet to the agent constructor.

<!--tabs-->

```typescript showLineNumbers set-up-cheqd.ts section-1

```

The cosmosPayerSeed can be a 32-bit seed value or a mnemonic, which can be managed using Keplr wallet which can be installed on a mobile or as a browser extension in chrome or safari which allows user's to create accounts, exchange tokens etc. To setup keplr wallet for cheqd follow this [tutorial](https://learn.cheqd.io/getting-set-up-on-cheqd/cheqd-supported-wallets/keplr-wallet)

### Tutorials

- [Cheqd DID Module](../../../tutorials/cheqd/index.md)
- [Register Schema and Credential Definition](../../../tutorials/registering-schema-and-credential-definition.md)
- [Issue a Credential](../../../tutorials/issue-a-credential.md)
