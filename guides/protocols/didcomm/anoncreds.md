# AnonCreds with DIDComm

> Issue AnonCreds credentials and request proofs with predicates over DIDComm, and handle revocation.

You exchange AnonCreds credentials over DIDComm, with [Issue Credential v2](https://credo.js.org/guides/protocols/didcomm/issue-credential.md) and [Present Proof v2](https://credo.js.org/guides/protocols/didcomm/present-proof.md). This page issues a credential and requests a proof with a predicate, then covers revocation. The AnonCreds specification calls the holder the prover when it presents. Both agents need the `AnonCredsModule` with a registry, and the issuer needs a registered credential definition: see [AnonCreds](https://credo.js.org/guides/credential-formats/anoncreds.md).

## Register the format services

The AnonCreds format services are exported from `@credo-ts/anoncreds/didcomm` since Credo 0.7.2. `@credo-ts/anoncreds` still exports them too, but those exports are deprecated and removed in 0.8. Register the services on both the credentials and the proofs protocol.

```ts
import { AnonCredsModule } from '@credo-ts/anoncreds'
import {
  AnonCredsDidCommCredentialFormatService,
  AnonCredsDidCommProofFormatService,
  LegacyIndyDidCommCredentialFormatService,
  LegacyIndyDidCommProofFormatService,
} from '@credo-ts/anoncreds/didcomm'
import { CheqdDidRegistrar, CheqdDidResolver, CheqdModule } from '@credo-ts/cheqd'
import { CheqdAnonCredsRegistry } from '@credo-ts/cheqd/anoncreds'
import { Agent, DidsModule } from '@credo-ts/core'
import {
  DidCommAutoAcceptCredential,
  DidCommAutoAcceptProof,
  DidCommCredentialEventTypes,
  DidCommCredentialState,
  type DidCommCredentialStateChangedEvent,
  DidCommCredentialV2Protocol,
  DidCommHttpOutboundTransport,
  DidCommModule,
  DidCommProofEventTypes,
  DidCommProofState,
  type DidCommProofStateChangedEvent,
  DidCommProofV2Protocol,
} from '@credo-ts/didcomm'
import { agentDependencies, DidCommHttpInboundTransport } from '@credo-ts/node'
import { NativeAnoncreds } from '@hyperledger/anoncreds-nodejs'

function createAgent(port: number, storage: ExampleStorage) {
  return new Agent({
    dependencies: agentDependencies,
    modules: {
      ...storage, // Storage and key management, see Agent setup
      // The registry and its DID module, see the AnonCreds page
      cheqd: new CheqdModule({ networks: [{ network: 'testnet', cosmosPayerSeed: '<cosmos payer seed>' }] }),
      dids: new DidsModule({ registrars: [new CheqdDidRegistrar()], resolvers: [new CheqdDidResolver()] }),
      anoncreds: new AnonCredsModule({ anoncreds: NativeAnoncreds, registries: [new CheqdAnonCredsRegistry()] }),
      didcomm: new DidCommModule({
        endpoints: [`http://localhost:${port}`],
        transports: {
          inbound: [new DidCommHttpInboundTransport({ port })],
          outbound: [new DidCommHttpOutboundTransport()],
        },
        connections: { autoAcceptConnections: true },
        credentials: {
          autoAcceptCredentials: DidCommAutoAcceptCredential.ContentApproved,
          credentialProtocols: [
            new DidCommCredentialV2Protocol({
              credentialFormats: [
                new AnonCredsDidCommCredentialFormatService(),
                new LegacyIndyDidCommCredentialFormatService(),
              ],
            }),
          ],
        },
        proofs: {
          autoAcceptProofs: DidCommAutoAcceptProof.ContentApproved,
          proofProtocols: [
            new DidCommProofV2Protocol({
              proofFormats: [new AnonCredsDidCommProofFormatService(), new LegacyIndyDidCommProofFormatService()],
            }),
          ],
        },
      }),
    },
  })
}
```

There are two formats for the same credentials. `anoncreds` uses the AnonCreds attachments of [RFC 0771](https://github.com/decentralized-identity/aries-rfcs/tree/main/features/0771-anoncreds-attachments). `indy` uses the older Hyperledger Indy attachments of [RFC 0592](https://github.com/decentralized-identity/aries-rfcs/tree/main/features/0592-indy-attachments), which some agents still require. Their API options are the same, under the `anoncreds` or `indy` key. The deprecated Issue Credential v1 and Present Proof v1 protocols only support the `indy` format, see [Issuing credentials](https://credo.js.org/guides/protocols/didcomm/issue-credential.md#issue-credential-v1).

## Issue a credential

:::issuer

```ts
await issuer.didcomm.credentials.offerCredential({
  connectionId,
  protocolVersion: 'v2',
  credentialFormats: {
    anoncreds: {
      credentialDefinitionId,
      // Values are strings, also for numbers you want to use in predicates
      attributes: [
        { name: 'name', value: 'Jane Doe' },
        { name: 'role', value: 'Developer' },
        { name: 'age', value: '32' },
      ],
    },
  },
})
```

:::

The attribute names must match the schema of the credential definition exactly: no missing and no extra attributes. AnonCreds values are strings. Predicates work on attributes whose value is an integer string.

:::holder

```ts
holder.events.on<DidCommCredentialStateChangedEvent>(
  DidCommCredentialEventTypes.DidCommCredentialStateChanged,
  async ({ payload: { credentialExchangeRecord } }) => {
    if (credentialExchangeRecord.state !== DidCommCredentialState.OfferReceived) return

    // The attribute names and values to show to the user
    console.log(credentialExchangeRecord.credentialAttributes)

    // Uses the default link secret, and creates it if there is none yet
    await holder.didcomm.credentials.acceptOffer({ credentialExchangeRecordId: credentialExchangeRecord.id })
  }
)
```

:::

The holder binds the credential to its link secret. Credo creates a default link secret on the first credential request if there is none. To use another one, create it with `agent.modules.anoncreds.createLinkSecret` and pass `credentialFormats: { anoncreds: { linkSecretId } }` to `acceptOffer`. The holder stores the credential as a W3C credential record. [AnonCreds](https://credo.js.org/guides/credential-formats/anoncreds.md) shows how to query it.

## Request a proof

:::verifier

```ts
await issuer.didcomm.proofs.requestProof({
  connectionId,
  protocolVersion: 'v2',
  proofFormats: {
    anoncreds: {
      name: 'Employee check',
      version: '1.0',
      requested_attributes: {
        name: { name: 'name', restrictions: [{ cred_def_id: credentialDefinitionId }] },
        role: { name: 'role', restrictions: [{ cred_def_id: credentialDefinitionId }] },
      },
      requested_predicates: {
        // Proves age >= 18 without revealing the age
        adult: { name: 'age', p_type: '>=', p_value: 18, restrictions: [{ cred_def_id: credentialDefinitionId }] },
      },
    },
  },
})
```

:::

The keys of `requested_attributes` and `requested_predicates` (`name`, `role`, `adult`) are referents: names you choose to find the values in the presentation. Use `names: ['name', 'role']` instead of `name` to require attributes from the same credential. A predicate (`>=`, `>`, `<=` or `<` with an integer `p_value`) proves a comparison without revealing the value. Credo generates the `nonce` of the request when you leave it out.

`restrictions` decide which credentials qualify, for example by `cred_def_id`, `issuer_id` or `schema_id`. Without restrictions, the holder can use any credential with that attribute, including one it issued itself, so restrict every item to the issuers you trust.

:::holder

```ts
holder.events.on<DidCommProofStateChangedEvent>(
  DidCommProofEventTypes.ProofStateChanged,
  async ({ payload: { proofRecord } }) => {
    if (proofRecord.state !== DidCommProofState.RequestReceived) return

    // Lists all matching credentials per attribute and predicate, to let the user choose
    const { proofFormats: options } = await holder.didcomm.proofs.getCredentialsForRequest({
      proofExchangeRecordId: proofRecord.id,
    })
    console.log(options.anoncreds?.attributes)

    // Or let Credo pick the first match for each
    const { proofFormats } = await holder.didcomm.proofs.selectCredentialsForRequest({
      proofExchangeRecordId: proofRecord.id,
    })
    await holder.didcomm.proofs.acceptRequest({ proofExchangeRecordId: proofRecord.id, proofFormats })
  }
)
```

:::

All credentials in one presentation must be bound to the same link secret.

:::verifier

```ts
issuer.events.on<DidCommProofStateChangedEvent>(
  DidCommProofEventTypes.ProofStateChanged,
  async ({ payload: { proofRecord } }) => {
    if (proofRecord.state !== DidCommProofState.PresentationReceived) return

    // Only valid presentations reach this state, so `proofRecord.isVerified` is true
    const { presentation } = await issuer.didcomm.proofs.getFormatData(proofRecord.id)
    const revealedAttributes = presentation?.anoncreds?.requested_proof.revealed_attrs ?? {}
    for (const [referent, { raw }] of Object.entries(revealedAttributes)) {
      console.log(referent, raw)
    }
  }
)
```

:::

The presentation contains the revealed attribute values under their referents. Predicates appear only as proven, without the value.

## Revocation

Revocation needs a revocable credential definition with a revocation registry and status list. [AnonCreds](https://credo.js.org/guides/credential-formats/anoncreds.md) shows how to create them and how to revoke.

When you issue a revocable credential, pass the revocation registry and an index in it. Credo doesn't track which indexes you used: each credential needs its own, and you need the index later to revoke the credential.

:::issuer

```ts
await issuer.didcomm.credentials.offerCredential({
  connectionId,
  protocolVersion: 'v2',
  credentialFormats: {
    anoncreds: {
      credentialDefinitionId: revocableCredentialDefinitionId,
      attributes: [
        { name: 'name', value: 'Jane Doe' },
        { name: 'role', value: 'Developer' },
        { name: 'age', value: '32' },
      ],
      revocationRegistryDefinitionId,
      // Track which indexes you used, each credential needs its own
      revocationRegistryIndex: 1,
    },
  },
})
```

:::

After you revoke a credential, you can tell the holder with a revocation notification. The holder agent emits a `DidCommCredentialEventTypes.DidCommRevocationNotificationReceived` event and stores the notification on the exchange record (`revocationNotification`).

:::issuer

```ts
// After revoking index 1 with updateRevocationStatusList, optionally notify the holder
await issuer.didcomm.credentials.sendRevocationNotification({
  connectionId,
  revocationFormat: 'anoncreds',
  revocationId: `${revocationRegistryDefinitionId}::1`,
})
```

:::

A verifier that wants proof that a credential isn't revoked sets `non_revoked`, on the whole request or per attribute or predicate. Set `to`, the time in seconds. If you also set `from`, it must equal `to`.

:::verifier

```ts
await issuer.didcomm.proofs.requestProof({
  connectionId,
  protocolVersion: 'v2',
  proofFormats: {
    anoncreds: {
      name: 'Employee check',
      version: '1.0',
      // Require a proof that the credential was not revoked at this time (seconds)
      non_revoked: { to: Math.floor(Date.now() / 1000) },
      requested_attributes: {
        name: { name: 'name', restrictions: [{ cred_def_id: revocableCredentialDefinitionId }] },
      },
    },
  },
})
```

:::

The holder fetches the status list for that time from the registry. `selectCredentialsForRequest` skips revoked credentials, and throws when no valid credential is left.

## AnonCreds in W3C format

The [Data Integrity format](https://credo.js.org/guides/protocols/didcomm/w3c.md) can also issue AnonCreds credentials as W3C VCDM 1.1 credentials: offer with `anonCredsLinkSecretBinding: { credentialDefinitionId }` and `bindingRequired: true`, and register the `AnonCredsModule` on both agents. The offered credential may only contain `@context`, `type`, `issuer`, `issuanceDate` or `validFrom`, and `credentialSubject`, and `type` must be `['VerifiableCredential']`. Present these credentials with DIF Presentation Exchange.
