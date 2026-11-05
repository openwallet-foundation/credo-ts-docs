// start-section-1
import { AnonCredsModule } from '@credo-ts/anoncreds'
import { WebVhAnonCredsRegistry } from '@credo-ts/webvh/anoncreds'
import { NativeAnoncreds } from '@hyperledger/anoncreds-nodejs'

const anoncreds = new AnonCredsModule({
  anoncreds: NativeAnoncreds,
  registries: [new WebVhAnonCredsRegistry()],
})
// end-section-1

export { anoncreds }
