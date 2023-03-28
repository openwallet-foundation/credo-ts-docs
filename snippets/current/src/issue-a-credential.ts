import {
  CredentialEventTypes,
  CredentialState,
  CredentialStateChangedEvent,
  DidsModule,
  HttpOutboundTransport,
  InitConfig,
  WsOutboundTransport,
  Agent,
} from '@aries-framework/core'
import { agentDependencies, HttpInboundTransport } from '@aries-framework/node'
import { AskarModule } from '@aries-framework/askar'
import { ariesAskar } from '@hyperledger/aries-askar-nodejs'
import {
  IndyVdrAnonCredsRegistry,
  IndyVdrIndyDidRegistrar,
  IndyVdrIndyDidResolver,
  IndyVdrModule,
} from '@aries-framework/indy-vdr'
import { indyVdr } from '@hyperledger/indy-vdr-nodejs'
import { AnonCredsModule } from '@aries-framework/anoncreds'
import { AnonCredsRsModule } from '@aries-framework/anoncreds-rs'
import { anoncreds } from '@hyperledger/anoncreds-nodejs'

const issuerConfig: InitConfig = {
  label: 'docs-agent-nodejs-issue-a-credential-issuer',
  walletConfig: {
    id: 'wallet-id-issuer',
    key: 'testkey0000000000000000000000000',
  },
}

const holderConfig: InitConfig = {
  label: 'docs-agent-nodejs-issue-a-credential-holder',
  walletConfig: {
    id: 'wallet-id-holder',
    key: 'testkey0000000000000000000000000',
  },
}

// start-section-1
const issuer = new Agent({
  config: issuerConfig,
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      ariesAskar,
    }),
    anoncredsRs: new AnonCredsRsModule({
      anoncreds,
    }),
    indyVdr: new IndyVdrModule({
      indyVdr,
      networks: [
        {
          isProduction: false,
          indyNamespace: 'bcovrin:test',
          genesisTransactions: '<genesis transaction>',
          connectOnStartup: true,
        },
      ],
    }),
    anoncreds: new AnonCredsModule({
      registries: [new IndyVdrAnonCredsRegistry()],
    }),
    dids: new DidsModule({
      registrars: [new IndyVdrIndyDidRegistrar()],
      resolvers: [new IndyVdrIndyDidResolver()],
    }),
  },
})

// Register a simple `WebSocket` outbound transport
issuer.registerOutboundTransport(new WsOutboundTransport())

// Register a simple `Http` outbound transport
issuer.registerOutboundTransport(new HttpOutboundTransport())

// Register a simple `Http` inbound transport
issuer.registerInboundTransport(new HttpInboundTransport({ port: 3002 }))
// end-section-1

// start-section-2
const holder = new Agent({
  config: holderConfig,
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      ariesAskar,
    }),
    anoncredsRs: new AnonCredsRsModule({
      anoncreds,
    }),
    indyVdr: new IndyVdrModule({
      indyVdr,
      networks: [
        {
          isProduction: false,
          indyNamespace: 'bcovrin:test',
          genesisTransactions: '<genesis transaction>',
          connectOnStartup: true,
        },
      ],
    }),
    anoncreds: new AnonCredsModule({
      registries: [new IndyVdrAnonCredsRegistry()],
    }),
    dids: new DidsModule({
      resolvers: [new IndyVdrIndyDidResolver()],
    }),
  },
})

// Register a simple `WebSocket` outbound transport
holder.registerOutboundTransport(new WsOutboundTransport())

// Register a simple `Http` outbound transport
holder.registerOutboundTransport(new HttpOutboundTransport())

// Register a simple `Http` inbound transport
holder.registerInboundTransport(new HttpInboundTransport({ port: 3002 }))
// end-section-2

// start-section-3
holder.events.on<CredentialStateChangedEvent>(CredentialEventTypes.CredentialStateChanged, async ({ payload }) => {
  switch (payload.credentialRecord.state) {
    case CredentialState.OfferReceived:
      console.log('received a credential')
      // custom logic here
      await holder.credentials.acceptOffer({ credentialRecordId: payload.credentialRecord.id })
    case CredentialState.Done:
      console.log(`Credential for credential id ${payload.credentialRecord.id} is accepted`)
      // For demo purposes we exit the program here.
      process.exit(0)
  }
})
// end-section-3

// start-section-4
issuer.credentials.offerCredential({
  protocolVersion: 'v2',
  connectionId: '<connection id>',
  credentialFormats: {
    indy: {
      credentialDefinitionId: '<credential definition id>',
      attributes: [
        { name: 'name', value: 'Jane Doe' },
        { name: 'age', value: '23' },
      ],
    },
  },
})
// end-section-4
