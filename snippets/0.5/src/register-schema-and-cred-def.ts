import { DidsModule, InitConfig, KeyType, TypedArrayEncoder } from '@credo-ts/core'

const config: InitConfig = {
  label: 'docs-agent-nodejs-register-schema-and-cred-def',
  walletConfig: {
    id: 'wallet-id',
    key: 'testkey0000000000000000000000000',
  },
}

import { AnonCredsModule } from '@credo-ts/anoncreds'
import { AskarModule } from '@credo-ts/askar'
import {
  CheqdAnonCredsRegistry,
  CheqdDidRegistrar,
  CheqdDidResolver,
  CheqdModule,
  CheqdModuleConfig,
} from '@credo-ts/cheqd'
// start-section-1
import { Agent } from '@credo-ts/core'
import { HederaAnonCredsRegistry, HederaDidRegistrar, HederaDidResolver, HederaModule } from '@credo-ts/hedera'
import {
  IndyVdrAnonCredsRegistry,
  IndyVdrIndyDidRegistrar,
  IndyVdrIndyDidResolver,
  IndyVdrModule,
} from '@credo-ts/indy-vdr'
import { agentDependencies } from '@credo-ts/node'
import { anoncreds } from '@hyperledger/anoncreds-nodejs'
import { indyVdr } from '@hyperledger/indy-vdr-nodejs'
import { askar } from '@openwallet-foundation/askar-nodejs'

const agent = new Agent({
  config,
  dependencies: agentDependencies,
  modules: {
    // Register the Askar module on the agent
    // We do this to have access to a wallet
    askar: new AskarModule({
      ariesAskar: askar,
    }),
    indyVdr: new IndyVdrModule({
      indyVdr,
      networks: [
        {
          isProduction: false,
          indyNamespace: 'bcovrin:test',
          genesisTransactions: '<genesis transactions>',
          connectOnStartup: true,
        },
      ],
    }),
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
    hedera: new HederaModule({
      networks: [
        {
          network: 'testnet', // '<mainnet or testnet or previewnet or local-node>'
          operatorId: '<your operator ID on the Hedera network>',
          operatorKey: '<your operator Key on the Hedera network in the DER format>',
        },
      ],
    }),
    anoncreds: new AnonCredsModule({
      registries: [new IndyVdrAnonCredsRegistry(), new CheqdAnonCredsRegistry(), new HederaAnonCredsRegistry()],
      anoncreds,
    }),
    dids: new DidsModule({
      registrars: [new IndyVdrIndyDidRegistrar(), new CheqdDidRegistrar(), new HederaDidRegistrar()],
      resolvers: [new IndyVdrIndyDidResolver(), new CheqdDidResolver(), new HederaDidResolver()],
    }),
  },
})
// end-section-1

// start-section-2
const seed = TypedArrayEncoder.fromString(`<seed>`) // What you input on bcovrin. Should be kept secure in production!
const unqualifiedIndyDid = `<unqualifiedIndyDid>` // will be returned after registering seed on bcovrin
const _indyDid = `did:indy:bcovrin:test:${unqualifiedIndyDid}`

const _cheqdDid = await agent.dids.create({
  method: 'cheqd',
  secret: {
    verificationMethod: {
      id: 'key-1',
      type: 'Ed25519VerificationKey2020',
    },
  },
  options: {
    network: 'testnet',
    methodSpecificIdAlgo: 'uuid',
  },
})

await agent.dids.import({
  did: '<did>',
  overwrite: true,
  privateKeys: [
    {
      privateKey: seed,
      keyType: KeyType.Ed25519,
    },
  ],
})

const _hederaDid = await agent.dids.create({
  method: 'hedera',
  options: {
    network: 'testnet',
  },
})
// end-section-2

// start-section-3
const schemaResult = await agent.modules.anoncreds.registerSchema({
  schema: {
    attrNames: ['name'],
    issuerId: '<did>',
    name: 'Example Schema to register',
    version: '1.0.0',
  },
  options: {},
})

if (schemaResult.schemaState.state === 'failed') {
  throw new Error(`Error creating schema: ${schemaResult.schemaState.reason}`)
}
// end-section-3

// start-section-4
const credentialDefinitionResult = await agent.modules.anoncreds.registerCredentialDefinition({
  credentialDefinition: {
    tag: 'default',
    issuerId: '<did>',
    schemaId: schemaResult.schemaState.schemaId,
  },
  options: {
    supportRevocation: false,
  },
})

if (credentialDefinitionResult.credentialDefinitionState.state === 'failed') {
  throw new Error(
    `Error creating credential definition: ${credentialDefinitionResult.credentialDefinitionState.reason}`
  )
}
// end-section-4
