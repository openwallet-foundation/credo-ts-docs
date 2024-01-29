import {
  Agent,
  ConnectionsModule,
  HttpOutboundTransport,
  InitConfig,
  MediationStateChangedEvent,
  MediatorModule,
  RoutingEventTypes,
} from '@aries-framework/core'
import { IndySdkModule } from '@aries-framework/indy-sdk'
import { HttpInboundTransport, agentDependencies } from '@aries-framework/node'
import indySdk from 'indy-sdk'

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
    indySdk: new IndySdkModule({ indySdk }),
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

const mediatiorInvitationUrl = mediatorOutOfBandRecord.outOfBandInvitation.toUrl({
  domain: `http://localhost:${port}`,
})
console.log(mediatiorInvitationUrl)
// end-section-1

mediator.events
  .observable<MediationStateChangedEvent>(RoutingEventTypes.MediationStateChanged)
  .subscribe(({ payload }) => {
    console.log(`${name} mediation state: ${payload.mediationRecord.state}`)
  })
