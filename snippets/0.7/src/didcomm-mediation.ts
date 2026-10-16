// start-section-1
import { AskarModule } from '@credo-ts/askar'
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
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

const mediator = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      store: { id: 'mediator', key: 'mediator-key' },
    }),
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
// end-section-1

// start-section-2
const alice = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      store: { id: 'alice', key: 'alice-key' },
    }),
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
// end-section-2

// start-section-3
alice.events.on<DidCommKeylistUpdatedEvent>(DidCommRoutingEventTypes.RecipientKeylistUpdated, ({ payload }) => {
  for (const update of payload.keylist) {
    console.log(`Mediator keylist update: ${update.action} ${update.recipientKey}`)
  }
})
// end-section-3

const bob = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      store: { id: 'bob', key: 'bob-key' },
    }),
    didcomm: new DidCommModule({
      endpoints: ['http://localhost:4042'],
      transports: {
        inbound: [new DidCommHttpInboundTransport({ port: 4042 })],
        outbound: [new DidCommHttpOutboundTransport()],
      },
      connections: { autoAcceptConnections: true },
    }),
  },
})
await bob.initialize()

const aliceReceivedMessage = new Promise<string>((resolve) => {
  alice.events.on<DidCommBasicMessageStateChangedEvent>(
    DidCommBasicMessageEventTypes.DidCommBasicMessageStateChanged,
    ({ payload }) => {
      if (payload.basicMessageRecord.role === DidCommBasicMessageRole.Receiver) resolve(payload.message.content)
    }
  )
})

// start-section-4
// The invitation points to the mediator's endpoint and routing keys
const outOfBandRecord = await alice.didcomm.oob.createInvitation({ label: 'Alice' })
const invitationUrl = outOfBandRecord.outOfBandInvitation.toUrl({ domain: 'https://alice.example.com' })
// end-section-4

const { connectionRecord } = await bob.didcomm.oob.receiveInvitationFromUrl(invitationUrl, { label: 'Bob' })
if (!connectionRecord) throw new Error('The invitation has no handshake protocols')
const bobToAlice = await bob.didcomm.connections.returnWhenIsConnected(connectionRecord.id)
const [aliceToBob] = await alice.didcomm.connections.findAllByOutOfBandId(outOfBandRecord.id)
await alice.didcomm.connections.returnWhenIsConnected(aliceToBob.id)

// start-section-5
// For example when the app goes to the background
await alice.didcomm.mediationRecipient.stopMessagePickup()

// Back in the foreground: picks up queued messages, then resumes live delivery
await alice.didcomm.mediationRecipient.initiateMessagePickup()
// end-section-5

await bob.didcomm.basicMessages.sendMessage(bobToAlice.id, 'Hello Alice, this went through your mediator')
console.log(`Alice received: ${await aliceReceivedMessage}`)

// start-section-6
const mediatorConnection = await alice.didcomm.mediationRecipient.findDefaultMediatorConnection()
if (mediatorConnection) {
  await alice.didcomm.messagePickup.pickupMessages({
    connectionId: mediatorConnection.id,
    protocolVersion: 'v2',
    awaitCompletion: true,
  })
}
// end-section-6

await alice.shutdown()
await bob.shutdown()
await mediator.shutdown()
