import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import {
  DidCommConnectionEventTypes,
  type DidCommConnectionStateChangedEvent,
  DidCommDidExchangeState,
  type DidCommHandshakeReusedEvent,
  DidCommHttpOutboundTransport,
  DidCommModule,
  DidCommOutOfBandEventTypes,
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

// start-section-1
// A DID that Acme created, with a DIDComm service in its DID document
const publicDid = 'did:web:acme.example.com'

const outOfBandRecord = await acme.didcomm.oob.createInvitation({ label: 'Acme', invitationDid: publicDid })
const invitationUrl = outOfBandRecord.outOfBandInvitation.toUrl({ domain: 'https://acme.example.com/invite' })
// end-section-1

// start-section-2
acme.events.on<DidCommHandshakeReusedEvent>(DidCommOutOfBandEventTypes.HandshakeReused, ({ payload }) => {
  console.log(`${payload.connectionRecord.theirLabel} reused connection ${payload.connectionRecord.id}`)
})
// end-section-2

// start-section-3
const { connectionRecord } = await bob.didcomm.oob.receiveInvitationFromUrl(invitationUrl, {
  label: 'Bob',
  reuseConnection: true,
})
// end-section-3
console.log(`Bob uses connection ${connectionRecord?.id}`)

// start-section-4
acme.events.on<DidCommConnectionStateChangedEvent>(
  DidCommConnectionEventTypes.DidCommConnectionStateChanged,
  async ({ payload: { connectionRecord } }) => {
    if (connectionRecord.state !== DidCommDidExchangeState.RequestReceived) return
    // Requests from implicit invitations, or from invitations created with autoAcceptConnection: false
    if (connectionRecord.autoAcceptConnection) return

    await acme.didcomm.connections.acceptRequest(connectionRecord.id)
  }
)
// end-section-4

// start-section-5
const { connectionRecord: bobToAcme } = await bob.didcomm.oob.receiveImplicitInvitation({
  did: publicDid,
  label: 'Bob',
})
// end-section-5
if (bobToAcme) await bob.didcomm.connections.returnWhenIsConnected(bobToAcme.id)

await acme.shutdown()
await bob.shutdown()
