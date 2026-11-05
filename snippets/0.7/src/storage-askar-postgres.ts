// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      store: {
        // Also the name of the Postgres database
        id: 'my-agent',
        key: 'my-agent-store-key',
        database: {
          type: 'postgres',
          config: {
            host: 'localhost:5432',
            maxConnections: 10,
            connectionParameters: { sslmode: 'require' },
          },
          credentials: {
            account: 'credo',
            password: 'credo-password',
          },
        },
      },
    }),
  },
})

await agent.initialize()
// end-section-1

await agent.shutdown()
