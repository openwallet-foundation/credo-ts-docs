// start-section-1
import { AskarKeyManagementService, AskarModule } from '@credo-ts/askar'
import { Agent, TypedArrayEncoder } from '@credo-ts/core'
import { KeyManagementModule } from '@credo-ts/core/kms'
import { agentDependencies, SecureEnvironmentKeyManagementService } from '@credo-ts/react-native'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'

export const secureEnvironment = new SecureEnvironmentKeyManagementService({
  // A function is called for every prompt, so it can follow the language of the app
  prompt: () => ({ title: 'Sign with your wallet' }),
})

export async function initializeAgent(walletKey: string) {
  const agent = new Agent({
    dependencies: agentDependencies,
    modules: {
      kms: new KeyManagementModule({
        backends: [new AskarKeyManagementService(), secureEnvironment],
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

export type WalletAgent = Awaited<ReturnType<typeof initializeAgent>>
// end-section-1

// start-section-2
export async function signWithHardwareKey(agent: WalletAgent, message: string) {
  // Only P-256 keys and ES256 signatures are supported in the secure environment
  const { keyId, publicJwk } = await agent.kms.createKey({
    backend: 'secureEnvironment',
    type: { kty: 'EC', crv: 'P-256' },
    backendOptions: {
      userAuthentication: { methods: ['biometric', 'deviceCredential'] },
      minimumKeyStorage: 'trustedEnvironment',
    },
  })

  const { signature } = await agent.kms.sign({
    keyId,
    algorithm: 'ES256',
    data: TypedArrayEncoder.fromUtf8String(message),
  })

  return { publicJwk, signature }
}
// end-section-2

// start-section-3
export async function signWithOnePrompt(agent: WalletAgent, keyIds: string[], message: Uint8Array) {
  return secureEnvironment.withUserAuthentication(
    agent.context,
    async () => {
      const signatures: Uint8Array[] = []
      for (const keyId of keyIds) {
        const { signature } = await agent.kms.sign({ keyId, algorithm: 'ES256', data: message })
        signatures.push(signature)
      }
      return signatures
    },
    { keyIds, prompt: { title: `Sign with ${keyIds.length} keys` } }
  )
}
// end-section-3
