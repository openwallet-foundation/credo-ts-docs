// start-section-1
import { readFile } from 'node:fs/promises'
import {
  DidsModule,
  JwkDidRegistrar,
  JwkDidResolver,
  KeyDidRegistrar,
  KeyDidResolver,
  PeerDidRegistrar,
  PeerDidResolver,
  WebDidResolver,
} from '@credo-ts/core'
import {
  IndyVdrIndyDidRegistrar,
  IndyVdrIndyDidResolver,
  IndyVdrModule,
  IndyVdrSovDidResolver,
} from '@credo-ts/indy-vdr'
import { indyVdr } from '@hyperledger/indy-vdr-nodejs'

const indyVdrModules = {
  indyVdr: new IndyVdrModule({
    indyVdr,
    networks: [
      {
        indyNamespace: 'bcovrin:test',
        isProduction: false,
        genesisTransactions: await readFile('genesis/bcovrin-test.txn', 'utf8'),
        connectOnStartup: true,
      },
    ],
  }),
  dids: new DidsModule({
    registrars: [new KeyDidRegistrar(), new PeerDidRegistrar(), new JwkDidRegistrar(), new IndyVdrIndyDidRegistrar()],
    resolvers: [
      new KeyDidResolver(),
      new PeerDidResolver(),
      new JwkDidResolver(),
      new WebDidResolver(),
      new IndyVdrIndyDidResolver(),
      new IndyVdrSovDidResolver(),
    ],
  }),
}
// end-section-1

export { indyVdrModules }
