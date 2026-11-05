# Key management

> Choose and configure the key management backends of a Credo agent (Askar, Node.js, hardware-backed keys on React Native, or your own), and use agent.kms to create keys and sign.

The key management service (KMS) creates and stores keys and does the cryptography with them: signing, verifying, encrypting and key agreement. Credo modules use it for DIDs, credentials, DIDComm and OpenID4VC, and you can call it directly through `agent.kms`. The KMS hands the work to one or more backends.

## Which backend should I use?

| You're building | Use | Why |
| --- | --- | --- |
| A server | Askar | Keys are stored encrypted and survive restarts. With [Drizzle](https://credo.js.org/guides/next/agent-setup/storage/drizzle.md) storing the records, Askar keeps only the keys. |
| A mobile wallet | Askar, plus the secure environment for keys that must stay in hardware | Askar handles everything the secure environment can't, such as verifying, encryption and Ed25519. |
| Tests and other short-lived agents | Node.js, with in-memory key storage | Lighter than Askar: it only uses `node:crypto`, and the keys are gone when the process stops. |
| Keys in a cloud KMS or an HSM | Your own backend | Credo doesn't ship one, but a backend is a single interface. See [Build your own backend](#build-your-own-backend). |

Add the Node.js backend next to Askar to [verify RSA signatures](#verify-rsa-signatures) and other algorithms Askar lacks, for example of an X.509 certificate authority. Verifying with a public key stores nothing. Don't make the Node.js backend a server's only backend for keys it creates: it keeps them in memory, unless you give it a key storage of your own.

### Hardware-bound keys in a wallet

Keys in the [secure environment](#secure-environment-react-native) are created in the phone's secure hardware and never leave it, so a copy of the wallet's data can't sign with them. Use it for the keys that credentials are bound to when issuers ask for it. Under HAIP, an issuer can require a [key attestation](https://credo.js.org/guides/next/protocols/openid4vc/authorization.md#wallet-and-key-attestations) that says how the keys are protected, and the EUDI Wallet requires hardware-protected keys for credentials such as the PID. When no issuer asks for it, keep the keys in Askar, because hardware keys come with trade-offs:

- Every signature shows a biometric prompt, so a presentation or a batch issuance asks the user to authenticate for each key it signs with.
- Only P-256 keys and ES256 signatures. DIDs and credentials that need Ed25519 stay in Askar.
- The keys can't be backed up or moved, so on a new phone the user needs new credentials. Changing the enrolled biometrics also invalidates the keys.

## Backends

`KeyManagementModule` is a default module under the key `kms`, registered without backends. `AskarModule` adds the `askar` backend, unless you set `enableKms: false`. For other backends, register `new KeyManagementModule({ backends, defaultBackend })` yourself under the key `kms`, as in the examples below. Import `KeyManagementModule` and the other KMS classes from `@credo-ts/core/kms`.

Credo doesn't check for a backend at startup. Without one, the agent initializes, and every key operation throws `No key management service backend found that supports ...`.

### Askar

`AskarKeyManagementService` (backend `askar`) keeps keys in the Askar store, encrypted with the store key, on Node.js and React Native. See [Askar](https://credo.js.org/guides/next/agent-setup/storage/askar.md).

### Node.js

`NodeKeyManagementService` from `@credo-ts/node` (backend `node`) uses `node:crypto`, so it needs no native library. It supports more algorithms than Askar, such as RSA, P-521 and HMAC. It has two common uses: the only backend of a test or other short-lived agent, and a second backend that verifies what Askar can't (see [Verify RSA signatures](#verify-rsa-signatures)).

It needs a key storage. For a test agent, keep the keys in memory:

```ts
import { Agent } from '@credo-ts/core'
import { KeyManagementModule } from '@credo-ts/core/kms'
import { agentDependencies, NodeInMemoryKeyManagementStorage, NodeKeyManagementService } from '@credo-ts/node'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    kms: new KeyManagementModule({
      // Keys only live in memory: they are lost when the process stops
      backends: [new NodeKeyManagementService(new NodeInMemoryKeyManagementStorage())],
    }),
    storage, // Storage, see Agent setup
  },
})
```

:::warning[Keys are kept in memory]
`NodeInMemoryKeyManagementStorage` is the only key storage that Credo ships. Keys are lost when the process stops, while DIDs and credentials in storage still refer to them. To keep keys, implement the `NodeKeyManagementStorage` interface (`get`, `has`, `set`, `delete`). It receives private keys as JWKs, so encrypt them at rest.
:::

### Secure environment (React Native)

`SecureEnvironmentKeyManagementService` from `@credo-ts/react-native` (backend `secureEnvironment`) creates keys in the Secure Enclave on iOS and the Android Keystore, protected with biometrics. It needs `@animo-id/expo-secure-environment` 0.1 (version 0.2 doesn't match the peer dependency range). The package's README lists its platform requirements, such as Android API 30 or higher.

```bash
npm install @animo-id/expo-secure-environment@^0.1.5
```

It only creates P-256 keys, signs with ES256 and deletes keys. It can't verify, encrypt, import keys or generate random bytes, so you always use it next to Askar. See [Askar and the secure environment](#askar-and-the-secure-environment-on-react-native).

### Capabilities

| | Askar | Node.js | Secure environment |
| --- | --- | --- | --- |
| Platforms | Node.js, React Native | Node.js | React Native |
| Keys are stored | In the Askar store | In memory, or your own storage | In secure hardware |
| EC curves | P-256, P-384, secp256k1 | P-256, P-384, P-521, secp256k1 | P-256 |
| OKP curves | Ed25519, X25519 | Ed25519, X25519 | No |
| RSA | No | Yes | No |
| Symmetric keys | AES-128, AES-256, ChaCha20-Poly1305 | AES, HMAC | No |
| Sign and verify | EdDSA, ES256, ES384, ES256K | EdDSA, ES256, ES384, ES512, ES256K, RS\*, PS\*, HS\* | ES256, sign only |
| Encrypt and decrypt | AES-GCM, AES-CBC-HMAC, (X)ChaCha20, XSalsa20, AES key wrap, ECDH-ES, HPKE | AES-GCM, AES-CBC, AES-CBC-HMAC, ChaCha20, ECDH-ES, HPKE | No |
| Import keys | EC and OKP keys | EC, OKP, RSA and symmetric keys | No |

## Multiple backends

Every backend has a name (`askar`, `node`, `secureEnvironment`). Credo decides which one handles an operation like this:

1. If you pass `backend`, that backend handles it, or the call throws if it can't.
2. For an operation on an existing key, Credo uses the backend that holds the key: `sign`, `verify`, `encrypt`, `decrypt` and `getPublicKey` look the key up by its key id.
3. Otherwise, the default backend handles it if it supports the operation, and else the first other backend that does. This applies to `createKey`, `importKey`, `randomBytes` and `deleteKey`, and to `verify` with a `publicJwk`.

`deleteKey` doesn't look up the key, so pass `backend` to delete a key that isn't in the default backend.

The default backend is `defaultBackend`, or else the first backend in the list. The list starts with the backends you pass to `KeyManagementModule`, and `AskarModule` adds `askar` after them. `defaultBackend` must name a backend in your own `backends` list. So to make Askar the default, add `AskarKeyManagementService` to `backends` yourself and set `enableKms: false` on `AskarModule`:

```ts
import { AskarKeyManagementService, AskarModule } from '@credo-ts/askar'
import { Agent, TypedArrayEncoder } from '@credo-ts/core'
import { KeyManagementModule } from '@credo-ts/core/kms'
import { agentDependencies, NodeInMemoryKeyManagementStorage, NodeKeyManagementService } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    storage, // Storage, see Agent setup
    kms: new KeyManagementModule({
      backends: [new AskarKeyManagementService(), new NodeKeyManagementService(new NodeInMemoryKeyManagementStorage())],
      defaultBackend: 'askar',
    }),
    askar: new AskarModule({
      askar: NativeAskar,
      // Askar only keeps the keys, and its backend is already in the backends list above
      enableStorage: false,
      enableKms: false,
      store: { id: 'kms-backends-example', key: 'kms-backends-example-store-key' },
    }),
  },
})
```

Then each key goes to a backend that supports it:

```ts
// Askar supports Ed25519, so the default backend creates this key
const ed25519Key = await agent.kms.createKey({ type: { kty: 'OKP', crv: 'Ed25519' } })

// Askar doesn't support P-521, so this falls back to the node backend
const p521Key = await agent.kms.createKey({ type: { kty: 'EC', crv: 'P-521' } })

// Pass a backend to choose it explicitly
const rsaKey = await agent.kms.createKey({ backend: 'node', type: { kty: 'RSA', modulusLength: 2048 } })

// sign finds the backend that holds the key
const data = TypedArrayEncoder.fromUtf8String('Hello, Credo')
await agent.kms.sign({ keyId: p521Key.keyId, algorithm: 'ES512', data })
```

### Askar and the secure environment on React Native

On a phone, make Askar the default and use the secure environment only for the keys that need hardware protection:

```ts
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
```

Don't only list the secure environment in `backends` and let `AskarModule` add its backend: the secure environment then comes first and becomes the default, and every P-256 key Credo creates ends up in hardware behind biometrics.

Create a hardware key by passing `backend`. Signing finds the key by its key id:

```ts
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
```

To verify a signature from a hardware key, pass the `publicJwk` instead of the key id, so another backend does it.

### Verify RSA signatures

Neither Askar nor the secure environment supports RSA. You still meet RSA signatures from others, for example X.509 certificate authorities that sign with RSA, or JWTs signed by an external RSA key. Credo can't check those without a backend that verifies RSA, and the error doesn't always say so: an mdoc issued under an RSA certificate authority fails with an error about the certificate chain.

On Node.js, add the Node.js backend next to Askar. A verification with a public key needs no stored key, so the in-memory key storage is enough:

```ts
import { AskarKeyManagementService, AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import { KeyManagementModule } from '@credo-ts/core/kms'
import { agentDependencies, NodeInMemoryKeyManagementStorage, NodeKeyManagementService } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    storage, // Storage, see Agent setup
    kms: new KeyManagementModule({
      backends: [
        new AskarKeyManagementService(),
        // Only verifies with public keys passed in the call, so nothing is stored in it
        new NodeKeyManagementService(new NodeInMemoryKeyManagementStorage()),
      ],
      defaultBackend: 'askar',
    }),
    askar: new AskarModule({
      askar: NativeAskar,
      enableStorage: false,
      enableKms: false,
      store: { id: 'kms-node-verify-example', key: 'kms-node-verify-example-store-key' },
    }),
  },
})
```

Credo then sends RSA verifications to it:

```ts
// Askar can't verify RS256, so Credo falls back to the node backend
const { verified } = await agent.kms.verify({
  key: { publicJwk: { kty: 'RSA', n, e } },
  algorithm: 'RS256',
  data,
  signature,
})
```

On React Native, the Node.js backend isn't available. Add your own backend that only verifies RSA signatures, as described in [Build your own backend](#build-your-own-backend). Paradym Wallet has one, built on `react-native-quick-crypto`: [`RsaVerificationKeyManagementService`](https://github.com/animo/paradym-wallet/blob/226083df04e183b06e7a379b2b4938bbafe84f3c/packages/sdk/src/kms/RsaVerificationKeyManagementService.ts). Register it next to the other backends:

```ts
new KeyManagementModule({
  backends: [
    new AskarKeyManagementService(),
    new SecureEnvironmentKeyManagementService(),
    new RsaVerificationKeyManagementService(),
  ],
  defaultBackend: 'askar',
})
```

## Build your own backend

A backend is a class that implements `KeyManagementService` from `@credo-ts/core/kms`. Write one to keep keys in a cloud KMS such as Google Cloud KMS or AWS KMS, in an HSM, or on a platform Credo has no backend for. Implement only what your key store can do, and leave the rest to Askar or the Node.js backend in the same agent.

Credo uses these parts of the interface to route operations:

| Member | What Credo expects |
| --- | --- |
| `backend` | A unique name. Users pass it as `backend` to choose this backend. |
| `isOperationSupported(agentContext, operation)` | `true` for each operation and algorithm the backend handles, such as `createKey` for P-256 keys or `sign` with ES256. Credo never sends this backend an operation it returns `false` for. A call that names this backend for such an operation throws. |
| `getPublicKey(agentContext, keyId)` | The public JWK, with `kid`, or `null` when the backend doesn't hold the key. Credo asks each backend in turn to find the one that holds a key. |
| `createKey`, `importKey`, `deleteKey` | Manage keys. Return the key id that Credo stores in DIDs and credential records, so keep it stable. Respect `options.keyId` when it's set. |
| `sign`, `verify`, `encrypt`, `decrypt`, `randomBytes` | The cryptography. Throw `KeyManagementAlgorithmNotSupportedError` or `KeyManagementError` for what you don't support. |

This backend creates P-256 keys in a cloud KMS and signs with them. The `CloudKmsClient` interface stands in for your KMS SDK:

```ts
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
```

Signing has two traps with most cloud KMSs. They sign a digest, so hash the data yourself with the hash of the JWA algorithm (SHA-256 for ES256). And they return ECDSA signatures DER encoded, while JWA uses the raw `r || s` form: convert them with `derEcSignatureToRaw`.

Register the backend in `KeyManagementModule`. Here it's the default, so Credo creates P-256 keys in the cloud KMS, and Askar creates the other keys, verifies and encrypts:

```ts
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
```

Import from `@credo-ts/core` before `@credo-ts/core/kms` in the file your app loads first, as the `kms` entry point doesn't load the `reflect-metadata` polyfill that Credo needs.

## Use `agent.kms`

```ts
const { keyId, publicJwk } = await agent.kms.createKey({
  type: { kty: 'OKP', crv: 'Ed25519' },
})

const data = TypedArrayEncoder.fromUtf8String('Hello, Credo')
const { signature } = await agent.kms.sign({ keyId, algorithm: 'EdDSA', data })

const result = await agent.kms.verify({
  key: { publicJwk },
  algorithm: 'EdDSA',
  data,
  signature,
})
console.log(result.verified) // true
```

| Method | What it does |
| --- | --- |
| `createKey({ type, keyId?, backend? })` | Creates a key and returns `{ keyId, publicJwk }`. `type` is for example `{ kty: 'EC', crv: 'P-256' }` or `{ kty: 'OKP', crv: 'Ed25519' }`. |
| `createKeyForSignatureAlgorithm({ algorithm })` | Creates a key that fits a JWA signature algorithm, such as `ES256`. |
| `importKey({ privateJwk })` | Imports a private JWK. Set `privateJwk.kid` to choose the key id. |
| `getPublicKey({ keyId })` | Returns the public JWK of a key. |
| `sign({ keyId, algorithm, data })` | Signs `data` (a `Uint8Array`). |
| `verify({ key, algorithm, data, signature })` | Verifies with `key: { keyId }` or `key: { publicJwk }`. Returns `{ verified }`. |
| `encrypt(...)`, `decrypt(...)` | Encrypts and decrypts with a key, a JWK or key agreement. |
| `deleteKey({ keyId })` | Deletes a key. |
| `randomBytes({ length })` | Returns random bytes. |
| `supportedBackendsForOperation(operation)` | The backends that support an operation. |
| `supportedJwaSignatureAlgorithms()` | The signature algorithms at least one backend supports. |

To use a key in a DID, pass its `keyId` when you create the DID. See [DIDs](https://credo.js.org/guides/next/dids-and-trust.md).
