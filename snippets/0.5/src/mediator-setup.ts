import { AskarModule } from '@credo-ts/askar'
import {
  Agent,
  ConnectionsModule,
  HttpOutboundTransport,
  InitConfig,
  MediationStateChangedEvent,
  MediatorModule,
  RoutingEventTypes,
} from '@credo-ts/core'
import { agentDependencies, HttpInboundTransport } from '@credo-ts/node'
import { askar } from '@openwallet-foundation/askar-nodejs'

// start-section-1
const name = 'mediator'
const port = 3001

const agentConfig: InitConfig = {
  label: `Credo ${name}`,
  walletConfig: {
    id: name,
    key: name,
  },
  endpoints: [`http://localhost:${port}`],
}

const mediator = new Agent({
  config: agentConfig,
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({ ariesAskar: askar }),
    mediator: new MediatorModule({
      autoAcceptMediationRequests: true,
    }),
    connections: new ConnectionsModule({
      autoAcceptConnections: true,
    }),
  },
})

mediator.registerOutboundTransport(new HttpOutboundTransport())
mediator.registerInboundTransport(new HttpInboundTransport({ port }))

await mediator.initialize()
const mediatorOutOfBandRecord = await mediator.oob.createInvitation({ multiUseInvitation: true })

const mediatorInvitationUrl = mediatorOutOfBandRecord.outOfBandInvitation.toUrl({
  domain: `http://localhost:${port}`,
})
console.log(mediatorInvitationUrl)
// end-section-1

mediator.events
  .observable<MediationStateChangedEvent>(RoutingEventTypes.MediationStateChanged)
  .subscribe(({ payload }) => {
    console.log(`${name} mediation state: ${payload.mediationRecord.state}`)
  })
