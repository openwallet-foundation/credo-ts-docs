// @ts-nocheck: remove once a 0.8 @credo-ts/indy-vdr is published from credo-ts-ext
// start-section-1
import { AnonCredsModule } from '@credo-ts/anoncreds'
import { IndyVdrAnonCredsRegistry } from '@credo-ts/indy-vdr/anoncreds'
import { NativeAnoncreds } from '@hyperledger/anoncreds-nodejs'

const anoncreds = new AnonCredsModule({
  anoncreds: NativeAnoncreds,
  registries: [new IndyVdrAnonCredsRegistry()],
})

// end-section-1

export { anoncreds }
