// start-section-1
import { AnonCredsModule } from '@credo-ts/anoncreds'
import { IndyVdrAnonCredsRegistry } from '@credo-ts/indy-vdr/anoncreds'
import { NativeAnoncreds } from '@hyperledger/anoncreds-nodejs'

const anoncreds = new AnonCredsModule({
  anoncreds: NativeAnoncreds,
  registries: [new IndyVdrAnonCredsRegistry()],
})

// end-section-1

// start-section-2
import { getIndyNamespaceFromIndyDid } from '@credo-ts/indy-vdr'
import {
  parseIndyCredentialDefinitionId,
  parseIndyRevocationRegistryId,
  parseIndySchemaId,
} from '@credo-ts/indy-vdr/anoncreds'

const did = 'did:indy:bcovrin:test:SDqTzbVuCowusqGBNbNDjH'
const schemaId = `${did}/anoncreds/v0/SCHEMA/example/1.0`
const credentialDefinitionId = `${did}/anoncreds/v0/CLAIM_DEF/10/TAG`
const revocationRegistryId = `${did}/anoncreds/v0/REV_REG_DEF/10/TAG/REV_TAG`

const didNamespace = getIndyNamespaceFromIndyDid(did)
const schemaNamespace = parseIndySchemaId(schemaId).namespace
const credentialDefinitionNamespace = parseIndyCredentialDefinitionId(credentialDefinitionId).namespace
const revocationRegistryNamespace = parseIndyRevocationRegistryId(revocationRegistryId).namespace

// Each namespace is 'bcovrin:test'. Passing an object ID to the DID helper throws.
// end-section-2

export { anoncreds, credentialDefinitionNamespace, didNamespace, revocationRegistryNamespace, schemaNamespace }
