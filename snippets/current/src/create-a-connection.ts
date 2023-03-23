import { AskarModule } from '@aries-framework/askar'
import {
  Agent,
  InitConfig,
  ConnectionEventTypes,
  ConnectionStateChangedEvent,
  WsOutboundTransport,
  HttpOutboundTransport,
  DidExchangeState,
  OutOfBandRecord,
} from '@aries-framework/core'
import { agentDependencies, HttpInboundTransport } from '@aries-framework/node'
import { ariesAskar } from '@hyperledger/aries-askar-nodejs'

// start-section-1
const initializeBobAgent = async () => {
  // Simple agent configuration. This sets some basic fields like the wallet
  // configuration and the label. It also sets the mediator invitation url,
  // because this is most likely required in a mobile environment.
  const config: InitConfig = {
    label: 'demo-agent-bob',
    walletConfig: {
      id: 'mainBob',
      key: 'demoagentbob00000000000000000000',
    },
    autoAcceptConnections: true,
  }

  // A new instance of an agent is created here
  // Askar can also be replaced by the indy-sdk if required
  const agent = new Agent({
    config,
    modules: { askar: new AskarModule({ ariesAskar }) },
    dependencies: agentDependencies,
  })

  // Register a simple `WebSocket` outbound transport
  agent.registerOutboundTransport(new WsOutboundTransport())

  // Register a simple `Http` outbound transport
  agent.registerOutboundTransport(new HttpOutboundTransport())

  // Initialize the agent
  await agent.initialize()

  return agent
}
// end-section-1

// start-section-2
const initializeAcmeAgent = async () => {
  // Simple agent configuration. This sets some basic fields like the wallet
  // configuration and the label.
  const config: InitConfig = {
    label: 'demo-agent-acme',
    walletConfig: {
      id: 'mainAcme',
      key: 'demoagentacme0000000000000000000',
    },
    autoAcceptConnections: true,
    endpoints: ['http://localhost:3001'],
  }

  // A new instance of an agent is created here
  // Askar can also be replaced by the indy-sdk if required
  const agent = new Agent({
    config,
    modules: { askar: new AskarModule({ ariesAskar }) },
    dependencies: agentDependencies,
  })

  // Register a simple `WebSocket` outbound transport
  agent.registerOutboundTransport(new WsOutboundTransport())

  // Register a simple `Http` outbound transport
  agent.registerOutboundTransport(new HttpOutboundTransport())

  // Register a simple `Http` inbound transport
  agent.registerInboundTransport(new HttpInboundTransport({ port: 3001 }))

  // Initialize the agent
  await agent.initialize()

  return agent
}
// end-section-2

// start-section-3
const createNewInvitation = async (agent: Agent) => {
  const outOfBandRecord = await agent.oob.createInvitation()

  return {
    invitationUrl: outOfBandRecord.outOfBandInvitation.toUrl({ domain: 'https://example.org' }),
    outOfBandRecord,
  }
}
// end-section-3

// start-section-4
const createLegacyInvitation = async (agent: Agent) => {
  const { invitation } = await agent.oob.createLegacyInvitation()

  return invitation.toUrl({ domain: 'https://example.org' })
}
// end-section-4

// start-section-5
const receiveInvitation = async (agent: Agent, invitationUrl: string) => {
  const { outOfBandRecord } = await agent.oob.receiveInvitationFromUrl(invitationUrl)

  return outOfBandRecord
}
// end-section-5

// start-section-6
const setupConnectionListener = (agent: Agent, outOfBandRecord: OutOfBandRecord, cb: (...args: any) => void) => {
  agent.events.on<ConnectionStateChangedEvent>(ConnectionEventTypes.ConnectionStateChanged, ({ payload }) => {
    if (payload.connectionRecord.outOfBandId !== outOfBandRecord.id) return
    if (payload.connectionRecord.state === DidExchangeState.Completed) {
      // the connection is now ready for usage in other protocols!
      console.log(`Connection for out-of-band id ${outOfBandRecord.id} completed`)

      // Custom business logic can be included here
      // In this example we can send a basic message to the connection, but
      // anything is possible
      cb()

      // We exit the flow
      process.exit(0)
    }
  })
}

// end-section-6

const run = async () => {
  console.log('Initializing Bob agent...')
  const bobAgent = await initializeBobAgent()
  console.log('Initializing Acme agent...')
  const acmeAgent = await initializeAcmeAgent()

  console.log('Creating the invitation as Acme...')
  const { outOfBandRecord, invitationUrl } = await createNewInvitation(acmeAgent)

  console.log('Listening for connection changes...')
  setupConnectionListener(acmeAgent, outOfBandRecord, () =>
    console.log('We now have an active connection to use in the following tutorials')
  )

  console.log('Accepting the invitation as Bob...')
  await receiveInvitation(bobAgent, invitationUrl)
}

export default run

void run()
