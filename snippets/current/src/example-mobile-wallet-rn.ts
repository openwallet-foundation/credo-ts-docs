// start-section-1
import { AskarKeyManagementService, AskarModule } from '@credo-ts/askar'
import { Agent, ConsoleLogger, LogLevel } from '@credo-ts/core'
import { KeyManagementModule } from '@credo-ts/core/kms'
import {
  DidCommHttpOutboundTransport,
  DidCommMediatorPickupStrategy,
  DidCommModule,
  DidCommWsOutboundTransport,
} from '@credo-ts/didcomm'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
import { agentDependencies, SecureEnvironmentKeyManagementService } from '@credo-ts/react-native'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'

interface WalletAgentOptions {
  // A raw key from Store.generateRawKey(), kept in the device keychain
  walletKey: string
  // Invitation URL of the mediator that receives DIDComm messages for this wallet
  mediatorInvitationUrl: string
}

export function createWalletAgent({ walletKey, mediatorInvitationUrl }: WalletAgentOptions) {
  return new Agent({
    config: {
      logger: new ConsoleLogger(LogLevel.Warn),
    },
    dependencies: agentDependencies,
    modules: {
      askar: new AskarModule({
        askar: NativeAskar,
        store: { id: 'wallet', key: walletKey, keyDerivationMethod: 'raw' },
        // The Askar backend is registered in the kms module below, so it can be the default
        enableKms: false,
      }),
      kms: new KeyManagementModule({
        backends: [new AskarKeyManagementService(), new SecureEnvironmentKeyManagementService()],
        defaultBackend: 'askar',
      }),
      openid4vc: new OpenId4VcModule(),
      didcomm: new DidCommModule({
        // No inbound transports: messages for the wallet go through the mediator
        transports: {
          outbound: [new DidCommWsOutboundTransport(), new DidCommHttpOutboundTransport()],
        },
        mediationRecipient: {
          mediatorInvitationUrl,
          mediatorPickupStrategy: DidCommMediatorPickupStrategy.PickUpV2LiveMode,
        },
        mediator: false,
      }),
    },
  })
}

export type WalletAgent = ReturnType<typeof createWalletAgent>
// end-section-1
