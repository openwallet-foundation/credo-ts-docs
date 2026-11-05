import { didcommBundle } from '@credo-ts/drizzle-storage/didcomm'
import { exampleStorageWithAskarKeys } from './example-storage.js'

type ExampleStorage = Awaited<ReturnType<typeof exampleStorageWithAskarKeys>>
const acmeStorage = await exampleStorageWithAskarKeys([didcommBundle])
const bobStorage = await exampleStorageWithAskarKeys([didcommBundle])

// start-section-1
import { Agent } from '@credo-ts/core'
import {
  DidCommConnectionEventTypes,
  type DidCommConnectionStateChangedEvent,
  DidCommDidExchangeState,
  DidCommHttpOutboundTransport,
  DidCommModule,
} from '@credo-ts/didcomm'
import { agentDependencies, DidCommHttpInboundTransport } from '@credo-ts/node'

function createAgent(port: number, storage: ExampleStorage) {
  return new Agent({
    dependencies: agentDependencies,
    modules: {
      ...storage, // Storage and key management, see Agent setup
      didcomm: new DidCommModule({
        endpoints: [`http://localhost:${port}`],
        transports: {
          inbound: [new DidCommHttpInboundTransport({ port })],
          outbound: [new DidCommHttpOutboundTransport()],
        },
        connections: { autoAcceptConnections: true },
      }),
    },
  })
}

const acme = createAgent(4042, acmeStorage)
const bob = createAgent(4043, bobStorage)
await acme.initialize()
await bob.initialize()
// end-section-1

const carol = createAgent(4044, await exampleStorageWithAskarKeys([didcommBundle]))
const dave = createAgent(4046, await exampleStorageWithAskarKeys([didcommBundle]))
await carol.initialize()
await dave.initialize()

// start-section-2
const outOfBandRecord = await acme.didcomm.oob.createInvitation({ label: 'Acme' })
const invitationUrl = outOfBandRecord.outOfBandInvitation.toUrl({ domain: 'https://acme.example.com/invite' })
// end-section-2

// start-section-3
acme.events.on<DidCommConnectionStateChangedEvent>(
  DidCommConnectionEventTypes.DidCommConnectionStateChanged,
  ({ payload: { connectionRecord } }) => {
    if (connectionRecord.outOfBandId !== outOfBandRecord.id) return

    if (connectionRecord.state === DidCommDidExchangeState.Completed) {
      console.log(`Acme is connected with ${connectionRecord.theirLabel}`)
    }
  }
)
// end-section-3

// start-section-4
const invitation = await bob.didcomm.oob.parseInvitation(invitationUrl)
console.log(`Bob received an invitation from ${invitation.label}`)

const { connectionRecord } = await bob.didcomm.oob.receiveInvitation(invitation, { label: 'Bob' })
if (!connectionRecord) throw new Error('The invitation has no handshake protocols')

const bobToAcme = await bob.didcomm.connections.returnWhenIsConnected(connectionRecord.id)
// end-section-4
console.log(`Bob is connected with ${bobToAcme.theirLabel}`)

// start-section-5
const [acmeToBob] = await acme.didcomm.connections.findAllByOutOfBandId(outOfBandRecord.id)
await acme.didcomm.connections.returnWhenIsConnected(acmeToBob.id)
// end-section-5

// start-section-6
const multiUseRecord = await acme.didcomm.oob.createInvitation({ label: 'Acme', multiUseInvitation: true })
const multiUseUrl = multiUseRecord.outOfBandInvitation.toUrl({ domain: 'https://acme.example.com/invite' })
// end-section-6

async function connectTo(invitee: ReturnType<typeof createAgent>, url: string, label: string) {
  const { connectionRecord } = await invitee.didcomm.oob.receiveInvitationFromUrl(url, { label })
  if (!connectionRecord) throw new Error('The invitation has no handshake protocols')
  return invitee.didcomm.connections.returnWhenIsConnected(connectionRecord.id)
}

await connectTo(carol, multiUseUrl, 'Carol')
await connectTo(dave, multiUseUrl, 'Dave')

// start-section-7
const multiUseConnections = await acme.didcomm.connections.findAllByOutOfBandId(multiUseRecord.id)
console.log(`The multi-use invitation created ${multiUseConnections.length} connections`)
// end-section-7

for (const connection of multiUseConnections) await acme.didcomm.connections.returnWhenIsConnected(connection.id)

for (const agent of [acme, bob, carol, dave]) await agent.shutdown()
