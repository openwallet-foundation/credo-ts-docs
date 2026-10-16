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
import { agentDependencies } from '@credo-ts/node'
import {
  type WebVhDidCreateOptions,
  type WebVhDidLog,
  WebVhDidRecordMetadataKeys,
  WebVhDidRegistrar,
  WebVhDidResolver,
  type WebVhDidUpdateOptions,
  WebVhModule,
} from '@credo-ts/webvh'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import express from 'express'

const webVhModules = {
  webvh: new WebVhModule(),
  dids: new DidsModule({
    registrars: [new KeyDidRegistrar(), new PeerDidRegistrar(), new JwkDidRegistrar(), new WebVhDidRegistrar()],
    resolvers: [
      new KeyDidResolver(),
      new PeerDidResolver(),
      new JwkDidResolver(),
      new WebDidResolver(),
      new WebVhDidResolver(),
    ],
  }),
}
// end-section-1

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    ...webVhModules,
    askar: new AskarModule({
      askar: NativeAskar,
      store: { id: 'webvh-issuer', key: 'webvh-issuer', database: { type: 'sqlite', config: { inMemory: true } } },
    }),
  },
})
await agent.initialize()

// start-section-2
const { didState } = await agent.dids.create<WebVhDidCreateOptions>({
  method: 'webvh',
  domain: 'issuer.example.com',
})

if (didState.state !== 'finished') {
  throw new Error(`Creating the did failed: ${didState.state === 'failed' ? didState.reason : didState.state}`)
}
const did = didState.did
// end-section-2

// start-section-3
const app = express()

app.get('/.well-known/did.jsonl', async (_request, response) => {
  const [didRecord] = await agent.dids.getCreatedDids({ did })
  const log: WebVhDidLog | null = didRecord?.metadata.get(WebVhDidRecordMetadataKeys.DidLog)
  if (!log) {
    response.sendStatus(404)
    return
  }

  // One log entry per line
  response.type('text/jsonl').send(log.map((entry: unknown) => JSON.stringify(entry)).join('\n'))
})
// end-section-3

const server = app.listen(4085)

// start-section-4
const didDocument = await agent.dids.resolveDidDocument(did)
didDocument.service = [
  new DidDocumentService({
    id: `${did}#website`,
    type: 'LinkedDomains',
    serviceEndpoint: 'https://issuer.example.com',
  }),
]

const updateResult = await agent.dids.update<WebVhDidUpdateOptions>({ did, didDocument })
if (updateResult.didState.state !== 'finished') throw new Error('Updating the did failed')
// end-section-4

const published = await fetch('http://localhost:4085/.well-known/did.jsonl').then((response) => response.text())
console.log(did, published.split('\n').length)

server.close()
await agent.shutdown()
