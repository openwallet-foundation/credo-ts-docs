// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import {
  DidCommConnectionEventTypes,
  type DidCommConnectionStateChangedEvent,
  DidCommDidExchangeState,
  DidCommHttpOutboundTransport,
  DidCommModule,
} from '@credo-ts/didcomm'
import { agentDependencies, DidCommHttpInboundTransport } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

function createAgent(name: string, port: number) {
  return new Agent({
    dependencies: agentDependencies,
    modules: {
      askar: new AskarModule({
        askar: NativeAskar,
        store: { id: name, key: `${name}-key` },
      }),
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

const acme = createAgent('acme', 4042)
const bob = createAgent('bob', 4043)
await acme.initialize()
await bob.initialize()
// end-section-1

const carol = createAgent('carol', 4044)
const dave = createAgent('dave', 4046)
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
