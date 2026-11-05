# did:webvh

> Create, update and resolve did:webvh DIDs with @credo-ts/webvh, host the DID log, and use did:webvh as an AnonCreds registry.

[did:webvh](https://identity.foundation/didwebvh/) is hosted on your own web server, like `did:web`, but every version of the DID document is recorded in a signed log. Resolvers verify the whole log, so they can check the history of the DID and who changed it. `@credo-ts/webvh` creates and updates `did:webvh` DIDs and their log, resolves them, and provides an AnonCreds registry. You host the log yourself.

Use `did:webvh` instead of `did:web` when verifiers should be able to check how your DID document changed over time, or when you want to publish AnonCreds objects without a ledger.

## Install

```bash
npm install @credo-ts/webvh@^0.7.2
```

## Configure

Register `WebVhModule` and add the `did:webvh` registrar and resolver to `DidsModule`:

```ts
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
```

Spread these modules into the `modules` of your agent. `WebVhModule` has no options, and doesn't register the registrar and resolver with `DidsModule`. Your lists replace the default registrars and resolvers, see [Configure DID methods](https://credo.js.org/guides/dids-and-trust.md#configure-did-methods).

## Create a did:webvh

```ts
const { didState } = await agent.dids.create<WebVhDidCreateOptions>({
  method: 'webvh',
  domain: 'issuer.example.com',
})

if (didState.state !== 'finished') {
  throw new Error(`Creating the did failed: ${didState.state === 'failed' ? didState.reason : didState.state}`)
}
const did = didState.did
```

`domain`, and the optional `path`, go at the top level of the options. Credo creates an Ed25519 key that signs the log, and adds it to the DID document as a `Multikey` verification method for `authentication` and `assertionMethod`. The result is a DID such as `did:webvh:<scid>:issuer.example.com`, where the self-certifying identifier (SCID) is derived from the first log entry. With `path: 'issuers/acme'`, the DID ends in `issuer.example.com:issuers:acme`.

Credo stores the DID and its log in a `DidRecord`, and publishes nothing. An agent can have one `did:webvh` per domain and path.

## Host the DID log

Serve the log as JSON Lines, one entry per line, at:

- `https://<domain>/.well-known/did.jsonl` for a DID without a path.
- `https://<domain>/<path>/did.jsonl` for a DID with a path.

The log is in the metadata of the `DidRecord`. This Express route reads it on every request, so it always serves the latest version:

```ts
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
```

Resolvers fetch the log over HTTPS, verify every entry, and return the latest DID document. For a DID that your agent created, `agent.dids.resolve` returns the document from the `DidRecord`.

## Update a did:webvh

Resolve the document, change it, and pass the full new document to `update`:

```ts
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
```

Credo signs a new log entry with the update key and stores the new log. If you leave out `assertionMethod`, Credo keeps the one from the previous version. Deactivating a `did:webvh` isn't supported.

## DID-linked resources

A `did:webvh` can link resources, such as AnonCreds objects, at `<did>/resources/<resourceId>`. Resolve one with the API of the module, under the key you registered it with:

```ts
const result = await agent.modules.webvh.resolveResource(`${did}/resources/${resourceId}`)
```

Credo fetches the resource from `https://<domain>/resources/<resourceId>` (or under the path of the DID). The result has `content`, or `error` and `message` when the resource can't be resolved.

## AnonCreds registry

`WebVhAnonCredsRegistry` registers and resolves AnonCreds objects as resources of a `did:webvh`. Import it from the `@credo-ts/webvh/anoncreds` subpath. Set up AnonCreds as described in [AnonCreds](https://credo.js.org/guides/credential-formats/anoncreds.md), with the did:webvh registry:

```ts
import { AnonCredsModule } from '@credo-ts/anoncreds'
import { WebVhAnonCredsRegistry } from '@credo-ts/webvh/anoncreds'
import { NativeAnoncreds } from '@hyperledger/anoncreds-nodejs'

const anoncreds = new AnonCredsModule({
  anoncreds: NativeAnoncreds,
  registries: [new WebVhAnonCredsRegistry()],
})
```

Registering a schema, credential definition, revocation registry definition or status list publishes nothing. The result has the object id, `<did>/resources/<resourceId>`, and in `registrationMetadata.attestedResource` a resource signed with the DID's `assertionMethod` key. Store it, and serve it as JSON at `https://<domain>/resources/<resourceId>`, so others can resolve the object.
