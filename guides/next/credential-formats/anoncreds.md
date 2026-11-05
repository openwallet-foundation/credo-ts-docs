# AnonCreds

> Set up AnonCreds in Credo with a registry, register schemas, credential definitions and revocation registries, and manage link secrets and stored credentials.

[AnonCreds](https://hyperledger.github.io/anoncreds-spec/) credentials are signed with CL signatures, which let a holder present zero-knowledge proofs: reveal only some attributes and prove a predicate such as "age is at least 18" without the value. Verifiers can't link presentations through the signature. Holders bind credentials to a link secret instead of a key. Issuers publish schemas, credential definitions and revocation data on an AnonCreds registry, usually a ledger. This page covers setup and the issuer and holder APIs. Credo exchanges AnonCreds credentials only over DIDComm: see [AnonCreds with DIDComm](https://credo.js.org/guides/next/protocols/didcomm/anoncreds.md).

## Install

**Node.js**

```bash
npm install @credo-ts/anoncreds@alpha @hyperledger/anoncreds-nodejs@^0.4.1
```

**React Native**

```bash
npm install @credo-ts/anoncreds@alpha @hyperledger/anoncreds-react-native@^0.4.1
```

Also install the package of your registry (see below).

## Configure

Register the `AnonCredsModule` with the native AnonCreds library and at least one registry.

**Node.js**

```ts
import { AnonCredsModule } from '@credo-ts/anoncreds'
import { CheqdDidRegistrar, CheqdDidResolver, CheqdModule } from '@credo-ts/cheqd'
import { CheqdAnonCredsRegistry } from '@credo-ts/cheqd/anoncreds'
import { Agent, DidsModule } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { NativeAnoncreds } from '@hyperledger/anoncreds-nodejs'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    ...storage, // Storage and key management, see Agent setup
    cheqd: new CheqdModule({
      networks: [{ network: 'testnet', cosmosPayerSeed: '<cosmos payer seed or mnemonic>' }],
    }),
    dids: new DidsModule({
      registrars: [new CheqdDidRegistrar()],
      resolvers: [new CheqdDidResolver()],
    }),
    anoncreds: new AnonCredsModule({
      anoncreds: NativeAnoncreds,
      registries: [new CheqdAnonCredsRegistry()],
    }),
  },
})

await agent.initialize()
```

**React Native**

```ts
import { AnonCredsModule } from '@credo-ts/anoncreds'
import { AskarModule } from '@credo-ts/askar'
import { CheqdDidResolver, CheqdModule } from '@credo-ts/cheqd'
import { CheqdAnonCredsRegistry } from '@credo-ts/cheqd/anoncreds'
import { Agent, DidsModule } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/react-native'
import { NativeAnoncreds } from '@hyperledger/anoncreds-react-native'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'

const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    // Derive the store key from secure storage or user input, see the Askar page
    askar: new AskarModule({ askar: NativeAskar, store: { id: 'wallet', key: '<store key>' } }),
    // A holder only resolves objects, so it needs no payer seed
    cheqd: new CheqdModule({ networks: [{ network: 'testnet' }] }),
    dids: new DidsModule({ resolvers: [new CheqdDidResolver()] }),
    anoncreds: new AnonCredsModule({
      anoncreds: NativeAnoncreds,
      registries: [new CheqdAnonCredsRegistry()],
    }),
  },
})

await agent.initialize()
```

Pass the `NativeAnoncreds` class: Credo resolves the native binding when it needs it, so import order doesn't matter. The module's API is available as `agent.modules.anoncreds` under the key you register it with. With [Drizzle storage](https://credo.js.org/guides/next/agent-setup/storage/drizzle.md#bundles), also register `anoncredsBundle`, as AnonCreds stores its own records.

Each registry handles the identifiers of one DID method, and Credo uses the first registry that matches an identifier. A registry also needs the module of its network, which provides the DID resolver:

| Registry | Import from | Identifiers | Network setup |
| --- | --- | --- | --- |
| `IndyVdrAnonCredsRegistry` | `@credo-ts/indy-vdr` | `did:indy`, and unqualified Indy identifiers for resolving | [Indy VDR](https://credo.js.org/guides/next/dids-and-trust/indy-vdr.md) |
| `CheqdAnonCredsRegistry` | `@credo-ts/cheqd/anoncreds` | `did:cheqd` | [cheqd](https://credo.js.org/guides/next/dids-and-trust/cheqd.md) |
| `HederaAnonCredsRegistry` | `@credo-ts/hedera/anoncreds` | `did:hedera` | [Hedera](https://credo.js.org/guides/next/dids-and-trust/hedera.md) |
| `WebVhAnonCredsRegistry` | `@credo-ts/webvh/anoncreds` | `did:webvh` | [did:webvh](https://credo.js.org/guides/next/dids-and-trust/webvh.md) |

The cheqd, Hedera and did:webvh packages have `@credo-ts/anoncreds` as an optional peer dependency, so install it yourself. Hedera also needs `@hiero-did-sdk/anoncreds`. To register objects on Indy, the issuer needs a `did:indy`.

## Register a schema

A schema lists the attribute names of a credential type. An issuer can also use a schema that someone else registered.

:::issuer

```ts
const { schemaState } = await agent.modules.anoncreds.registerSchema({
  schema: {
    issuerId,
    name: 'Employee',
    version: '1.0',
    attrNames: ['name', 'role', 'age'],
  },
  // Registry specific, cheqd needs none
  options: {},
})

if (schemaState.state !== 'finished') {
  throw new Error(
    `Registering the schema failed: ${schemaState.state === 'failed' ? schemaState.reason : schemaState.state}`
  )
}
```

:::

- `issuerId` is a DID on the registry that the issuer created or imported in its agent.
- `options` depend on the registry. Indy VDR needs `endorserMode` and `endorserDid`, and you can type them with `registerSchema<IndyVdrRegisterSchemaOptions>`. cheqd needs none.
- The register methods don't throw when registration fails. Check `state`: `finished`, `failed` (with `reason`), `wait`, or `action` (for example when an external Indy endorser has to sign).

## Register a credential definition

A credential definition binds a schema to an issuer and holds the issuer's public keys. You issue against a credential definition.

:::issuer

```ts
const { credentialDefinitionState } = await agent.modules.anoncreds.registerCredentialDefinition({
  credentialDefinition: {
    issuerId,
    schemaId: schemaState.schemaId,
    tag: 'default',
  },
  options: { supportRevocation: false },
})

if (credentialDefinitionState.state !== 'finished') {
  throw new Error(`Registering the credential definition failed: ${credentialDefinitionState.state}`)
}
const credentialDefinitionId = credentialDefinitionState.credentialDefinitionId
```

:::

Credo keeps the private keys in the issuer's storage. Without them you can no longer issue with this credential definition. Use `tag` to create several credential definitions for one schema. Set `supportRevocation: true` if you want to revoke credentials later: you can't add revocation afterwards.

## Revocation

Revocation is optional and adds work on both sides. The issuer hosts a tails file and writes to the registry for every status list update, and holders download the tails file to prove non-revocation. Enable it when a credential can stop being valid while the holder still has it, such as an employee or membership credential. Leave it off for credentials that stay true, such as a diploma.

A revocable credential definition needs a revocation registry and a status list. The revocation registry has a tails file that holders download to prove non-revocation, so the issuer must publish it. The default `BasicTailsFileService` only downloads tails files. Give issuers a tails file service that uploads:

```ts
import { readFile } from 'node:fs/promises'
import { AnonCredsModule, type AnonCredsRevocationRegistryDefinition, BasicTailsFileService } from '@credo-ts/anoncreds'
import { CheqdDidRegistrar, CheqdDidResolver, CheqdModule } from '@credo-ts/cheqd'
import { CheqdAnonCredsRegistry } from '@credo-ts/cheqd/anoncreds'
import { Agent, type AgentContext, DidsModule } from '@credo-ts/core'
import { anoncredsBundle } from '@credo-ts/drizzle-storage/anoncreds'
import { agentDependencies } from '@credo-ts/node'
import { NativeAnoncreds } from '@hyperledger/anoncreds-nodejs'
import { exampleStorage } from './example-storage.js'

class TailsServerFileService extends BasicTailsFileService {
  public async uploadTailsFile(
    _agentContext: AgentContext,
    { revocationRegistryDefinition }: { revocationRegistryDefinition: AnonCredsRevocationRegistryDefinition }
  ) {
    // Before the upload, `tailsLocation` is the path of the tails file Credo generated
    const tailsFile = await readFile(revocationRegistryDefinition.value.tailsLocation)
    const tailsFileUrl = `https://tails.example.com/${revocationRegistryDefinition.value.tailsHash}`

    const response = await fetch(tailsFileUrl, { method: 'PUT', body: tailsFile })
    if (!response.ok) throw new Error(`Uploading the tails file failed with status ${response.status}`)

    return { tailsFileUrl }
  }
}
```

```ts
anoncreds: new AnonCredsModule({
  anoncreds: NativeAnoncreds,
  registries: [new CheqdAnonCredsRegistry()],
  tailsFileService: new TailsServerFileService(),
}),
```

Then create the revocation registry and its first status list:

:::issuer

```ts
const { credentialDefinitionState } = await agent.modules.anoncreds.registerCredentialDefinition({
  credentialDefinition: { issuerId, schemaId, tag: 'revocable' },
  options: { supportRevocation: true },
})
if (credentialDefinitionState.state !== 'finished') {
  throw new Error(`Registering the credential definition failed: ${credentialDefinitionState.state}`)
}

const { revocationRegistryDefinitionState } = await agent.modules.anoncreds.registerRevocationRegistryDefinition({
  revocationRegistryDefinition: {
    issuerId,
    credentialDefinitionId: credentialDefinitionState.credentialDefinitionId,
    tag: 'default',
    maximumCredentialNumber: 1000,
  },
  options: {},
})
if (revocationRegistryDefinitionState.state !== 'finished') {
  throw new Error(`Registering the revocation registry failed: ${revocationRegistryDefinitionState.state}`)
}
const revocationRegistryDefinitionId = revocationRegistryDefinitionState.revocationRegistryDefinitionId

// The initial list, in which no credential is revoked
const { revocationStatusListState } = await agent.modules.anoncreds.registerRevocationStatusList({
  revocationStatusList: { issuerId, revocationRegistryDefinitionId },
  options: {},
})
if (revocationStatusListState.state !== 'finished') {
  throw new Error(`Registering the revocation status list failed: ${revocationStatusListState.state}`)
}
```

:::

Credo marks the registry as active, and you can issue up to `maximumCredentialNumber` credentials with it. Each credential gets an index in the registry, which you choose when you issue and must track yourself. To revoke, publish a new status list with the revoked indexes:

:::issuer

```ts
// Revoke the credentials issued with revocationRegistryIndex 1 and 2
const { revocationStatusListState: updatedState } = await agent.modules.anoncreds.updateRevocationStatusList({
  revocationStatusList: { revocationRegistryDefinitionId, revokedCredentialIndexes: [1, 2] },
  options: {},
})
if (updatedState.state !== 'finished') throw new Error(`Revoking failed: ${updatedState.state}`)
```

:::

[AnonCreds with DIDComm](https://credo.js.org/guides/next/protocols/didcomm/anoncreds.md#revocation) shows how to issue revocable credentials, notify holders and request proof of non-revocation.

## Link secrets and stored credentials

A link secret is the holder's secret that all its AnonCreds credentials are bound to. By default (`autoCreateLinkSecret: true`) Credo creates one on the first credential request. The first link secret becomes the default. You can also create one yourself, and `getLinkSecretIds` lists them:

:::holder

```ts
// Optional: without a link secret, one is created on the first credential request
const linkSecretId = await agent.modules.anoncreds.createLinkSecret({ setAsDefault: true })

const credentials = await agent.modules.anoncreds.getCredentials({ credentialDefinitionId })
for (const credential of credentials) {
  console.log(credential.credentialId, credential.attributes, credential.linkSecretId === linkSecretId)
}
```

:::

The holder stores AnonCreds credentials as W3C VCDM 1.1 credentials (`W3cCredentialRecord`) with a `DataIntegrityProof` using the `anoncreds-2023` cryptosuite. `getCredentials` filters them by credential definition, schema or issuer and returns the attributes and identifiers, and `getCredential(id)` returns one. `agent.w3cCredentials` lists the same records, but its `verifyCredential` rejects AnonCreds proofs.

## Verifying

A verifier checks AnonCreds presentations during the [Present Proof](https://credo.js.org/guides/next/protocols/didcomm/present-proof.md) exchange. It resolves the schemas, credential definitions and status lists from the registries. Which issuers you accept is part of the proof request, through `restrictions`. The agent's [trusted issuers](https://credo.js.org/guides/next/dids-and-trust/trust.md) configuration doesn't apply to AnonCreds.
