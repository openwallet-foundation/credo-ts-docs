import { coreBundle } from '@credo-ts/drizzle-storage/core'
import { migrate } from 'drizzle-orm/libsql/migrator'

// Applies the migrations so the example runs, see the Drizzle storage page
for (const bundle of [coreBundle, didcommBundle]) {
  await migrate(drizzle('file:agent.db'), {
    migrationsFolder: bundle.migrations.sqlite.migrationsPath,
    migrationsTable: `credo_migrations__${bundle.name.replace('-', '_')}`,
  })
}

// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import {
  DidCommConnectionEventTypes,
  type DidCommConnectionStateChangedEvent,
  DidCommDidExchangeState,
  DidCommHttpOutboundTransport,
  DidCommModule,
  DidCommWsOutboundTransport,
} from '@credo-ts/didcomm'
import { DrizzleStorageModule } from '@credo-ts/drizzle-storage'
import { didcommBundle } from '@credo-ts/drizzle-storage/didcomm'
import { agentDependencies, DidCommHttpInboundTransport, DidCommWsInboundTransport } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import { drizzle } from 'drizzle-orm/libsql'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    // Drizzle stores the records. Run its migrations before you start the agent.
    storage: new DrizzleStorageModule({ database: drizzle('file:agent.db'), bundles: [didcommBundle] }),
    // Askar stores the keys: DIDComm needs its XSalsa20-Poly1305 support
    askar: new AskarModule({
      askar: NativeAskar,
      enableStorage: false,
      store: { id: 'acme-agent-keys', key: 'acme-agent-store-key' },
    }),
    didcomm: new DidCommModule({
      // The public URLs other agents use to reach this agent, in order of preference
      endpoints: ['http://localhost:4040', 'ws://localhost:4041'],
      transports: {
        inbound: [new DidCommHttpInboundTransport({ port: 4040 }), new DidCommWsInboundTransport({ port: 4041 })],
        outbound: [new DidCommHttpOutboundTransport(), new DidCommWsOutboundTransport()],
      },
      connections: { autoAcceptConnections: true },
    }),
  },
})

await agent.initialize()
// end-section-1

// start-section-2
agent.events.on<DidCommConnectionStateChangedEvent>(
  DidCommConnectionEventTypes.DidCommConnectionStateChanged,
  ({ payload }) => {
    const { connectionRecord, previousState } = payload
    console.log(`Connection ${connectionRecord.id}: ${previousState} -> ${connectionRecord.state}`)

    if (connectionRecord.state === DidCommDidExchangeState.Completed) {
      console.log(`Connected with ${connectionRecord.theirLabel}`)
    }
  }
)
// end-section-2

await agent.shutdown()
