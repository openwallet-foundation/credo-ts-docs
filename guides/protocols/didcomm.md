# DIDComm

> Set up DIDComm messaging in Credo with the DidCommModule, choose protocols and transports, and listen for state changes.

DIDComm is a messaging protocol for agents that keep a long-lived, encrypted connection with each other. Once two agents are connected, either side can start a protocol over that connection: issue a credential, request a proof, or send a message. Credo implements DIDComm v1 and the Aries RFCs built on it in `@credo-ts/didcomm`. This page explains when to use DIDComm and how to set up the module.

## When to use DIDComm

Use DIDComm when the parties have an ongoing relationship, because the connection stays usable after the first exchange. It is also the only protocol Credo supports for [AnonCreds](https://credo.js.org/guides/credential-formats/anoncreds.md) credentials, and the one other Aries-based agents use.

For one-off issuance or verification, and for wallets built for the EU Digital Identity Wallet ecosystem, use [OpenID4VC](https://credo.js.org/guides/protocols/openid4vc.md) instead. An agent can register both modules.

| | DIDComm | OpenID4VC |
| --- | --- | --- |
| Relationship | A connection that either side can use at any time | One exchange per offer or request |
| Credential formats | AnonCreds, W3C VCs | SD-JWT VC, mdoc, W3C VCs |
| Mobile wallet | Needs a [mediator](https://credo.js.org/guides/protocols/didcomm/mediation.md) to receive messages | Calls the issuer and verifier over HTTPS |

[DIDs and DIDComm](https://credo.js.org/guides/concepts/did-and-didcomm.md) explains the concepts.

## Supported protocols

| Protocol | Aries RFC | API |
| --- | --- | --- |
| Out-of-band 1.1 | [0434](https://github.com/hyperledger/aries-rfcs/tree/main/features/0434-outofband) | `agent.didcomm.oob` |
| DID Exchange 1.1 | [0023](https://github.com/hyperledger/aries-rfcs/tree/main/features/0023-did-exchange) | `agent.didcomm.connections` |
| Connections 1.0 (deprecated) | [0160](https://github.com/hyperledger/aries-rfcs/tree/main/features/0160-connection-protocol) | `agent.didcomm.connections` |
| DID Rotate 1.0 | [0794](https://github.com/hyperledger/aries-rfcs/tree/main/features/0794-did-rotate) | `agent.didcomm.connections` |
| Trust Ping 1.0 | [0048](https://github.com/hyperledger/aries-rfcs/tree/main/features/0048-trust-ping) | `agent.didcomm.connections` |
| Issue Credential 2.0 | [0453](https://github.com/hyperledger/aries-rfcs/tree/main/features/0453-issue-credential-v2) | `agent.didcomm.credentials` |
| Issue Credential 1.0 (deprecated) | [0036](https://github.com/hyperledger/aries-rfcs/tree/main/features/0036-issue-credential) | `agent.didcomm.credentials`, with `DidCommCredentialV1Protocol` from `@credo-ts/anoncreds/didcomm` |
| Revocation Notification 1.0 and 2.0 | [0183](https://github.com/hyperledger/aries-rfcs/tree/main/features/0183-revocation-notification), [0721](https://github.com/hyperledger/aries-rfcs/tree/main/features/0721-revocation-notification-v2) | `agent.didcomm.credentials` |
| Present Proof 2.0 | [0454](https://github.com/hyperledger/aries-rfcs/tree/main/features/0454-present-proof-v2) | `agent.didcomm.proofs` |
| Present Proof 1.0 (deprecated) | [0037](https://github.com/hyperledger/aries-rfcs/tree/main/features/0037-present-proof) | `agent.didcomm.proofs`, with `DidCommProofV1Protocol` from `@credo-ts/anoncreds/didcomm` |
| Coordinate Mediation 1.0 | [0211](https://github.com/hyperledger/aries-rfcs/tree/main/features/0211-route-coordination) | `agent.didcomm.mediator`, `agent.didcomm.mediationRecipient` |
| Pickup 1.0 and 2.0 | [0212](https://github.com/hyperledger/aries-rfcs/tree/main/features/0212-pickup), [0685](https://github.com/hyperledger/aries-rfcs/tree/main/features/0685-pickup-v2) | `agent.didcomm.messagePickup` |
| Discover Features 1.0 and 2.0 | [0031](https://github.com/hyperledger/aries-rfcs/tree/main/features/0031-discover-features), [0557](https://github.com/hyperledger/aries-rfcs/tree/main/features/0557-discover-features-v2) | `agent.didcomm.discovery` |
| Basic Message 1.0 | [0095](https://github.com/hyperledger/aries-rfcs/tree/main/features/0095-basic-message) | `agent.didcomm.basicMessages` |
| Action Menu 1.0 | [0509](https://github.com/hyperledger/aries-rfcs/tree/main/features/0509-action-menu) | `@credo-ts/action-menu` |
| Question Answer 1.0 | [0113](https://github.com/hyperledger/aries-rfcs/tree/main/features/0113-question-answer) | `@credo-ts/question-answer` |
| DIDComm RPC 1.0 | [0804](https://github.com/hyperledger/aries-rfcs/tree/main/features/0804-didcomm-rpc) | `@credo-ts/drpc` |

Use DID Exchange and the 2.0 protocols. The deprecated protocols are removed in Credo 0.8, so only use them for agents that support nothing else. Credo doesn't implement DIDComm v2.

## Install

```bash
npm install @credo-ts/didcomm@^0.7.2
```

On Node.js the inbound transports come from `@credo-ts/node`, which you install when you [set up the agent](https://credo.js.org/guides/getting-started/installation.md).

## Configure the module

Register a `DidCommModule` under the key `didcomm`. Credo only exposes the API as `agent.didcomm` under that key. Under any other key it is available as `agent.modules.<key>`.

**Node.js**

A server agent listens for incoming messages and advertises the URLs where other agents reach it.

```ts
import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import {
  DidCommConnectionEventTypes,
  type DidCommConnectionStateChangedEvent,
  DidCommDidExchangeState,
  DidCommHttpOutboundTransport,
  DidCommModule,
  DidCommWsOutboundTransport,
} from '@credo-ts/didcomm'
import { DrizzleStorageModule } from '@credo-ts/drizzle-storage'
import { didcommBundle } from '@credo-ts/drizzle-storage/didcomm'
import { agentDependencies, DidCommHttpInboundTransport, DidCommWsInboundTransport } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import { drizzle } from 'drizzle-orm/libsql'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    // Drizzle stores the records. Run its migrations before you start the agent.
    storage: new DrizzleStorageModule({ database: drizzle('file:agent.db'), bundles: [didcommBundle] }),
    // Askar stores the keys: DIDComm needs its XSalsa20-Poly1305 support
    askar: new AskarModule({
      askar: NativeAskar,
      enableStorage: false,
      store: { id: 'acme-agent-keys', key: 'acme-agent-store-key' },
    }),
    didcomm: new DidCommModule({
      // The public URLs other agents use to reach this agent, in order of preference
      endpoints: ['http://localhost:4040', 'ws://localhost:4041'],
      transports: {
        inbound: [new DidCommHttpInboundTransport({ port: 4040 }), new DidCommWsInboundTransport({ port: 4041 })],
        outbound: [new DidCommHttpOutboundTransport(), new DidCommWsOutboundTransport()],
      },
      connections: { autoAcceptConnections: true },
    }),
  },
})

await agent.initialize()
```

**React Native**

A mobile agent has no public address, so it only sends messages and receives them through a [mediator](https://credo.js.org/guides/protocols/didcomm/mediation.md).

```ts
import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import {
  DidCommHttpOutboundTransport,
  DidCommMediatorPickupStrategy,
  DidCommModule,
  DidCommWsOutboundTransport,
} from '@credo-ts/didcomm'
import { agentDependencies } from '@credo-ts/react-native'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'

// The invitation URL your mediator hands out
const mediatorInvitationUrl = 'https://mediator.example.com/invite?oob=eyJ...'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      store: { id: 'wallet', key: 'wallet-key' },
    }),
    didcomm: new DidCommModule({
      // No endpoints and no inbound transports: messages reach the wallet through the mediator
      transports: {
        outbound: [new DidCommWsOutboundTransport(), new DidCommHttpOutboundTransport()],
      },
      mediationRecipient: {
        mediatorInvitationUrl,
        mediatorPickupStrategy: DidCommMediatorPickupStrategy.PickUpV2LiveMode,
      },
      // A wallet doesn't act as a mediator
      mediator: false,
    }),
  },
})

await agent.initialize()
```

The Node.js example stores records with [Drizzle](https://credo.js.org/guides/agent-setup/storage/drizzle.md), which also explains the packages and migrations it needs, and keys with Askar. DIDComm needs Askar, or another key management backend with XSalsa20-Poly1305, for its keys. See [Storage](https://credo.js.org/guides/agent-setup/storage.md) for the options.

### Endpoints and transports

`endpoints` lists the public URLs that go into your invitations and DID documents, in order of preference. Behind a reverse proxy, use the public URL (for example `https://agent.example.com/didcomm`), not the local port. An agent without endpoints can only receive messages through a mediator, or over a WebSocket it opened itself.

| Transport | Package | Platforms |
| --- | --- | --- |
| `DidCommHttpOutboundTransport` | `@credo-ts/didcomm` | Node.js, React Native |
| `DidCommWsOutboundTransport` | `@credo-ts/didcomm` | Node.js, React Native |
| `DidCommHttpInboundTransport` | `@credo-ts/node` | Node.js |
| `DidCommWsInboundTransport` | `@credo-ts/node` | Node.js |

`DidCommHttpInboundTransport` takes a `port` and an optional `path`. Pass `app` instead of `port` to mount it on an Express app you start yourself. `DidCommWsInboundTransport` takes a `port`, or a `server` (a `WebSocketServer` from `ws`). To serve HTTP and WebSocket on one port, give the WebSocket server `noServer: true` and forward the HTTP server's `upgrade` events to it, as the [sample mediator](https://github.com/openwallet-foundation/credo-ts/blob/main/samples/mediator.ts) does.

### Protocols

The connection, out-of-band and discover features protocols are always on. The other protocols are on by default. Pass `false` to turn one off, which also removes its API from `agent.didcomm`, or pass an object to configure it.

| Option | Configures | Details |
| --- | --- | --- |
| `connections` | Connections and DID Exchange | [Connections](https://credo.js.org/guides/protocols/didcomm/connections.md) |
| `credentials` | Issue Credential 2.0 | [Issuing credentials](https://credo.js.org/guides/protocols/didcomm/issue-credential.md) |
| `proofs` | Present Proof 2.0 | [Requesting proofs](https://credo.js.org/guides/protocols/didcomm/present-proof.md) |
| `mediator` | Acting as a mediator | [Mediation](https://credo.js.org/guides/protocols/didcomm/mediation.md) |
| `mediationRecipient` | Using a mediator | [Mediation](https://credo.js.org/guides/protocols/didcomm/mediation.md) |
| `messagePickup` | Pickup 1.0 and 2.0 | [Mediation](https://credo.js.org/guides/protocols/didcomm/mediation.md) |
| `basicMessages` | Basic messages | [Messaging](https://credo.js.org/guides/protocols/didcomm/messaging.md) |

:::warning
By default, `credentials` and `proofs` register the 2.0 protocols without any credential formats, so the agent can't issue or verify anything. Configure the formats you need as described in [Issuing credentials](https://credo.js.org/guides/protocols/didcomm/issue-credential.md) and [Requesting proofs](https://credo.js.org/guides/protocols/didcomm/present-proof.md).
:::

### Other options

| Option | Default | Description |
| --- | --- | --- |
| `processDidCommMessagesConcurrently` | `false` | Process incoming messages in parallel instead of one at a time. |
| `queueTransportRepository` | in memory | Where messages for agents without an endpoint wait until they are picked up. Mediators need a persistent queue. |
| `didCommMimeType` | `DidCommMimeType.V1` | Content type for sent messages. `DidCommMimeType.V0` (`application/ssi-agent-wire`) is for older agents. |
| `useDidKeyInProtocols` | `true` | Encode keys as `did:key` in protocol messages (RFC 0360). |
| `useDidSovPrefixWhereAllowed` | `false` | Use the legacy `did:sov:BzCbsNYhMrjHiqZDTUASHg;spec` message type prefix for older agents. |

## Events

Credo emits an event for every state change, such as a connection being completed or a message arriving. Listen with `agent.events.on()`, and remove the listener with `agent.events.off()`. `agent.events.observable()` returns the same events as an RxJS observable.

```ts
agent.events.on<DidCommConnectionStateChangedEvent>(
  DidCommConnectionEventTypes.DidCommConnectionStateChanged,
  ({ payload }) => {
    const { connectionRecord, previousState } = payload
    console.log(`Connection ${connectionRecord.id}: ${previousState} -> ${connectionRecord.state}`)

    if (connectionRecord.state === DidCommDidExchangeState.Completed) {
      console.log(`Connected with ${connectionRecord.theirLabel}`)
    }
  }
)
```

The event type enums and payload types are exported from `@credo-ts/didcomm`.

| Event type | Payload |
| --- | --- |
| `DidCommConnectionEventTypes.DidCommConnectionStateChanged` | `connectionRecord`, `previousState` |
| `DidCommOutOfBandEventTypes.OutOfBandStateChanged` | `outOfBandRecord`, `previousState` |
| `DidCommCredentialEventTypes.DidCommCredentialStateChanged` | `credentialExchangeRecord`, `previousState` |
| `DidCommProofEventTypes.ProofStateChanged` | `proofRecord`, `previousState` |
| `DidCommBasicMessageEventTypes.DidCommBasicMessageStateChanged` | `basicMessageRecord`, `message` |
| `DidCommRoutingEventTypes.MediationStateChanged` | `mediationRecord`, `previousState` |

Each event also has `metadata.contextCorrelationId`, which tells you which tenant it belongs to when you use [multi-tenancy](https://credo.js.org/guides/agent-setup/multi-tenancy.md).

- [Connections](https://credo.js.org/guides/protocols/didcomm/connections.md): Create and accept out-of-band invitations, connect agents with DID Exchange, reuse connections and track connection state in Credo.
- [Issuing credentials](https://credo.js.org/guides/protocols/didcomm/issue-credential.md): Issue credentials over DIDComm with the Issue Credential v2 protocol, register credential formats and handle offers, requests and auto-accept.
- [Requesting proofs](https://credo.js.org/guides/protocols/didcomm/present-proof.md): Request and verify presentations over DIDComm with the Present Proof v2 protocol, using AnonCreds or DIF Presentation Exchange.
- [Mediation](https://credo.js.org/guides/protocols/didcomm/mediation.md): Run a DIDComm mediator with Credo and connect mobile agents to it, with message pickup, live delivery and keylist updates.
- [Messaging and other protocols](https://credo.js.org/guides/protocols/didcomm/messaging.md): Send basic messages over a DIDComm connection, and add the action menu, question answer and DIDComm RPC protocols to a Credo agent.
- [AnonCreds with DIDComm](https://credo.js.org/guides/protocols/didcomm/anoncreds.md): Issue AnonCreds credentials and request proofs with predicates over DIDComm, and handle revocation.
- [W3C VCs with DIDComm](https://credo.js.org/guides/protocols/didcomm/w3c.md): Issue W3C Verifiable Credentials over DIDComm as JSON-LD, Data Integrity or VCDM 2.0 SD-JWT credentials, and present them with DIF Presentation Exchange.
