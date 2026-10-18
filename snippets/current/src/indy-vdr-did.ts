import { readFile } from 'node:fs/promises'
import { transformPrivateKeyToPrivateJwk } from '@credo-ts/askar'
import { Agent, DidsModule, TypedArrayEncoder } from '@credo-ts/core'
import { PublicJwk } from '@credo-ts/core/kms'
import {
  type IndyVdrDidCreateOptions,
  type IndyVdrDidCreateResult,
  IndyVdrIndyDidRegistrar,
  IndyVdrIndyDidResolver,
  IndyVdrModule,
} from '@credo-ts/indy-vdr'
import { agentDependencies } from '@credo-ts/node'
import { indyVdr } from '@hyperledger/indy-vdr-nodejs'
import { exampleStorage } from './example-storage.js'

const genesisTransactions = await readFile('genesis/bcovrin-test.txn', 'utf8')

async function createAgent() {
  return new Agent({
    dependencies: agentDependencies,
    modules: {
      ...(await exampleStorage()),
      indyVdr: new IndyVdrModule({
        indyVdr,
        networks: [{ indyNamespace: 'bcovrin:test', isProduction: false, genesisTransactions }],
      }),
      dids: new DidsModule({
        registrars: [new IndyVdrIndyDidRegistrar()],
        resolvers: [new IndyVdrIndyDidResolver()],
      }),
    },
  })
}

const endorser = await createAgent()
const author = await createAgent()
await endorser.initialize()
await author.initialize()

// start-section-1
// The seed the DID was registered with on the ledger. Keep it secret.
const endorserSeed = process.env.ENDORSER_SEED
if (!endorserSeed) throw new Error('ENDORSER_SEED is not set')

const { privateJwk } = transformPrivateKeyToPrivateJwk({
  type: { kty: 'OKP', crv: 'Ed25519' },
  privateKey: TypedArrayEncoder.fromUtf8String(endorserSeed),
})
const { keyId, publicJwk } = await endorser.kms.importKey({ privateJwk })

// A DID registered from a seed is the base58 encoding of the first 16 bytes of the public key
const publicKey = PublicJwk.fromPublicJwk(publicJwk).publicKey.publicKey
const endorserDid = `did:indy:bcovrin:test:${TypedArrayEncoder.toBase58(publicKey.slice(0, 16))}`
await endorser.dids.import({
  did: endorserDid,
  // did:indy documents reference the main key as #verkey
  keys: [{ didDocumentRelativeKeyId: '#verkey', kmsKeyId: keyId }],
})
// end-section-1

// start-section-2
const { didState } = await endorser.dids.create<IndyVdrDidCreateOptions>({
  method: 'indy',
  options: {
    endorserDid,
    endorserMode: 'internal',
  },
})
if (didState.state !== 'finished') throw new Error('Registering the did failed')
// end-section-2

// start-section-3
// Author: prepare the transaction. The returned state asks for an endorsement.
const authorResult = (await author.dids.create<IndyVdrDidCreateOptions>({
  method: 'indy',
  options: { endorserDid, endorserMode: 'external' },
})) as IndyVdrDidCreateResult

const authorState = authorResult.didState
if (authorState.state !== 'action' || authorState.action !== 'endorseIndyTransaction') {
  throw new Error('Expected an endorsement request')
}

// Endorser: sign the transaction it received from the author
const endorsedNymRequest = await endorser.modules.indyVdr.endorseTransaction(
  authorState.nymRequest,
  authorState.endorserDid
)

// Author: submit the endorsed transaction
const submitResult = await author.dids.create<IndyVdrDidCreateOptions>({
  did: authorState.did,
  options: { endorserMode: 'external', endorsedTransaction: { nymRequest: endorsedNymRequest } },
})
// end-section-3
console.log(submitResult.didState.state)

await endorser.shutdown()
await author.shutdown()
