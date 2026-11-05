# Credential formats

> The credential formats Credo supports, how they compare, and which one to use.

A credential format defines what a credential looks like, how the issuer signs it and how the holder presents it. Formats are separate from exchange protocols: you can sign, store, present and verify a credential with the agent APIs alone, and most formats work over more than one protocol. The pages in this section cover each format on its own. For the flows, see [Protocols](https://credo.js.org/guides/next/protocols.md).

## Compare the formats

| | [SD-JWT VC](https://credo.js.org/guides/next/credential-formats/sd-jwt-vc.md) | [mdoc](https://credo.js.org/guides/next/credential-formats/mdoc.md) | [W3C VC](https://credo.js.org/guides/next/credential-formats/w3c-vc.md) | [AnonCreds](https://credo.js.org/guides/next/credential-formats/anoncreds.md) |
| --- | --- | --- | --- | --- |
| Standard | IETF | ISO/IEC 18013-5 | W3C | Hyperledger AnonCreds |
| Selective disclosure | Per claim | Per data element | Only data model 2.0 secured as SD-JWT | Per attribute, plus predicates such as "age at least 18" |
| Unlinkable presentations | With batch issuance | With batch issuance | With batch issuance | Yes |
| Holder binding | Key (`cnf`), as JWK or DID | Device key | DID of the subject, or key (`cnf`) in data model 2.0 | Link secret |
| Issuer signs with | DID or X.509 certificate | X.509 certificate | DID | Keys of a credential definition on a registry |
| Revocation in Credo | [Token Status List](https://credo.js.org/guides/next/credential-formats/status-lists.md) | [Token Status List](https://credo.js.org/guides/next/credential-formats/status-lists.md) | None | Revocation registry |
| Exchange in Credo | OpenID4VC, Digital Credentials API | OpenID4VC, Digital Credentials API, ISO 18013-5 proximity | OpenID4VC, DIDComm, depending on the variant | DIDComm |
| Used in | EUDI Wallet (PID and attestations) | Mobile driving licence, EUDI Wallet (PID) | Open Badges, EBSI | Aries and Indy based ecosystems |

For SD-JWT VC, mdoc and W3C VCs, every presentation of a credential carries the same issuer signature, so verifiers that compare notes can link presentations of it. Batch issuance avoids that: the holder gets several copies, each bound to its own key, and presents each copy once. AnonCreds presentations are zero-knowledge proofs and don't need this.

For the protocol versions and the full matrix, see [Supported standards](https://credo.js.org/guides/next/supported-standards.md).

## Which one should I use?

Follow your ecosystem first. Without a required format:

| You're building | Use |
| --- | --- |
| An issuer, wallet or verifier for the EUDI Wallet | SD-JWT VC and mdoc. The EUDI Wallet uses both, including for the PID. |
| A mobile driving licence, or in-person presentation over NFC or Bluetooth | mdoc. It's the only format Credo presents with ISO 18013-5. |
| A new OpenID4VC deployment | SD-JWT VC. It has selective disclosure, plain JSON claims, and works with both DIDs and X.509 certificates. |
| Something for an ecosystem built on W3C VCs, such as EBSI or Open Badges | W3C VC. [Choose a variant](https://credo.js.org/guides/next/credential-formats/w3c-vc.md#choose-a-variant) explains which one. |
| A DIDComm deployment that needs predicates, or unlinkable presentations without batch issuance | AnonCreds. |

## Choices for every format

### Holder binding

Bind credentials to a key of the holder, so that a copy of a credential is useless to someone else. For SD-JWT VC and W3C data model 2.0, bind to a JWK by default: the holder needs no DID, and the key can stay in the secure hardware of a phone. Bind to a DID when holders and verifiers already use DIDs. mdocs are always bound to a device key, AnonCreds credentials to the link secret, and W3C data model 1.1 credentials to the DID in `credentialSubject.id`.

### Key type

For SD-JWT VC and mdoc, use P-256 keys (ES256) for both issuer and holder. HAIP requires every party to support ES256, and it's the curve that the secure hardware of phones supports. W3C JSON-LD and Data Integrity credentials need Ed25519 keys, because all signature suites that Credo has for them use Ed25519.

### Revocation

Use a status list or revocation registry only if you must be able to revoke credentials before they expire. Short-lived credentials that you reissue don't need one. See [Status lists](https://credo.js.org/guides/next/credential-formats/status-lists.md) and [AnonCreds revocation](https://credo.js.org/guides/next/credential-formats/anoncreds.md#revocation).

## Agent APIs

| Format | Agent API | Record |
| --- | --- | --- |
| SD-JWT VC | `agent.sdJwtVc` | `SdJwtVcRecord` |
| mdoc | `agent.mdoc` | `MdocRecord` |
| W3C VC 1.1 | `agent.w3cCredentials` | `W3cCredentialRecord` |
| W3C VC 2.0 | `agent.w3cV2Credentials` | `W3cV2CredentialRecord` |
| AnonCreds | `agent.modules.anoncreds` (the key you register it under) | `W3cCredentialRecord` |

All formats except AnonCreds are part of `@credo-ts/core`, and their modules are registered on every agent. AnonCreds needs `@credo-ts/anoncreds` and a registry such as a ledger.

- [SD-JWT VC](https://credo.js.org/guides/next/credential-formats/sd-jwt-vc.md): Sign, store, present and verify IETF SD-JWT VCs with agent.sdJwtVc, independent of the exchange protocol.
- [mdoc](https://credo.js.org/guides/next/credential-formats/mdoc.md): Sign, store, present and verify ISO 18013-5 mdocs, such as the mobile driving licence, with agent.mdoc.
- [W3C Verifiable Credentials](https://credo.js.org/guides/next/credential-formats/w3c-vc.md): Sign, store, present and verify W3C Verifiable Credentials (data model 1.1 and 2.0) as JWT, SD-JWT, JSON-LD or Data Integrity.
- [AnonCreds](https://credo.js.org/guides/next/credential-formats/anoncreds.md): Set up AnonCreds in Credo with a registry, register schemas, credential definitions and revocation registries, and manage link secrets and stored credentials.
- [Status lists](https://credo.js.org/guides/next/credential-formats/status-lists.md): Revoke and suspend SD-JWT VCs and mdocs with IETF Token Status Lists, using agent.tokenStatusList.
