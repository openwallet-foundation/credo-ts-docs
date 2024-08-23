import { DidDocumentService, InitConfig } from '@credo-ts/core'

const config: InitConfig = {
  label: 'docs-agent-react-native',
  walletConfig: {
    id: 'wallet-id',
    key: 'testkey0000000000000000000000000',
  },
}

// start-section-1
import { Agent, DidsModule, KeyType, DidDocument } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/react-native'
import { AskarModule } from '@credo-ts/askar'
import { ariesAskar } from '@hyperledger/aries-askar-react-native'

import {
  CheqdAnonCredsRegistry,
  CheqdDidRegistrar,
  CheqdDidResolver,
  CheqdModule,
  CheqdModuleConfig,
  CheqdDidCreateOptions,
} from '@credo-ts/cheqd'
import { AnonCredsModule } from '@credo-ts/anoncreds'
import { anoncreds } from '@hyperledger/anoncreds-react-native'

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
      anoncreds,
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
await agent.dids.create<CheqdDidCreateOptions>({
  method: 'cheqd',
  secret: {},
  options: {},
  didDocument: new DidDocument({
    id: 'did:cheqd:testnet:92874297-d824-40ea-8ae5-364a1ec9237d',
    controller: ['did:cheqd:testnet:92874297-d824-40ea-8ae5-364a1ec9237d'],
    verificationMethod: [
      {
        id: 'did:cheqd:testnet:92874297-d824-40ea-8ae5-364a1ec9237d#key-1',
        type: 'Ed25519VerificationKey2018',
        controller: 'did:cheqd:testnet:92874297-d824-40ea-8ae5-364a1ec9237d',
        publicKeyBase58: ed25519PublicKeyBase58,
      },
    ],
    authentication: ['did:cheqd:testnet:92874297-d824-40ea-8ae5-364a1ec9237d#key-1'],
  }),
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

// start-section-4
await agent.dids.update({
  did: 'did:cheqd:testnet:b84817b8-43ee-4483-98c5-f03760816411',
  // Updates DID Document with an additional verification method if provided
  secret: {
    verificationMethod: {
      id: 'key-2',
      type: 'JsonWebKey2020',
    },
  },
  didDocument: {
    id: 'did:cheqd:testnet:b84817b8-43ee-4483-98c5-f03760816411',
    controller: ['did:cheqd:testnet:b84817b8-43ee-4483-98c5-f03760816411'],
    verificationMethod: [
      {
        id: 'did:cheqd:testnet:b84817b8-43ee-4483-98c5-f03760816411#key-1',
        type: 'Ed25519VerificationKey2020',
        controller: 'did:cheqd:testnet:b84817b8-43ee-4483-98c5-f03760816411',
        publicKeyMultibase: 'z6MknkzLUEP5cxqqsaysNMWoh8NJRb3YsowTCj2D6yhwyEdj',
      },
    ],
    authentication: ['did:cheqd:testnet:b84817b8-43ee-4483-98c5-f03760816411#key-1'],
    // updates did document with a service block
    service: [
      new DidDocumentService({
        id: 'did:cheqd:testnet:b84817b8-43ee-4483-98c5-f03760816411#rand',
        type: 'rand',
        serviceEndpoint: 'https://rand.in',
      }),
    ],
  },
})
// end-section-4

// start-section-5
await agent.dids.deactivate({
  did: 'did:cheqd:testnet:b84817b8-43ee-4483-98c5-f03760816411',
  // an optional versionId parameter
  options: {
    versionId: '3.0',
  },
})
// end-section-5

// start-section-6
await agent.modules.cheqd.createResource('did:cheqd:testnet:92874297-d824-40ea-8ae5-364a1ec9237d', {
  name: 'resourceName',
  resourceType: 'resourceType',
  id: '6de33634-6439-4e46-aa3f-bfe03606b000',
  version: '1.0',
  data: {
    name: 'name',
    age: 18,
  },
})
// end-section-6
