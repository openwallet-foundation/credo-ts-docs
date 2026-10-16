// start-section-1
import { AskarKeyManagementService, AskarModule } from '@credo-ts/askar'
import { Agent, TypedArrayEncoder } from '@credo-ts/core'
import { KeyManagementModule } from '@credo-ts/core/kms'
import { agentDependencies, SecureEnvironmentKeyManagementService } from '@credo-ts/react-native'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'

export async function initializeAgent(walletKey: string) {
  const agent = new Agent({
    dependencies: agentDependencies,
    modules: {
      kms: new KeyManagementModule({
        backends: [new AskarKeyManagementService(), new SecureEnvironmentKeyManagementService()],
        defaultBackend: 'askar',
      }),
      askar: new AskarModule({
        askar: NativeAskar,
        // The Askar backend is already in the backends list above
        enableKms: false,
        store: { id: 'wallet', key: walletKey, keyDerivationMethod: 'raw' },
      }),
    },
  })

  await agent.initialize()
  return agent
}
// end-section-1

// start-section-2
export async function signWithHardwareKey(agent: Agent, message: string) {
  // Only P-256 keys and ES256 signatures are supported in the secure environment
  const { keyId, publicJwk } = await agent.kms.createKey({
    backend: 'secureEnvironment',
    type: { kty: 'EC', crv: 'P-256' },
  })

  const { signature } = await agent.kms.sign({
    keyId,
    algorithm: 'ES256',
    data: TypedArrayEncoder.fromUtf8String(message),
  })

  return { publicJwk, signature }
}
// end-section-2
