// start-section-1
import { AnonCredsModule } from '@credo-ts/anoncreds'
import { AskarModule } from '@credo-ts/askar'
import { CheqdDidRegistrar, CheqdDidResolver, CheqdModule } from '@credo-ts/cheqd'
import { CheqdAnonCredsRegistry } from '@credo-ts/cheqd/anoncreds'
import { Agent, DidsModule } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { NativeAnoncreds } from '@hyperledger/anoncreds-nodejs'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    // Use a strong secret as the store key in production
    askar: new AskarModule({ askar: NativeAskar, store: { id: 'anoncreds-agent', key: 'anoncreds-agent-key' } }),
    cheqd: new CheqdModule({
      networks: [{ network: 'testnet', cosmosPayerSeed: '<cosmos payer seed or mnemonic>' }],
    }),
    dids: new DidsModule({
      registrars: [new CheqdDidRegistrar()],
      resolvers: [new CheqdDidResolver()],
    }),
    anoncreds: new AnonCredsModule({
      anoncreds: NativeAnoncreds,
      registries: [new CheqdAnonCredsRegistry()],
    }),
  },
})

await agent.initialize()
// end-section-1

// A did:cheqd created in this agent, see the cheqd page
const issuerId = '<did:cheqd:testnet:...>'

// start-section-2
const { schemaState } = await agent.modules.anoncreds.registerSchema({
  schema: {
    issuerId,
    name: 'Employee',
    version: '1.0',
    attrNames: ['name', 'role', 'age'],
  },
  // Registry specific, cheqd needs none
  options: {},
})

if (schemaState.state !== 'finished') {
  throw new Error(
    `Registering the schema failed: ${schemaState.state === 'failed' ? schemaState.reason : schemaState.state}`
  )
}
// end-section-2

// start-section-3
const { credentialDefinitionState } = await agent.modules.anoncreds.registerCredentialDefinition({
  credentialDefinition: {
    issuerId,
    schemaId: schemaState.schemaId,
    tag: 'default',
  },
  options: { supportRevocation: false },
})

if (credentialDefinitionState.state !== 'finished') {
  throw new Error(`Registering the credential definition failed: ${credentialDefinitionState.state}`)
}
const credentialDefinitionId = credentialDefinitionState.credentialDefinitionId
// end-section-3

// start-section-4
// Optional: without a link secret, one is created on the first credential request
const linkSecretId = await agent.modules.anoncreds.createLinkSecret({ setAsDefault: true })

const credentials = await agent.modules.anoncreds.getCredentials({ credentialDefinitionId })
for (const credential of credentials) {
  console.log(credential.credentialId, credential.attributes, credential.linkSecretId === linkSecretId)
}
// end-section-4

await agent.shutdown()
