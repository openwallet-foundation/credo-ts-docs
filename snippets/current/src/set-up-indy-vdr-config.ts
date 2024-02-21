// start-section-1
import { indyVdr } from '@hyperledger/indy-vdr-nodejs'
import { IndyVdrModule } from '@credo-ts/indy-vdr'

const modules = {
  indyVdr: new IndyVdrModule({
    indyVdr,
    networks: [
      {
        indyNamespace: 'bcovrin:test',
        isProduction: false,
        genesisTransactions: '<genesis_transactions>',
        connectOnStartup: true,
      },
    ],
  }),
}
// end-section-1
