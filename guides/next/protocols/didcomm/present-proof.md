# Requesting proofs

> Request and verify presentations over DIDComm with the Present Proof v2 protocol, using AnonCreds or DIF Presentation Exchange.

Present Proof v2 ([Aries RFC 0454](https://github.com/decentralized-identity/aries-rfcs/tree/main/features/0454-present-proof-v2)) lets a verifier request a presentation from a connected holder and verify it. Like issuance, the protocol relies on format services for the request and presentation. This page shows the protocol with DIF Presentation Exchange and a W3C JSON-LD credential. You need an agent with the DIDComm module and a connection, see [DIDComm](https://credo.js.org/guides/next/protocols/didcomm.md) and [Connections](https://credo.js.org/guides/next/protocols/didcomm/connections.md).

## Register proof formats

The proofs module that `DidCommModule` enables by default runs Present Proof v2 without formats. Pass a `DidCommProofV2Protocol` with the format services you need, on both the verifier and the holder.

```ts
import { Agent, type KeyDidCreateOptions, w3cDate } from '@credo-ts/core'
import {
  DidCommAutoAcceptCredential,
  DidCommCredentialEventTypes,
  DidCommCredentialState,
  type DidCommCredentialStateChangedEvent,
  DidCommCredentialV2Protocol,
  DidCommDifPresentationExchangeProofFormatService,
  DidCommHttpOutboundTransport,
  DidCommJsonLdCredentialFormatService,
  DidCommModule,
  DidCommProofEventTypes,
  DidCommProofState,
  type DidCommProofStateChangedEvent,
  DidCommProofV2Protocol,
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
          credentialProtocols: [
            new DidCommCredentialV2Protocol({ credentialFormats: [new DidCommJsonLdCredentialFormatService()] }),
          ],
        },
        proofs: {
          proofProtocols: [
            new DidCommProofV2Protocol({
              proofFormats: [new DidCommDifPresentationExchangeProofFormatService()],
            }),
          ],
        },
      }),
    },
  })
}
```

| Format | Format service | Import from | Key | Presents |
| --- | --- | --- | --- | --- |
| AnonCreds | `AnonCredsDidCommProofFormatService` | `@credo-ts/anoncreds/didcomm` | `anoncreds` | AnonCreds credentials |
| AnonCreds with Hyperledger Indy attachments | `LegacyIndyDidCommProofFormatService` | `@credo-ts/anoncreds/didcomm` | `indy` | AnonCreds credentials |
| DIF Presentation Exchange ([RFC 0510](https://github.com/decentralized-identity/aries-rfcs/tree/main/features/0510-dif-pres-exch-attach)) | `DidCommDifPresentationExchangeProofFormatService` | `@credo-ts/didcomm` | `presentationExchange` | W3C VCDM 1.1 credentials as JSON-LD (`ldp_vp`) or JWT (`jwt_vp`) presentations, and AnonCreds credentials issued in W3C format |

Use `anoncreds` for AnonCreds credentials and `presentationExchange` for W3C credentials. Present Proof doesn't support SD-JWT VC, mdoc or W3C VCDM 2.0 credentials, including the VCDM 2.0 credentials you can receive over DIDComm. Present SD-JWT VC, mdoc and VCDM 2.0 SD-JWT credentials with [OpenID4VC](https://credo.js.org/guides/next/protocols/openid4vc.md) instead.

The Presentation Exchange format uses version 1 presentation definitions, which need a `schema` on each input descriptor.

## How a presentation works

```mermaid
sequenceDiagram
  participant Verifier
  participant Holder
  opt Holder starts
    Holder->>Verifier: propose-presentation
  end
  Verifier->>Holder: request-presentation
  Note over Holder: selects credentials
  Holder->>Verifier: presentation
  Note over Verifier: verifies the presentation
  Verifier->>Holder: ack
```

The verifier usually starts with a request. The holder can also propose what it wants to share with `proposeProof`, and the verifier answers with `acceptProposal`. Both sides track the exchange in a `DidCommProofExchangeRecord`.

## Request a proof

:::verifier

```ts
await verifier.didcomm.proofs.requestProof({
  connectionId,
  protocolVersion: 'v2',
  proofFormats: {
    presentationExchange: {
      presentationDefinition: {
        id: 'credo-docs-badge',
        input_descriptors: [
          {
            id: 'open-badge',
            schema: [{ uri: 'https://purl.imsglobal.org/spec/ob/v3p0/context.json' }],
            constraints: {
              fields: [
                {
                  path: ['$.credentialSubject.achievement.name'],
                  filter: { type: 'string', const: 'Read the Credo docs' },
                },
              ],
            },
          },
        ],
      },
    },
  },
})
```

:::

Credo looks up candidate credentials by the `schema` URI, which matches a JSON-LD context or an expanded type of the credential. The `constraints` then filter on the credential's content with JSONPath and JSON Schema. Credo adds a random challenge to the request, which the holder signs, unless you set `options.challenge` yourself.

To request a proof without a connection, create it with `createRequest` and attach the returned `message` to an out-of-band invitation, with `handshake: false` to skip creating a connection.

## Respond to a request

:::holder

```ts
holder.events.on<DidCommProofStateChangedEvent>(
  DidCommProofEventTypes.ProofStateChanged,
  async ({ payload: { proofRecord } }) => {
    if (proofRecord.state !== DidCommProofState.RequestReceived) return

    // Picks the first matching credential for every requested item
    const { proofFormats } = await holder.didcomm.proofs.selectCredentialsForRequest({
      proofExchangeRecordId: proofRecord.id,
    })

    await holder.didcomm.proofs.acceptRequest({ proofExchangeRecordId: proofRecord.id, proofFormats })
  }
)
```

:::

`selectCredentialsForRequest` picks the first matching credential for each requested item and throws if something can't be satisfied. To let the user choose, call `getCredentialsForRequest`, which lists all candidates per item, and pass the chosen credentials in `proofFormats` to `acceptRequest`. `declineRequest` rejects the request.

The holder signs a JSON-LD or JWT presentation with an `authentication` key of the DID in `credentialSubject.id`, so that DID must be one the holder created in its agent.

## Check the result

The verifier verifies the presentation as soon as it arrives. A valid presentation moves the exchange to `PresentationReceived` with `isVerified: true`. An invalid one moves it to `Abandoned`, sets `errorMessage` and sends a problem report to the holder.

:::verifier

```ts
verifier.events.on<DidCommProofStateChangedEvent>(
  DidCommProofEventTypes.ProofStateChanged,
  async ({ payload: { proofRecord } }) => {
    if (proofRecord.state === DidCommProofState.PresentationReceived) {
      // Only valid presentations reach this state, so `proofRecord.isVerified` is true
      const { presentation } = await verifier.didcomm.proofs.getFormatData(proofRecord.id)
      console.log('Verified presentation', JSON.stringify(presentation?.presentationExchange))

      // Sends the ack and completes the exchange
      await verifier.didcomm.proofs.acceptPresentation({ proofExchangeRecordId: proofRecord.id })
    }

    if (proofRecord.state === DidCommProofState.Abandoned) {
      console.log('Verification failed', proofRecord.errorMessage)
    }
  }
)
```

:::

Verification covers the signatures, the challenge, holder binding and whether the presentation satisfies the request. Which issuers you trust is up to you: restrict them in the request (for AnonCreds with `restrictions`), configure [trusted issuers](https://credo.js.org/guides/next/dids-and-trust/trust.md) for W3C credentials, or check the issuer in the format data.

`acceptPresentation` sends the ack and completes the exchange. With `ContentApproved` auto-accept, Credo sends the ack for you, so leave that call out.

## Auto-accept

Set `autoAcceptProofs` on the proofs module, or `autoAcceptProof` on a single API call.

| `DidCommAutoAcceptProof` | Behaviour |
| --- | --- |
| `Never` (default) | Every step needs an API call: `acceptRequest`, `acceptPresentation`, and so on. |
| `ContentApproved` | The holder answers a request automatically only when it matches the holder's own proposal. The verifier acknowledges valid presentations automatically. |
| `Always` | The holder answers every request with automatically selected credentials, without asking the user. |

The verifier only acknowledges automatically when the request had `willConfirm` set, which is the default.

For a verifier, `ContentApproved` saves the `acceptPresentation` call. For a wallet, use `ContentApproved` or `Never`, so the user approves each request. `Always` shares credentials without asking the user.

## States and events

Listen to `DidCommProofEventTypes.ProofStateChanged`. The payload has the `proofRecord` and its `previousState`.

| `DidCommProofState` | Agent | Next step |
| --- | --- | --- |
| `ProposalSent` | holder | wait for the request |
| `ProposalReceived` | verifier | `acceptProposal` or `negotiateProposal` |
| `RequestSent` | verifier | wait for the presentation |
| `RequestReceived` | holder | `acceptRequest`, `declineRequest` or `negotiateRequest` |
| `PresentationSent` | holder | wait for the ack |
| `PresentationReceived` | verifier | the presentation is valid, `acceptPresentation` sends the ack |
| `Done` | both | |
| `Declined` | holder | |
| `Abandoned` | both | the exchange failed, `errorMessage` says why |

`agent.didcomm.proofs.getFormatData(proofRecordId)` returns the proposal, request and presentation per format.
