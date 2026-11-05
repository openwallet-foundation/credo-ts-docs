# W3C VCs with DIDComm

> Issue W3C Verifiable Credentials over DIDComm as JSON-LD, Data Integrity or VCDM 2.0 SD-JWT credentials, and present them with DIF Presentation Exchange.

Credo issues W3C Verifiable Credentials over DIDComm with three credential formats, and presents VCDM 1.1 credentials with DIF Presentation Exchange. This page covers the options and limits of each format. The protocol flow itself is on [Issuing credentials](https://credo.js.org/guides/next/protocols/didcomm/issue-credential.md) and [Requesting proofs](https://credo.js.org/guides/next/protocols/didcomm/present-proof.md), and the credential model on [W3C Verifiable Credentials](https://credo.js.org/guides/next/credential-formats/w3c-vc.md).

## Formats

| Format key | Spec | Credential | Holder binding | Stored as | Present over DIDComm |
| --- | --- | --- | --- | --- | --- |
| `jsonld` | [RFC 0593](https://github.com/decentralized-identity/aries-rfcs/tree/main/features/0593-json-ld-cred-attach) | VCDM 1.1 with an Ed25519 Linked Data signature | DID in `credentialSubject.id` | `W3cCredentialRecord` | yes, as `ldp_vp` |
| `dataIntegrity` | [RFC 0809](https://github.com/decentralized-identity/aries-rfcs/tree/main/features/0809-w3c-data-integrity-credential-attachment) | VCDM 1.1 with a Linked Data signature, or VCDM 2.0 with a Data Integrity proof | signed nonce, AnonCreds link secret, or DID in `credentialSubject.id` | VCDM 1.1: `W3cCredentialRecord`, VCDM 2.0: `W3cV2CredentialRecord` | VCDM 1.1 only |
| `w3cV2SdJwt` | [RFC 0881](https://github.com/decentralized-identity/aries-rfcs/tree/main/features/0881-w3c-vc-sd-jwt-credential-attachment) | VCDM 2.0 secured with SD-JWT (`vc+sd-jwt`) | signed nonce, as `cnf` | `W3cV2CredentialRecord` | no |

`vc+sd-jwt` here is a W3C VCDM 2.0 credential secured with SD-JWT, not an IETF [SD-JWT VC](https://credo.js.org/guides/next/credential-formats/sd-jwt-vc.md) (`dc+sd-jwt`). There is no DIDComm format for SD-JWT VC, mdoc or VCDM 1.1 JWT credentials.

Use `jsonld` when holders present the credential over DIDComm. Use `w3cV2SdJwt` for VCDM 2.0 credentials with selective disclosure, which holders present with OpenID4VP. Use `dataIntegrity` for [AnonCreds credentials in W3C format](https://credo.js.org/guides/next/protocols/didcomm/anoncreds.md#anoncreds-in-w3c-format), or for agents that only support RFC 0809.

## Set up

Register the formats you need on both agents:

```ts
import { Agent, DidKey, type KeyDidCreateOptions, w3cDate } from '@credo-ts/core'
import {
  DidCommAutoAcceptCredential,
  DidCommCredentialEventTypes,
  DidCommCredentialState,
  type DidCommCredentialStateChangedEvent,
  DidCommCredentialV2Protocol,
  DidCommDataIntegrityCredentialFormatService,
  DidCommHttpOutboundTransport,
  DidCommJsonLdCredentialFormatService,
  DidCommModule,
  DidCommW3cV2SdJwtCredentialFormatService,
} from '@credo-ts/didcomm'
import { agentDependencies, DidCommHttpInboundTransport } from '@credo-ts/node'

function createAgent(port: number, storage: ExampleStorage) {
  return new Agent({
    dependencies: agentDependencies,
    modules: {
      ...storage, // Storage and key management, see Agent setup
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
                new DidCommJsonLdCredentialFormatService(),
                new DidCommDataIntegrityCredentialFormatService(),
                new DidCommW3cV2SdJwtCredentialFormatService(),
              ],
            }),
          ],
        },
      }),
    },
  })
}
```

The issuer signs with a key of a DID it created in its own agent, for example a `did:key`:

:::issuer

```ts
const { didState } = await issuer.dids.create<KeyDidCreateOptions>({
  method: 'key',
  options: { createKey: { type: { kty: 'OKP', crv: 'Ed25519' } } },
})
if (didState.state !== 'finished') throw new Error('Creating the issuer DID failed')
const issuerDid = didState.did
```

:::

## JSON-LD credentials

:::issuer

```ts
await issuer.didcomm.credentials.offerCredential({
  connectionId,
  protocolVersion: 'v2',
  credentialFormats: {
    jsonld: {
      credential: {
        '@context': ['https://www.w3.org/2018/credentials/v1', 'https://purl.imsglobal.org/spec/ob/v3p0/context.json'],
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuer: issuerDid,
        issuanceDate: w3cDate(),
        credentialSubject: {
          id: holderDid,
          type: ['AchievementSubject'],
          achievement: {
            id: 'https://example.com/achievements/credo-docs',
            type: ['Achievement'],
            name: 'Read the Credo docs',
          },
        },
      },
      // did:key Ed25519 keys are Ed25519VerificationKey2018 verification methods
      options: { proofType: 'Ed25519Signature2018', proofPurpose: 'assertionMethod' },
    },
  },
})
```

:::

The holder accepts the offer without format options, and stores the credential as a `W3cCredentialRecord`.

Credo signs with `Ed25519Signature2018` or `Ed25519Signature2020`, so the issuer needs an Ed25519 key. Each suite only accepts its own verification method type: a `did:key` has `Ed25519VerificationKey2018` methods, so use `Ed25519Signature2018`, with `proofPurpose: 'assertionMethod'`. Credo signs with the first verification method of the issuer DID that fits the proof type. Pass `jsonld: { verificationMethod }` to `acceptRequest` to choose another.

Every `@context` must resolve. Credo bundles common contexts, such as the VC data model, the security suites, Open Badges 3.0 and schema.org, and fetches others over the network. [W3C Verifiable Credentials](https://credo.js.org/guides/next/credential-formats/w3c-vc.md) shows how to add your own.

- Don't add `credentialStatus`. Credo can't check W3C credential status, so the holder fails to verify such a credential.
- The holder proves control of the DID in `credentialSubject.id` when it presents the credential. To learn the holder's DID, let the holder [start with a proposal](https://credo.js.org/guides/next/protocols/didcomm/issue-credential.md#start-with-a-proposal) that contains it.

## Present VCDM 1.1 credentials

Present JSON-LD credentials, and VCDM 1.1 Data Integrity credentials, with the DIF Presentation Exchange format, as shown on [Requesting proofs](https://credo.js.org/guides/next/protocols/didcomm/present-proof.md). The holder signs an `ldp_vp` presentation with an `authentication` key of the DID in `credentialSubject.id`. VCDM 1.1 JWT credentials you received another way, such as with OpenID4VC, can be presented as `jwt_vp`.

## VCDM 2.0 SD-JWT credentials

The RFC 0881 format issues a VCDM 2.0 credential secured with SD-JWT, with selectively disclosable claims.

:::issuer

```ts
await issuer.didcomm.credentials.offerCredential({
  connectionId,
  protocolVersion: 'v2',
  credentialFormats: {
    w3cV2SdJwt: {
      credential: {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        type: ['VerifiableCredential', 'EmployeeCredential'],
        issuer: issuerDid,
        validFrom: w3cDate(),
        credentialSubject: { name: 'Jane Doe', role: 'Developer' },
      },
      disclosureFrame: { credentialSubject: { _sd: ['name', 'role'] } },
      // The holder proves control of a DID, which becomes the credential subject and `cnf`
      bindingRequired: true,
      didCommSignedAttachmentBinding: {},
    },
  },
})
```

:::

`credential` is a VCDM 2.0 credential without proof. You can leave out `issuer` and pass it to `acceptRequest` instead. `disclosureFrame` lists the claims the holder can disclose selectively. `@context`, `type`, `credentialStatus`, `credentialSchema` and `relatedResource` can't be selectively disclosable at the top level.

With `bindingRequired` and `didCommSignedAttachmentBinding`, the holder must sign a nonce with a key of one of its DIDs. Restrict the accepted keys with `didMethodsSupported` and `algsSupported`. Without binding, anyone who has the credential can present it, so require binding unless you want a bearer credential.

Auto-accept can't answer an offer that requires binding. The holder calls `acceptOffer` and picks the key:

:::holder

```ts
await holder.didcomm.credentials.acceptOffer({
  credentialExchangeRecordId: credentialExchangeRecord.id,
  credentialFormats: {
    // Signs the issuer's nonce with this key, the issuer binds the credential to it
    w3cV2SdJwt: { didCommSignedAttachment: { kid: holderKid } },
  },
})
```

:::

The issuer sets the holder's DID as `credentialSubject.id` and the key as `cnf`, signs the credential and sends it. With `ContentApproved` this happens automatically. Otherwise call `acceptRequest`, where you can also set `alg`, `issuerVerificationMethod`, `disclosureFrame` or `credentialSubjectId`. The holder verifies the credential, checks that it matches the offer and stores it as a `W3cV2CredentialRecord`.

The exchange always starts with an offer: proposals and holder-initiated requests aren't supported. Holders can't present these credentials over DIDComm. They present them with [OpenID4VP](https://credo.js.org/guides/next/protocols/openid4vc/w3c.md).

## Data Integrity credentials

The RFC 0809 format issues VCDM 1.1 and 2.0 credentials. The first `@context` entry decides the data model.

:::issuer

```ts
await issuer.didcomm.credentials.offerCredential({
  connectionId,
  protocolVersion: 'v2',
  credentialFormats: {
    dataIntegrity: {
      credential: {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        type: ['VerifiableCredential', 'EmployeeCredential'],
        issuer: issuerDid,
        validFrom: w3cDate(),
        credentialSubject: { id: holderDid, name: 'Jane Doe', role: 'Developer' },
      },
      bindingRequired: false,
    },
  },
})
```

:::

A VCDM 1.1 credential gets a Linked Data signature, as with the JSON-LD format. A VCDM 2.0 credential gets a Data Integrity proof with `eddsa-jcs-2022`, the only cryptosuite Credo registers, so the issuer needs an Ed25519 key. The exchange always starts with an offer.

Binding with `didCommSignedAttachmentBinding` works as in the RFC 0881 format, but the issuer doesn't derive `credentialSubject.id` from it. Put the holder's DID in the offer, or pass `credentialSubjectId` to `acceptRequest`; without a subject id, auto-accept doesn't issue the credential. The `anonCredsLinkSecretBinding` option issues AnonCreds credentials in W3C format, see [AnonCreds with DIDComm](https://credo.js.org/guides/next/protocols/didcomm/anoncreds.md#anoncreds-in-w3c-format).

For VCDM 2.0 credentials:

- Credo doesn't check the holder's binding proof. Put the holder's DID in `credentialSubject.id` instead.
- The holder stores the credential as a `W3cV2CredentialRecord`, but the exchange record lists it with `credentialRecordType: 'w3c'`. Look it up with `agent.w3cV2Credentials.getById`.
- The credential can't be presented over DIDComm or OpenID4VC.
