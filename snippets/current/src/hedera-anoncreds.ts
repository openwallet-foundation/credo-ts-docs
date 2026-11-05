// start-section-1
import { AnonCredsModule } from '@credo-ts/anoncreds'
import { HederaAnonCredsRegistry } from '@credo-ts/hedera/anoncreds'
import { NativeAnoncreds } from '@hyperledger/anoncreds-nodejs'

// HederaModule must be registered as well, the registry uses its network configuration
const anoncreds = new AnonCredsModule({
  anoncreds: NativeAnoncreds,
  registries: [new HederaAnonCredsRegistry()],
})
// end-section-1

export { anoncreds }
