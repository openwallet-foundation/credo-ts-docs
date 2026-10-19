// start-section-1
import { createHash, createPublicKey } from 'node:crypto'
import { type AgentContext, utils } from '@credo-ts/core'
import {
  derEcSignatureToRaw,
  KeyManagementAlgorithmNotSupportedError,
  KeyManagementError,
  type KeyManagementService,
  type KmsCreateKeyOptions,
  type KmsCreateKeyReturn,
  type KmsCreateKeyType,
  type KmsJwkPublic,
  type KmsOperation,
  type KmsSignOptions,
  type KmsSignReturn,
  PublicJwk,
} from '@credo-ts/core/kms'

// The calls the backend needs from your cloud KMS SDK. With Google Cloud KMS these are
// `createCryptoKey`, `getPublicKey` and `asymmetricSign` of its `KeyManagementServiceClient`.
export interface CloudKmsClient {
  createP256SigningKey(keyId: string): Promise<void>
  // PEM encoded public key, or null when the key doesn't exist
  getPublicKeyPem(keyId: string): Promise<string | null>
  // Signs a SHA-256 digest and returns a DER encoded ECDSA signature
  signDigest(keyId: string, digest: Uint8Array): Promise<Uint8Array>
}

export class CloudKeyManagementService implements KeyManagementService {
  public readonly backend = 'cloud'

  public constructor(private client: CloudKmsClient) {}

  // Credo only routes the operations this returns true for to this backend
  public isOperationSupported(_agentContext: AgentContext, operation: KmsOperation): boolean {
    if (operation.operation === 'createKey') {
      return operation.type.kty === 'EC' && operation.type.crv === 'P-256'
    }
    return operation.operation === 'sign' && operation.algorithm === 'ES256'
  }

  // Credo asks each backend for a key id, so return null for keys this backend doesn't hold
  public async getPublicKey(_agentContext: AgentContext, keyId: string): Promise<KmsJwkPublic | null> {
    const pem = await this.client.getPublicKeyPem(keyId)
    if (!pem) return null

    const publicJwk = PublicJwk.fromUnknown(createPublicKey(pem).export({ format: 'jwk' }))
    publicJwk.keyId = keyId
    return publicJwk.toJson()
  }

  public async createKey<Type extends KmsCreateKeyType>(
    agentContext: AgentContext,
    options: KmsCreateKeyOptions<Type>
  ): Promise<KmsCreateKeyReturn<Type>> {
    if (options.type.kty !== 'EC' || options.type.crv !== 'P-256') {
      throw new KeyManagementAlgorithmNotSupportedError(`kty '${options.type.kty}'`, this.backend)
    }

    // Credo stores the key id in DIDs and credential records, so keep it stable
    const keyId = options.keyId ?? utils.uuid()
    await this.client.createP256SigningKey(keyId)

    const publicJwk = await this.getPublicKey(agentContext, keyId)
    if (!publicJwk) throw new KeyManagementError(`Key '${keyId}' was not found after creating it`)

    // The generic return type follows from the requested key type, which is checked above
    return { keyId, publicJwk } as KmsCreateKeyReturn<Type>
  }

  public async sign(_agentContext: AgentContext, options: KmsSignOptions): Promise<KmsSignReturn> {
    if (options.algorithm !== 'ES256') {
      throw new KeyManagementAlgorithmNotSupportedError(`algorithm '${options.algorithm}'`, this.backend)
    }

    const digest = createHash('sha256').update(options.data).digest()
    const derSignature = await this.client.signDigest(options.keyId, digest)

    // JWA signatures are the raw r || s values, cloud KMSs return them DER encoded
    return { signature: derEcSignatureToRaw(derSignature, 'P-256') }
  }

  // isOperationSupported returns false for these, so Credo uses another backend for them
  public async verify(): Promise<never> {
    throw new KeyManagementError(`Verifying is not supported by backend '${this.backend}'`)
  }

  public async importKey(): Promise<never> {
    throw new KeyManagementError(`Importing keys is not supported by backend '${this.backend}'`)
  }

  public async deleteKey(): Promise<never> {
    throw new KeyManagementError(`Deleting keys is not supported by backend '${this.backend}'`)
  }

  public async encrypt(): Promise<never> {
    throw new KeyManagementError(`Encrypting is not supported by backend '${this.backend}'`)
  }

  public async decrypt(): Promise<never> {
    throw new KeyManagementError(`Decrypting is not supported by backend '${this.backend}'`)
  }

  public randomBytes(): never {
    throw new KeyManagementError(`Generating random bytes is not supported by backend '${this.backend}'`)
  }
}

// end-section-1

import { exampleStorage } from './example-storage.js'

const { storage } = await exampleStorage()

// start-section-2
import { AskarKeyManagementService, AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import { KeyManagementModule } from '@credo-ts/core/kms'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

export function createAgent(cloudKmsClient: CloudKmsClient) {
  return new Agent({
    dependencies: agentDependencies,
    modules: {
      storage, // Storage, see Agent setup
      kms: new KeyManagementModule({
        backends: [new CloudKeyManagementService(cloudKmsClient), new AskarKeyManagementService()],
        // P-256 keys are created in the cloud KMS. Askar creates the other keys, such as Ed25519,
        // and verifies and encrypts.
        defaultBackend: 'cloud',
      }),
      askar: new AskarModule({
        askar: NativeAskar,
        enableStorage: false,
        enableKms: false,
        store: { id: 'cloud-kms-example', key: 'cloud-kms-example-store-key' },
      }),
    },
  })
}
// end-section-2
