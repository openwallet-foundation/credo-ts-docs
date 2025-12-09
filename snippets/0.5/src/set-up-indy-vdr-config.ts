// start-section-1

import { IndyVdrModule } from '@credo-ts/indy-vdr'
import { indyVdr } from '@hyperledger/indy-vdr-nodejs'

const _modules = {
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
