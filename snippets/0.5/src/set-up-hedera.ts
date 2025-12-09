// start-section-1

import { AnonCredsModule } from '@credo-ts/anoncreds'
import { AskarModule } from '@credo-ts/askar'
import { Agent, DidDocument, DidDocumentService, DidsModule, KeyType } from '@credo-ts/core'
/* Should be used for ReactNative */
// import { agentDependencies } from '@credo-ts/react-native'
// import { askar } from '@openwallet-foundation/askar-react-native'
// import { anoncreds } from '@hyperledger/anoncreds-react-native'
import {
  HederaAnonCredsRegistry,
  HederaDidCreateOptions,
  HederaDidRegistrar,
  HederaDidResolver,
  HederaModule,
} from '@credo-ts/hedera'
/* Should be used for Node */
import { agentDependencies } from '@credo-ts/node'
import { anoncreds } from '@hyperledger/anoncreds-nodejs'
import { askar } from '@openwallet-foundation/askar-nodejs'

const agent = new Agent({
  config: {
    label: 'docs-agent',
  },
  dependencies: agentDependencies,
  modules: {
    // Dids
    dids: new DidsModule({
      registrars: [new HederaDidRegistrar()],
      resolvers: [new HederaDidResolver()],
    }),
    // AnonCreds
    anoncreds: new AnonCredsModule({
      registries: [new HederaAnonCredsRegistry()],
      anoncreds,
    }),
    // Add hedera module
    hedera: new HederaModule({
      networks: [
        {
          network: 'testnet', // '<mainnet or testnet or previewnet or local-node>'
          operatorId: '<your operator ID on the Hedera network>',
          operatorKey: '<your operator Key on the Hedera network in the DER format>',
        },
      ],
    }),
    askar: new AskarModule({
      ariesAskar: askar,
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
// Create a key pair
const key = await agent.wallet.createKey({
  keyType: KeyType.Ed25519,
})
// Create a DID
await agent.dids.create<HederaDidCreateOptions>({
  method: 'hedera',
  options: { network: 'testnet' },
  didDocument: new DidDocument({
    id: 'did:hedera:testnet:44eesExqdsUvLZ35FpnBPErqRGRnYbzzyG3wgCCYxkmq_0.0.6226170',
    verificationMethod: [
      {
        id: '#key-1',
        type: 'Ed25519VerificationKey2020',
        controller: 'did:hedera:testnet:44eesExqdsUvLZ35FpnBPErqRGRnYbzzyG3wgCCYxkmq_0.0.6226170',
        publicKeyMultibase: key.fingerprint,
      },
    ],
  }),
})
// end-section-2

// start-section-3
await agent.dids.create<HederaDidCreateOptions>({
  method: 'hedera',
  options: { network: 'testnet' },
})
// end-section-3

// start-section-4
// Updates DID Document with adding a service
const _didUpdateResult1 = await agent.dids.update({
  did: 'did:hedera:testnet:44eesExqdsUvLZ35FpnBPErqRGRnYbzzyG3wgCCYxkmq_0.0.6226170',
  didDocumentOperation: 'addToDidDocument',
  didDocument: {
    service: [
      new DidDocumentService({
        id: '#service-1',
        type: 'rand',
        serviceEndpoint: 'https://rand.in',
      }),
    ],
  },
})
// Updates DID Document with removing a service
const _didUpdateResult2 = await agent.dids.update({
  did: 'did:hedera:testnet:44eesExqdsUvLZ35FpnBPErqRGRnYbzzyG3wgCCYxkmq_0.0.6226170',
  didDocumentOperation: 'removeFromDidDocument',
  didDocument: {
    service: [
      new DidDocumentService({
        id: '#service-1',
        type: 'rand',
        serviceEndpoint: 'https://rand.in',
      }),
    ],
  },
})
// end-section-4

// start-section-5
const _didDectivateResult = await agent.dids.deactivate({
  did: 'did:hedera:testnet:44eesExqdsUvLZ35FpnBPErqRGRnYbzzyG3wgCCYxkmq_0.0.6226170',
})
// end-section-5
