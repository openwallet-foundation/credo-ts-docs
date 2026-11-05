# mdoc

> Sign, store, present and verify ISO 18013-5 mdocs, such as the mobile driving licence, with agent.mdoc.

An mdoc is the credential format of [ISO/IEC 18013-5](https://www.iso.org/standard/69084.html), used for the mobile driving licence (mDL) and the EU PID. The issuer signs a salted digest of each data element with an X.509 certificate, and binds the mdoc to a device key of the holder. To present, the holder signs a device response that contains only the requested elements. This page covers `agent.mdoc` and `MdocDeviceResponse`. To issue and present mdocs over OpenID4VC, see [mdoc with OpenID4VC](https://credo.js.org/guides/next/protocols/openid4vc/mdoc.md). To present them in person or in the browser with the ISO protocols, see [Proximity (ISO 18013-5)](https://credo.js.org/guides/next/protocols/mdoc/proximity.md) and [Digital Credentials API (ISO 18013-7)](https://credo.js.org/guides/next/protocols/dc-api.md).

## Set up

Everything on this page is in `@credo-ts/core`. `MdocModule` is a default module without options, so every agent has `agent.mdoc`. The agent also needs [storage](https://credo.js.org/guides/next/agent-setup/storage.md) and key management. The examples use three agents: an issuer, a holder and a verifier.

```ts
import {
  Agent,
  DateOnly,
  Mdoc,
  MdocDeviceResponse,
  MdocRecord,
  X509ExtendedKeyUsage,
  X509KeyUsage,
} from '@credo-ts/core'
import { PublicJwk } from '@credo-ts/core/kms'
import { agentDependencies } from '@credo-ts/node'

function createAgent(storage: ExampleStorage) {
  return new Agent({
    dependencies: agentDependencies,
    modules: {
      ...storage, // Storage and key management, see Agent setup
    },
  })
}
```

## Create an issuer certificate

mdocs are always signed with an X.509 certificate, never with a DID. This example creates a self-signed document signer certificate from a key in the issuer's KMS:

:::issuer

```ts
const issuerKey = await issuer.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })

// A self-signed document signer certificate. Production issuers use a certificate issued by their IACA.
const issuerCertificate = await issuer.x509.createCertificate({
  authorityKey: PublicJwk.fromPublicJwk(issuerKey.publicJwk),
  // Verification fails when the subject has no country (C)
  issuer: { commonName: 'Example mDL Issuer', countryName: 'NL' },
  validity: { notBefore: new Date(), notAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
  extensions: {
    keyUsage: { usages: [X509KeyUsage.DigitalSignature] },
    extendedKeyUsage: { usages: [X509ExtendedKeyUsage.MdlDs] },
  },
})
```

:::

The certificate subject must include a country (`C`). Verification fails without it, and also when the mdoc has an `issuing_country` element that doesn't match. In production, the document signer certificate is issued by your IACA root certificate, and verifiers trust the root. See [X.509 certificates](https://credo.js.org/guides/next/dids-and-trust/x509.md).

## Sign an mdoc

:::issuer

```ts
// The device key of the wallet. In a real flow the wallet sends the public key, for example in an OpenID4VCI proof.
const deviceKey = await holder.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })

const mdoc = await issuer.mdoc.sign({
  docType: 'org.iso.18013.5.1.mDL',
  namespaces: {
    'org.iso.18013.5.1': {
      family_name: 'Doe',
      given_name: 'Jane',
      birth_date: new DateOnly('1990-01-01'),
      issuing_country: 'NL',
      age_over_18: true,
    },
  },
  // `signed` and `validFrom` default to the time of signing
  validityInfo: { validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  issuerCertificate,
  holderKey: PublicJwk.fromPublicJwk(deviceKey.publicJwk),
})

// base64url encoded IssuerSigned structure, as returned over OpenID4VCI
const issued = mdoc.base64Url
```

:::

- `docType` is the document type, such as `org.iso.18013.5.1.mDL`, and `namespaces` maps each namespace to its data elements. Use `DateOnly` from `@credo-ts/core` for elements that are a date without a time, such as `birth_date`.
- `validityInfo.validUntil` is required. `signed` and `validFrom` default to the time of signing. If you set `validFrom`, also set `signed` to a time no later than it, because signing fails when `validFrom` is before `signed`.
- `issuerCertificate` is the signing certificate, or a chain with the signing certificate first. Its key must be in the issuer's KMS. `holderKey` is the public device key the mdoc is bound to.

`keyAuthorizations` lists the namespaces or elements the holder may sign itself (device-signed elements). By default there are none. `statusInfo` points to a status list entry, see [Status lists](https://credo.js.org/guides/next/credential-formats/status-lists.md).

The signature algorithm follows from the certificate key: ES256, ES384, ES512 or EdDSA. Use P-256 keys (ES256) for the certificate and the device key unless your ecosystem asks for something else: HAIP requires every party to support ES256, and the secure hardware of phones supports P-256. Element digests always use SHA-256.

## Store and query

The holder parses the received mdoc, verifies it, and stores it as an `MdocRecord`:

:::holder

```ts
const receivedMdoc = Mdoc.fromBase64Url(issued)
// The KMS key id is not part of the mdoc. Set it so Credo can sign device responses.
receivedMdoc.deviceKeyId = deviceKey.keyId

const verification = await holder.mdoc.verify(receivedMdoc, {
  trustedCertificates: [issuerCertificate.toString('pem')],
})
if (verification.isValid === false) throw new Error(verification.error)

const record = await holder.mdoc.store({ record: MdocRecord.fromMdoc(receivedMdoc) })

const [mdl] = await holder.mdoc.findAllByQuery({ docType: 'org.iso.18013.5.1.mDL' })
console.log(mdl.firstCredential.issuerSignedNamespaces)
```

:::

- `deviceKeyId` is the KMS key id of the device key. It isn't part of the mdoc, so set it before you store the mdoc. `MdocRecord.fromMdoc` copies it to the record.
- `verify` returns `{ isValid: true }` or `{ isValid: false, error }`, with `error` as a message. Without `trustedCertificates` it uses the agent's [trusted issuers](https://credo.js.org/guides/next/dids-and-trust/trust.md) configuration, and throws when no trusted certificates are configured at all.
- Records are tagged with `docType` and `alg`. `agent.mdoc` also has `getById`, `getAll`, `update` and `deleteById`. A record can hold several instances of the same mdoc, each bound to its own key, for batch issuance.

With [OpenID4VCI](https://credo.js.org/guides/next/protocols/openid4vc/mdoc.md), the holder flow verifies the mdoc and returns the `MdocRecord` for you. You only store it.

## Present

A presentation is a device response: the mdoc with only the requested elements, signed with the device key. Over OpenID4VP, Credo builds it for you. To build one yourself, use `MdocDeviceResponse.createDeviceResponse`:

:::holder

```ts
// Values the verifier sends in its OpenID4VP request
const sessionTranscriptOptions = {
  type: 'openId4Vp',
  clientId: 'x509_san_dns:verifier.example.com',
  responseUri: 'https://verifier.example.com/response',
  verifierGeneratedNonce: 'b5c2f9e1-3a7d-4c8b-9e0f-1d2a3b4c5d6e',
} as const

const deviceResponse = await MdocDeviceResponse.createDeviceResponse(holder.context, {
  mdocs: [record.firstCredential],
  documentRequests: [
    {
      docType: 'org.iso.18013.5.1.mDL',
      // Element identifier mapped to intent to retain
      nameSpaces: { 'org.iso.18013.5.1': { family_name: false, age_over_18: false } },
    },
  ],
  sessionTranscriptOptions,
})

const encodedDeviceResponse = deviceResponse.encoded
```

:::

- `documentRequests` lists the elements to disclose per namespace. Every element of an mdoc is selectively disclosable, so the response contains these elements and nothing else. The boolean is the verifier's intent to retain the element.
- `sessionTranscriptOptions` binds the response to one exchange. The `openId4Vp` and `openId4VpDcApi` types take the values from an OpenID4VP request. For other transports, such as [ISO 18013-5 proximity](https://credo.js.org/guides/next/protocols/mdoc/proximity.md), compute the session transcript yourself and pass `{ type: 'sessionTranscriptBytes', sessionTranscriptBytes }`.
- `deviceNameSpaces` adds device-signed elements. They're only included when requested and authorized by `keyAuthorizations`.

Only device signatures are supported. Device MAC authentication fails.

## Verify a device response

:::verifier

```ts
const receivedResponse = MdocDeviceResponse.fromBase64Url(encodedDeviceResponse)

// Throws when the response is invalid. Pass the trusted certificates explicitly:
// this method does not use the agent trust configuration.
await receivedResponse.verify(verifier.context, {
  trustedCertificates: [issuerCertificate.toString('pem')],
  sessionTranscriptOptions,
})

// { 'org.iso.18013.5.1.mDL': { 'org.iso.18013.5.1': { family_name: 'Doe', age_over_18: true } } }
console.log(receivedResponse.issuerClaims)
```

:::

`verify` resolves when the response is valid and throws an `MdocError` when it isn't. It checks the issuer signature and certificate chain, the element digests, the device signature over the session transcript, the validity period (with the agent's `validitySkewSeconds`) and the status. `issuerClaims` and `deviceClaims` hold the disclosed elements per document type and namespace.

:::warning[Pass the trusted certificates]
`MdocDeviceResponse.verify` doesn't use the agent's trusted issuers configuration or the trusted certificates of the X.509 module. Without `trustedCertificates`, every response fails verification. The OpenID4VP verifier and the DC API flow resolve trust for you.
:::

`trustedCertificates` takes certificates as PEM or base64 strings. To trust a separate certificate for signing status lists, pass `[{ issuance: [...], status: [...] }]` instead.

## Next steps

- [mdoc with OpenID4VC](https://credo.js.org/guides/next/protocols/openid4vc/mdoc.md)
- [Proximity (ISO 18013-5)](https://credo.js.org/guides/next/protocols/mdoc/proximity.md)
- [Digital Credentials API (ISO 18013-7)](https://credo.js.org/guides/next/protocols/dc-api.md)
- [Status lists](https://credo.js.org/guides/next/credential-formats/status-lists.md)
- [X.509 certificates](https://credo.js.org/guides/next/dids-and-trust/x509.md)
