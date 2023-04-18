import type { InitConfig } from '@aries-framework/core'

const config: InitConfig = {
  label: 'docs-agent-react-native',
  walletConfig: {
    id: 'wallet-id',
    key: 'testkey0000000000000000000000000',
  },
}

// start-section-1
import { Agent, DidsModule, KeyType, DidDocument } from '@aries-framework/core'
import { agentDependencies } from '@aries-framework/react-native'
import { AskarModule } from '@aries-framework/askar'
import { ariesAskar } from '@hyperledger/aries-askar-react-native'

import {
  CheqdAnonCredsRegistry,
  CheqdDidRegistrar,
  CheqdDidResolver,
  CheqdModule,
  CheqdModuleConfig,
} from '@aries-framework/cheqd'
import { AnonCredsModule } from '@aries-framework/anoncreds'

const agent = new Agent({
  config,
  dependencies: agentDependencies,
  modules: {
    dids: new DidsModule({
      registrars: [new CheqdDidRegistrar()],
      resolvers: [new CheqdDidResolver()],
    }),

    // AnonCreds
    anoncreds: new AnonCredsModule({
      registries: [new CheqdAnonCredsRegistry()],
    }),

    // Add cheqd module
    cheqd: new CheqdModule(
      new CheqdModuleConfig({
        networks: [
          {
            network: '<mainnet or testnet>',
            cosmosPayerSeed: '<cosmos payer seed or mnemonic>',
          },
        ],
      })
    ),
    // Indy VDR can optionally be used with Askar as wallet and storage implementation
    askar: new AskarModule({
      ariesAskar,
    }),
  },
})
// end-section-1

agent
  .initialize()
  .then(() => {
    console.log('Agent initialized!')
  })
  .catch((e) => {
    console.error(`Something went wrong while setting up the agent! Message: ${e}`)
  })

// start-section-2

// create a key pair
const key = await agent.wallet.createKey({
  keyType: KeyType.Ed25519,
})

// encode public key according to the verification method
const ed25519PublicKeyBase58 = key.publicKeyBase58

// Create a DID
const did = await agent.dids.create({
  method: 'cheqd',
  options: {
    network: 'testnet',
  },
  didDocument: new DidDocument({
    id: "did:cheqd:testnet:92874297-d824-40ea-8ae5-364a1ec9237d",
    controller: [
      "did:cheqd:testnet:92874297-d824-40ea-8ae5-364a1ec9237d"
    ],
    verificationMethod: [
      {
        id: "did:cheqd:testnet:92874297-d824-40ea-8ae5-364a1ec9237d#key-1",
        type: "Ed25519VerificationKey2018",
        controller: "did:cheqd:testnet:92874297-d824-40ea-8ae5-364a1ec9237d",
        publicKeyBase58: ed25519PublicKeyBase58,
      }
    ],
    authentication: [
      "did:cheqd:testnet:92874297-d824-40ea-8ae5-364a1ec9237d#key-1"
    ]
  })
})
// end-section-2

// start-section-3
await agent.dids.create({
  method: 'cheqd',
  // the secret contains a the verification method type and id
  secret: {
    verificationMethod: {
      id: 'key-1',
      type: 'Ed25519VerificationKey2020',
    },
  },
  // an optional methodSpecificIdAlgo parameter
  options: {
    network: 'testnet',
    methodSpecificIdAlgo: 'uuid',
  },
})
// end-section-3
