# Mediation

> Run a DIDComm mediator with Credo and connect mobile agents to it, with message pickup, live delivery and keylist updates.

A mediator is an agent that receives messages on behalf of agents that can't be reached directly, and holds them until they are picked up. This page covers running a mediator, connecting an agent to it as a recipient, choosing a pickup strategy, and how routing keys stay in sync.

## When you need a mediator

An agent needs a mediator when other agents can't reach it. A mobile wallet always needs one when it uses DIDComm: a phone has no public address, and the app is often closed. A server agent with public `endpoints` doesn't need one.

A wallet with a mediator puts the mediator's endpoint and routing key in its invitations and DID documents. Senders wrap their messages in a forward message to the mediator, and the mediator delivers them to the wallet over a WebSocket, or queues them until the wallet picks them up.

```mermaid
sequenceDiagram
    participant Alice as Alice (wallet)
    participant Mediator
    participant Bob
    Alice->>Mediator: Request mediation
    Mediator->>Alice: Grant (endpoint, routing key)
    Alice->>Mediator: Keylist update (add key)
    Alice-->>Bob: Invitation with the mediator's endpoint
    Bob->>Mediator: Forward message for Alice
    Mediator->>Alice: Deliver over WebSocket, or queue for pickup
```

Credo implements [Coordinate Mediation 1.0](https://github.com/hyperledger/aries-rfcs/tree/main/features/0211-route-coordination) and message pickup ([Pickup 1.0](https://github.com/hyperledger/aries-rfcs/tree/main/features/0212-pickup) and [2.0](https://github.com/hyperledger/aries-rfcs/tree/main/features/0685-pickup-v2)) for both roles. Messages from a wallet to other agents don't go through its mediator.

## Run a mediator

A mediator is a Node.js agent with the `mediator` protocol turned on. It needs an HTTP endpoint for senders and a WebSocket endpoint so wallets can receive messages live.

```ts
import { Agent } from '@credo-ts/core'
import {
  DidCommBasicMessageEventTypes,
  DidCommBasicMessageRole,
  type DidCommBasicMessageStateChangedEvent,
  DidCommHttpOutboundTransport,
  type DidCommKeylistUpdatedEvent,
  DidCommMediatorPickupStrategy,
  DidCommModule,
  DidCommRoutingEventTypes,
  DidCommWsOutboundTransport,
} from '@credo-ts/didcomm'
import { agentDependencies, DidCommHttpInboundTransport, DidCommWsInboundTransport } from '@credo-ts/node'

const mediator = new Agent({
  dependencies: agentDependencies,
  modules: {
    ...mediatorStorage, // Storage and key management, see Agent setup
    didcomm: new DidCommModule({
      endpoints: ['http://localhost:4040', 'ws://localhost:4041'],
      transports: {
        inbound: [new DidCommHttpInboundTransport({ port: 4040 }), new DidCommWsInboundTransport({ port: 4041 })],
        outbound: [new DidCommHttpOutboundTransport(), new DidCommWsOutboundTransport()],
      },
      connections: { autoAcceptConnections: true },
      mediator: { autoAcceptMediationRequests: true },
      // A mediator only routes messages, so it doesn't need the other protocols
      mediationRecipient: false,
      credentials: false,
      proofs: false,
      basicMessages: false,
    }),
  },
})

await mediator.initialize()

const mediatorOutOfBandRecord = await mediator.didcomm.oob.createInvitation({
  label: 'Mediator',
  multiUseInvitation: true,
})
const mediatorInvitationUrl = mediatorOutOfBandRecord.outOfBandInvitation.toUrl({
  domain: 'http://localhost:4040/invite',
})
```

The mediator shares one multi-use invitation with all wallets. Without `autoAcceptMediationRequests`, listen for `DidCommRoutingEventTypes.MediationStateChanged` and grant requests in the `requested` state with `agent.didcomm.mediator.grantRequestedMediation(mediationRecordId)`.

| Option | Default | Description |
| --- | --- | --- |
| `mediator.autoAcceptMediationRequests` | `false` | Grant every mediation request. |
| `mediator.messageForwardingStrategy` | `DirectDelivery` | `DirectDelivery` sends a forwarded message right away over an open session with the recipient, and queues it if that isn't possible. `QueueOnly` always queues. `QueueAndLiveModeDelivery` queues, then delivers the queue to recipients in live mode. |
| `messagePickup.maximumBatchSize` | `10` | Maximum number of messages per pickup batch. |
| `queueTransportRepository` | in memory | Where queued messages are stored. Pass a persistent implementation in production, or messages are lost on restart. |

For production, look at [DIDComm Mediator Credo](https://github.com/openwallet-foundation/didcomm-mediator-credo), a mediator built on Credo with a persistent message queue and a Docker image.

## Connect to a mediator

On the recipient, set `mediatorInvitationUrl` in the `mediationRecipient` options:

**Node.js**

```ts
const alice = new Agent({
  dependencies: agentDependencies,
  modules: {
    ...aliceStorage, // Storage and key management, see Agent setup
    didcomm: new DidCommModule({
      transports: {
        outbound: [new DidCommWsOutboundTransport(), new DidCommHttpOutboundTransport()],
      },
      connections: { autoAcceptConnections: true },
      mediationRecipient: {
        mediatorInvitationUrl,
        mediatorPickupStrategy: DidCommMediatorPickupStrategy.PickUpV2LiveMode,
      },
      mediator: false,
    }),
  },
})

// Connects to the mediator, requests mediation and starts message pickup
await alice.initialize()
```

**React Native**

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

`DidCommMediatorPickupStrategy` is exported from `@credo-ts/didcomm`. [Pickup strategies](#pickup-strategies) explains the options.

During `initialize()`, Credo connects to the mediator if it isn't connected yet, requests mediation, waits for the grant and sets the mediator as the default. Then it starts picking up messages. Startup therefore depends on the mediator being reachable. To keep startup independent, leave out `mediatorInvitationUrl` and connect later with the API:

| Method on `agent.didcomm.mediationRecipient` | Description |
| --- | --- |
| `provision(connection)` | Request mediation over a connection, wait for the grant, and set the mediator as default. |
| `initiateMessagePickup(mediator?, strategy?)` | Start picking up messages, from the default mediator unless you pass a mediation record. |
| `stopMessagePickup()` | Stop all message pickup. |
| `findDefaultMediator()` | Get the mediation record of the default mediator. |
| `setDefaultMediator(mediationRecord)` | Change the default mediator. |

Once a default mediator is set, new invitations and connections route through it without extra code:

```ts
// The invitation points to the mediator's endpoint and routing keys
const outOfBandRecord = await alice.didcomm.oob.createInvitation({ label: 'Alice' })
const invitationUrl = outOfBandRecord.outOfBandInvitation.toUrl({ domain: 'https://alice.example.com' })
```

To use another mediator for one connection, create routing with `agent.didcomm.mediationRecipient.getRouting({ mediatorId })` and pass it as `routing` to `createInvitation()` or `receiveInvitation()`.

## Pickup strategies

`mediatorPickupStrategy` decides how the recipient gets its messages:

| Strategy | How it works |
| --- | --- |
| `PickUpV2LiveMode` | Opens a WebSocket, picks up queued messages, then asks the mediator to push new messages as they arrive (Pickup 2.0 live mode). |
| `PickUpV2` | Polls with Pickup 2.0 every `mediatorPollingInterval` milliseconds. |
| `PickUpV1` | Polls with Pickup 1.0 every `mediatorPollingInterval` milliseconds. |
| `Implicit` | Opens a WebSocket and keeps it open, so the mediator can send messages over it. |
| `None` | Doesn't pick up messages automatically. |

For a mobile wallet, use `PickUpV2LiveMode`: messages arrive as soon as the mediator receives them, and Credo reopens the WebSocket when it drops. It needs a WebSocket endpoint on the mediator and `DidCommWsOutboundTransport` on the wallet. Use `PickUpV2` if the mediator has no WebSocket endpoint, and `Implicit` for mediators that don't support a pickup protocol.

Without a strategy, Credo asks the mediator which pickup protocols it supports and uses `PickUpV2`, `PickUpV1` or `Implicit`, in that order. It never chooses live mode on its own. Credo stores the choice on the mediation record, and the stored choice wins over `mediatorPickupStrategy` from then on, so set the strategy before the agent first connects to the mediator.

| Option | Default | Description |
| --- | --- | --- |
| `mediatorPollingInterval` | `5000` | Milliseconds between polls for `PickUpV1` and `PickUpV2`. |
| `maximumMessagePickup` | `10` | Messages per batch when polling. |
| `baseMediatorReconnectionIntervalMs` | `100` | First delay before reconnecting a closed WebSocket. It doubles after each attempt. |
| `maximumMediatorReconnectionIntervalMs` | no limit | Longest delay between reconnection attempts. |

## Control message pickup

A mobile app usually stops pickup when it goes to the background and starts it again when it returns:

```ts
// For example when the app goes to the background
await alice.didcomm.mediationRecipient.stopMessagePickup()

// Back in the foreground: picks up queued messages, then resumes live delivery
await alice.didcomm.mediationRecipient.initiateMessagePickup()
```

If you'd rather decide when pickup runs, set `mediatorPickupStrategy: DidCommMediatorPickupStrategy.None` and pass the strategy when you start it: `initiateMessagePickup(undefined, DidCommMediatorPickupStrategy.PickUpV2LiveMode)`.

To fetch queued messages once, for example in a background task, use the message pickup API and wait until the messages are processed:

```ts
const mediatorConnection = await alice.didcomm.mediationRecipient.findDefaultMediatorConnection()
if (mediatorConnection) {
  await alice.didcomm.messagePickup.pickupMessages({
    connectionId: mediatorConnection.id,
    protocolVersion: 'v2',
    awaitCompletion: true,
  })
}
```

## Keylist updates

The mediator only forwards messages for keys in the recipient's keylist. Credo keeps the keylist up to date: every time it creates routing through a mediator, for a new invitation, connection or DID rotation, it adds the new key and waits for the mediator to confirm. Deleting a connection with `connections.deleteById()`, or with `connections.hangup({ connectionId, deleteAfterHangup: true })`, removes its keys again. After a DID rotation, `connections.removePreviousDids({ connectionId })` removes the old keys.

Each confirmed update emits an event:

```ts
alice.events.on<DidCommKeylistUpdatedEvent>(DidCommRoutingEventTypes.RecipientKeylistUpdated, ({ payload }) => {
  for (const update of payload.keylist) {
    console.log(`Mediator keylist update: ${update.action} ${update.recipientKey}`)
  }
})
```

For keys created outside of Credo's routing, send the update yourself with `agent.didcomm.mediationRecipient.notifyKeylistUpdate(connection, verkey, action)`.
