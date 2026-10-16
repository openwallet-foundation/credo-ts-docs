import { AskarModule } from '@credo-ts/askar'
// start-section-1
import { type CheqdDidCreateOptions, CheqdDidRegistrar, CheqdDidResolver, CheqdModule } from '@credo-ts/cheqd'
import {
  Agent,
  DidDocumentService,
  DidsModule,
  JwkDidRegistrar,
  JwkDidResolver,
  KeyDidRegistrar,
  KeyDidResolver,
  PeerDidRegistrar,
  PeerDidResolver,
  utils,
  WebDidResolver,
} from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

const cheqdModules = {
  cheqd: new CheqdModule({
    networks: [
      // The payer account pays the fees for ledger writes
      { network: 'testnet', cosmosPayerSeed: process.env.CHEQD_TESTNET_PAYER_MNEMONIC },
      // Without a payer seed you can resolve, but not write
      { network: 'mainnet' },
    ],
  }),
  dids: new DidsModule({
    registrars: [new KeyDidRegistrar(), new PeerDidRegistrar(), new JwkDidRegistrar(), new CheqdDidRegistrar()],
    resolvers: [
      new KeyDidResolver(),
      new PeerDidResolver(),
      new JwkDidResolver(),
      new WebDidResolver(),
      new CheqdDidResolver(),
    ],
  }),
}
// end-section-1

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    ...cheqdModules,
    askar: new AskarModule({ askar: NativeAskar, store: { id: 'cheqd-issuer', key: 'cheqd-issuer' } }),
  },
})
await agent.initialize()

// start-section-2
const { didState } = await agent.dids.create<CheqdDidCreateOptions>({
  method: 'cheqd',
  options: {
    network: 'testnet',
    methodSpecificIdAlgo: 'uuid',
    createKey: { type: { kty: 'OKP', crv: 'Ed25519' } },
  },
})

if (didState.state !== 'finished') {
  throw new Error(`Creating the did failed: ${didState.state === 'failed' ? didState.reason : didState.state}`)
}
const did = didState.did
// end-section-2

// start-section-3
const didDocument = await agent.dids.resolveDidDocument(did)
didDocument.service = [
  new DidDocumentService({
    id: `${did}#website`,
    type: 'LinkedDomains',
    serviceEndpoint: 'https://issuer.example.com',
  }),
]

const updateResult = await agent.dids.update({ did, didDocument })
if (updateResult.didState.state !== 'finished') throw new Error('Updating the did failed')
// end-section-3

// start-section-5
const resourceId = utils.uuid()
const resourceResult = await agent.modules.cheqd.createResource(did, {
  id: resourceId,
  name: 'issuer-logo',
  resourceType: 'Logo',
  version: '1.0',
  data: { uri: 'https://issuer.example.com/logo.png' },
})
if (resourceResult.resourceState.state !== 'finished') throw new Error('Creating the resource failed')
// end-section-5

// start-section-6
// By resource id
const byId = await agent.modules.cheqd.resolveResource(`${did}/resources/${resourceId}`)

// By name and type: the latest version, or add &version=1.0 or &resourceVersionTime=<unix time>
const byName = await agent.modules.cheqd.resolveResource(`${did}?resourceName=issuer-logo&resourceType=Logo`)
// end-section-6
console.log(byId, byName)

// start-section-4
const deactivateResult = await agent.dids.deactivate({ did })
// end-section-4
console.log(deactivateResult.didState.state)

await agent.shutdown()
