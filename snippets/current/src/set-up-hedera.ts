import { DidDocumentService } from '@credo-ts/core'

/* fixme: Need to update credo to 0.6.0 and actualize it */

// start-section-1
import { Agent, DidsModule, Kms, KeyType, DidDocument, TypedArrayEncoder, VerificationMethod, } from '@credo-ts/core'
import { AskarModule } from '@credo-ts/askar'
import { AnonCredsModule } from '@credo-ts/anoncreds'
/* Should be used for Node */
import { agentDependencies } from '@credo-ts/node'
import { ariesAskar } from '@openwallet-foundation/askar-nodejs'
import { anoncreds } from '@hyperledger/anoncreds-nodejs'
/* Should be used for ReactNative */
// import { agentDependencies } from '@credo-ts/react-native'
// import { ariesAskar } from '@openwallet-foundation/askar-react-native'
// import { anoncreds } from '@hyperledger/anoncreds-react-native'
import {
  HederaAnonCredsRegistry,
  HederaDidRegistrar,
  HederaDidResolver,
  HederaModule,
  HederaDidCreateOptions
} from '@credo-ts/hedera'
const agent = new Agent({
  config: {
    label: 'docs-agent'
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
      networks: [{
          network: '<mainnet or testnet or previewnet or local-node>',
          operatorId: '<your operator ID on the Hedera network>',
          operatorKey: '<your operator Key on the Hedera network in the DER format>',
        }]
    }),
    // Indy VDR can optionally be used with Askar as wallet and storage implementation
    askar: new AskarModule({
      id: `wallet-id`,
      key: `wallet-key`,
      database: {
        type: 'sqlite',
        config: {
          inMemory: true
        },
      },
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
const { keyId, publicJwk } = await agent.kms.createKey({
  type: {
    crv: 'Ed25519',
    kty: 'OKP',
  },
})

// encode a public key according to the verification method
const publicKeyMultibase = `z${TypedArrayEncoder.toBase58(Uint8Array.from(TypedArrayEncoder.fromBase64(publicJwk.x)))}`

// Create a DID
await agent.dids.create<HederaDidCreateOptions>({
  method: 'hedera',
  options: { network: 'testnet' },
  secret: { keys: [
      { kmsKeyId: keyId, didDocumentRelativeKeyId: '#key-1' },
    ],
  },
  didDocument: {
    id: 'did:hedera:testnet:44eesExqdsUvLZ35FpnBPErqRGRnYbzzyG3wgCCYxkmq_0.0.6226170',
    verificationMethod: [
      {
        id: '#key-1',
        type: 'Ed25519VerificationKey2020',
        controller: ['did:hedera:testnet:44eesExqdsUvLZ35FpnBPErqRGRnYbzzyG3wgCCYxkmq_0.0.6226170'],
        publicKeyMultibase,
      },
    ],
  },
})
// end-section-2


// start-section-3
await agent.dids.create<HederaDidCreateOptions>({
  method: 'hedera',
  options: { network: 'testnet' }
})
// end-section-3


// start-section-4
// Updates DID Document with adding a service
await agent.dids.update({
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
await agent.dids.update({
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
await agent.dids.deactivate({
  did: 'did:hedera:testnet:44eesExqdsUvLZ35FpnBPErqRGRnYbzzyG3wgCCYxkmq_0.0.6226170',
})
// end-section-5

