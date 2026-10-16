import { AskarModule } from '@credo-ts/askar'
// start-section-1
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
  WebDidResolver,
} from '@credo-ts/core'
import {
  type HederaDidCreateOptions,
  HederaDidRegistrar,
  HederaDidResolver,
  type HederaDidUpdateOptions,
  HederaModule,
} from '@credo-ts/hedera'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

// The operator account pays the Hedera transaction fees
const operatorId = process.env.HEDERA_OPERATOR_ID
const operatorKey = process.env.HEDERA_OPERATOR_KEY
if (!operatorId || !operatorKey) throw new Error('HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY must be set')

const hederaModules = {
  hedera: new HederaModule({
    networks: [{ network: 'testnet', operatorId, operatorKey }],
  }),
  dids: new DidsModule({
    registrars: [new KeyDidRegistrar(), new PeerDidRegistrar(), new JwkDidRegistrar(), new HederaDidRegistrar()],
    resolvers: [
      new KeyDidResolver(),
      new PeerDidResolver(),
      new JwkDidResolver(),
      new WebDidResolver(),
      new HederaDidResolver(),
    ],
  }),
}
// end-section-1

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    ...hederaModules,
    askar: new AskarModule({ askar: NativeAskar, store: { id: 'hedera-issuer', key: 'hedera-issuer' } }),
  },
})
await agent.initialize()

// start-section-2
const { didState } = await agent.dids.create<HederaDidCreateOptions>({
  method: 'hedera',
  options: { network: 'testnet' },
})

if (didState.state !== 'finished') {
  throw new Error(`Creating the did failed: ${didState.state === 'failed' ? didState.reason : didState.state}`)
}
const did = didState.did
// end-section-2

// start-section-3
const updateResult = await agent.dids.update<HederaDidUpdateOptions>({
  did,
  didDocumentOperation: 'addToDidDocument',
  didDocument: {
    service: [
      new DidDocumentService({
        id: `${did}#website`,
        type: 'LinkedDomains',
        serviceEndpoint: 'https://issuer.example.com',
      }),
    ],
  },
})
if (updateResult.didState.state !== 'finished') throw new Error('Updating the did failed')
// end-section-3

// start-section-4
const deactivateResult = await agent.dids.deactivate({ did })
// end-section-4
console.log(deactivateResult.didState.state)

await agent.shutdown()
