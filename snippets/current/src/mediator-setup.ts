import {
  Agent,
  ConsoleLogger,
  HttpOutboundTransport,
  InitConfig,
  LogLevel,
  MediationStateChangedEvent,
  MediatorModule,
  RoutingEventTypes,
} from '@aries-framework/core'
import { IndySdkModule } from '@aries-framework/indy-sdk'
import { agentDependencies, HttpInboundTransport } from '@aries-framework/node'
import indySdk from 'indy-sdk'

async function run() {
  // start-section-1
  const name = 'mediator'
  const port = 3001

  const agentConfig: InitConfig = {
    label: `Aries Framework JavaScript ${name}`,
    walletConfig: {
      id: name,
      key: name,
    },
    endpoints: [`http://localhost:${port}`],
    logger: new ConsoleLogger(LogLevel.trace),
  }

  const mediator = new Agent({
    config: agentConfig,
    dependencies: agentDependencies,
    modules: {
      indySdk: new IndySdkModule({ indySdk }),
      MediatorModule: new MediatorModule({
        autoAcceptMediationRequests: true,
      }),
    },
  })

  mediator.registerOutboundTransport(new HttpOutboundTransport())
  mediator.registerInboundTransport(new HttpInboundTransport({ port }))

  await mediator.initialize()
  const mediatorOutOfBandRecord = await mediator.oob.createInvitation({
    multiUseInvitation: true,
    autoAcceptConnection: true,
  })

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
}

void run()
