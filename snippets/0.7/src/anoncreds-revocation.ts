// start-section-1
import { readFile } from 'node:fs/promises'
import { AnonCredsModule, type AnonCredsRevocationRegistryDefinition, BasicTailsFileService } from '@credo-ts/anoncreds'
import { CheqdDidRegistrar, CheqdDidResolver, CheqdModule } from '@credo-ts/cheqd'
import { CheqdAnonCredsRegistry } from '@credo-ts/cheqd/anoncreds'
import { Agent, type AgentContext, DidsModule } from '@credo-ts/core'
import { anoncredsBundle } from '@credo-ts/drizzle-storage/anoncreds'
import { agentDependencies } from '@credo-ts/node'
import { NativeAnoncreds } from '@hyperledger/anoncreds-nodejs'
import { exampleStorage } from './example-storage.js'

class TailsServerFileService extends BasicTailsFileService {
  public async uploadTailsFile(
    _agentContext: AgentContext,
    { revocationRegistryDefinition }: { revocationRegistryDefinition: AnonCredsRevocationRegistryDefinition }
  ) {
    // Before the upload, `tailsLocation` is the path of the tails file Credo generated
    const tailsFile = await readFile(revocationRegistryDefinition.value.tailsLocation)
    const tailsFileUrl = `https://tails.example.com/${revocationRegistryDefinition.value.tailsHash}`

    const response = await fetch(tailsFileUrl, { method: 'PUT', body: tailsFile })
    if (!response.ok) throw new Error(`Uploading the tails file failed with status ${response.status}`)

    return { tailsFileUrl }
  }
}
// end-section-1

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    ...(await exampleStorage([anoncredsBundle])),
    cheqd: new CheqdModule({
      networks: [{ network: 'testnet', cosmosPayerSeed: '<cosmos payer seed or mnemonic>' }],
    }),
    dids: new DidsModule({
      registrars: [new CheqdDidRegistrar()],
      resolvers: [new CheqdDidResolver()],
    }),
    // start-section-2
    anoncreds: new AnonCredsModule({
      anoncreds: NativeAnoncreds,
      registries: [new CheqdAnonCredsRegistry()],
      tailsFileService: new TailsServerFileService(),
    }),
    // end-section-2
  },
})

await agent.initialize()

const issuerId = '<did:cheqd:testnet:...>'
const schemaId = '<schema id>'

// start-section-3
const { credentialDefinitionState } = await agent.modules.anoncreds.registerCredentialDefinition({
  credentialDefinition: { issuerId, schemaId, tag: 'revocable' },
  options: { supportRevocation: true },
})
if (credentialDefinitionState.state !== 'finished') {
  throw new Error(`Registering the credential definition failed: ${credentialDefinitionState.state}`)
}

const { revocationRegistryDefinitionState } = await agent.modules.anoncreds.registerRevocationRegistryDefinition({
  revocationRegistryDefinition: {
    issuerId,
    credentialDefinitionId: credentialDefinitionState.credentialDefinitionId,
    tag: 'default',
    maximumCredentialNumber: 1000,
  },
  options: {},
})
if (revocationRegistryDefinitionState.state !== 'finished') {
  throw new Error(`Registering the revocation registry failed: ${revocationRegistryDefinitionState.state}`)
}
const revocationRegistryDefinitionId = revocationRegistryDefinitionState.revocationRegistryDefinitionId

// The initial list, in which no credential is revoked
const { revocationStatusListState } = await agent.modules.anoncreds.registerRevocationStatusList({
  revocationStatusList: { issuerId, revocationRegistryDefinitionId },
  options: {},
})
if (revocationStatusListState.state !== 'finished') {
  throw new Error(`Registering the revocation status list failed: ${revocationStatusListState.state}`)
}
// end-section-3

// start-section-4
// Revoke the credentials issued with revocationRegistryIndex 1 and 2
const { revocationStatusListState: updatedState } = await agent.modules.anoncreds.updateRevocationStatusList({
  revocationStatusList: { revocationRegistryDefinitionId, revokedCredentialIndexes: [1, 2] },
  options: {},
})
if (updatedState.state !== 'finished') throw new Error(`Revoking failed: ${updatedState.state}`)
// end-section-4

await agent.shutdown()
