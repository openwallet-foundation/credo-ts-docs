// start-section-1
import { AnonCredsModule } from '@credo-ts/anoncreds'
import { CheqdAnonCredsRegistry } from '@credo-ts/cheqd/anoncreds'
import { NativeAnoncreds } from '@hyperledger/anoncreds-nodejs'

const anoncreds = new AnonCredsModule({
  anoncreds: NativeAnoncreds,
  registries: [new CheqdAnonCredsRegistry()],
})
// end-section-1

export { anoncreds }
