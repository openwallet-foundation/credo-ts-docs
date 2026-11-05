# Trusted issuers

> How Credo decides whether to trust the issuer of a credential or the signer of a request, what it does by default, and how to configure trust with getTrustedIssuersForVerification and trusted X.509 certificates.

A valid signature shows that a credential is intact and who signed it. Whether you accept that signer is a separate decision: when Credo verifies a credential or a signed request, it looks up the issuers you trust for that verification and checks the signer against them.

## How Credo finds trusted issuers

Credo checks these sources in order, and the first one that returns trusted issuers decides:

1. Trusted issuers or certificates passed to the verify call, such as `trustedIssuers` on `agent.sdJwtVc.verify`.
2. The agent's `getTrustedIssuersForVerification` callback.
3. The X.509 module's `getTrustedCertificatesForVerification` callback (deprecated, X.509 only).
4. The X.509 module's `trustedCertificates` (X.509 only).

What happens when no source returns trusted issuers depends on how the object is signed:

| Signer | No trusted issuers found (default) | Trusted issuers found |
| --- | --- | --- |
| X.509 certificate chain | Verification fails. | The chain must lead to one of the trusted certificates. |
| DID | Any DID is accepted. | The DID (without fragment) must be in the list. |

So an agent without trust configuration accepts credentials signed with any DID, and rejects all X.509-signed credentials. Return an empty list (`{ trustedIssuers: [] }`) to reject every signer, including DIDs. OpenID4VC objects signed with a bare `jwk` header, without a DID or certificate, aren't checked against trusted issuers.

This applies to SD-JWT VCs, mdocs, W3C credentials signed as JWT, SD-JWT or with JSON-LD proofs, and to the signed objects in OpenID4VC. AnonCreds and Data Integrity credentials don't use it.

## Which should I use?

In production, set `getTrustedIssuersForVerification` and return a list for every signer type you accept: the root certificates for X.509 signers, for example from a trust list, and the DIDs you accept for DID signers. For signer types you don't accept, return `{ trustedIssuers: [] }`. Returning `undefined` for a DID signer accepts any DID.

The X.509 module's `trustedCertificates` are enough when the agent trusts one fixed set of root certificates for everything, for example in tests. Pass `trustedIssuers` to a verify call for a one-off check.

## The `getTrustedIssuersForVerification` callback

Set the callback in the agent config. Credo calls it for each verification with the `signer` and the `verification` context:

```ts
const trustedRootCertificates = [rootCertificatePem]
const trustedIssuerDids = ['did:web:issuer.example.com']

const agent = new Agent({
  config: {
    getTrustedIssuersForVerification: async (_agentContext, { signer, verification }) => {
      // Fall through to the X.509 module configuration for anything other than credentials
      if (verification.type !== 'credential') return undefined

      if (signer.method === 'x509') {
        return { trustedIssuers: [{ method: 'x509', issuance: trustedRootCertificates }] }
      }

      return { trustedIssuers: trustedIssuerDids.map((did) => ({ method: 'did', issuance: did })) }
    },
  },
  dependencies: agentDependencies,
  modules: {
    ...storage, // Storage and key management, see Agent setup
  },
})
```

`signer` is either `{ method: 'x509', certificateChain }` with the parsed certificates, leaf first, or `{ method: 'did', didUrl }`. Return one of:

- `{ trustedIssuers: [{ method: 'x509', issuance: [...] }] }`: the PEM or base64 DER certificates that X.509 chains must lead to.
- `{ trustedIssuers: [{ method: 'did', issuance: 'did:...' }, ...] }`: the DIDs you trust.
- `{ trustedIssuers: [] }` to reject the signer.
- `undefined` to fall through to the X.509 module configuration, or, for a DID signer, to accept it.

All returned entries must use the same `method` as the signer, otherwise verification throws.

`verification.type` tells you what Credo is verifying:

| Type | When | Package |
| --- | --- | --- |
| `credential` | Verifying a credential, including credentials the holder receives over OpenID4VCI. | `@credo-ts/core` |
| `mdocReaderAuth` | The holder checks the reader certificate of an mdoc request over the Digital Credentials API. | `@credo-ts/core` |
| `openId4VpCredential` | A verifier checks a credential in an OpenID4VP response. Includes the `openId4VcVerificationSessionRecord`. | `@credo-ts/openid4vc` |
| `oauth2SecuredAuthorizationRequest` | The holder checks a signed OpenID4VP authorization request. | `@credo-ts/openid4vc` |
| `openId4VciCredentialIssuerMetadata` | The holder checks signed credential issuer metadata. | `@credo-ts/openid4vc` |
| `openId4VciKeyAttestation` | An issuer checks a key attestation. | `@credo-ts/openid4vc` |
| `oauth2ClientAttestation` | An issuer checks a wallet (client) attestation. | `@credo-ts/openid4vc` |

To get the OpenID4VC verification types, type the callback as `GetTrustedIssuersForVerification<VerificationSigner, OpenId4VcVerificationTypes>`, as in the examples below. A separate callback typed as plain `GetTrustedIssuersForVerification` can't be assigned to the agent config in strict mode, so in agents without OpenID4VC define it inline as above.

When the signer isn't trusted, `isValid` is `false` and `error` says why:

```ts
const result = await agent.sdJwtVc.verify({ compactSdJwtVc: x509SignedCredential.compact })
if (!result.isValid) {
  console.error('Credential not trusted or invalid', result.error)
}
```

To change the callback at runtime, for example after loading a trust list, call `agent.config.setTrustedIssuersForVerification`:

```ts
// Reject everything until the trust list is loaded
agent.config.setTrustedIssuersForVerification(async () => ({ trustedIssuers: [] }))
```

## Trusted issuers per call

Trusted issuers passed to a verify call take precedence, and Credo doesn't call the callback for that verification:

```ts
// Trusted issuers passed to the call replace the callback for this verification
const perCallResult = await agent.sdJwtVc.verify({
  compactSdJwtVc: x509SignedCredential.compact,
  trustedIssuers: [{ method: 'x509', issuance: [otherRoot.certificate.toString('pem')] }],
})
```

Other calls take trusted certificates directly: `agent.mdoc.verify(mdoc, { trustedCertificates })`, and the holder's `agent.openid4vc.holder.resolveOpenId4VpAuthorizationRequest(request, { trustedCertificates })`. The `trustedCertificates` option of `agent.sdJwtVc.verify` is deprecated in favour of `trustedIssuers`. `MdocDeviceResponse.verify` only uses the `trustedCertificates` you pass, see [mdoc](https://credo.js.org/guides/next/credential-formats/mdoc.md).

## Verifier

Use the `openId4VpCredential` type to give each verifier its own trust list. The examples read trust lists from JSON files:

```ts
import { readFile } from 'node:fs/promises'
import type { GetTrustedIssuersForVerification, VerificationSigner } from '@credo-ts/core'
import type { OpenId4VcVerificationTypes } from '@credo-ts/openid4vc'

// A JSON array of PEM encoded certificates, for example exported from a trust list
async function loadTrustList(name: string): Promise<string[]> {
  return JSON.parse(await readFile(`trust-lists/${name}.json`, 'utf8'))
}
```

:::verifier

```ts
const trustedRootsByVerifier: Record<string, string[]> = {
  'pid-verifier': await loadTrustList('pid-providers'),
  'diploma-verifier': await loadTrustList('universities'),
}

export const getVerifierTrustedIssuers: GetTrustedIssuersForVerification<
  VerificationSigner,
  OpenId4VcVerificationTypes
> = async (_agentContext, { signer, verification }) => {
  if (verification.type !== 'openId4VpCredential') return undefined

  // Each verifier only accepts credentials from its own trust list
  const { verifierId } = verification.openId4VcVerificationSessionRecord
  const trustedRoots = trustedRootsByVerifier[verifierId] ?? []

  if (signer.method === 'x509') {
    return { trustedIssuers: [{ method: 'x509', issuance: trustedRoots }] }
  }

  // This verifier doesn't accept did-signed credentials
  return { trustedIssuers: [] }
}
```

:::

A credential from an issuer outside the verifier's list fails verification, and the verification session ends in the `Error` state. See [Verifying credentials](https://credo.js.org/guides/next/protocols/openid4vc/verifier.md) for the flow.

## Holder

The holder verifies the credentials it receives, and the authorization requests that verifiers sign with a certificate:

:::holder

```ts
const trustedIssuerRoots = await loadTrustList('issuers')
const trustedVerifierRoots = await loadTrustList('relying-parties')

export const getHolderTrustedIssuers: GetTrustedIssuersForVerification<
  VerificationSigner,
  OpenId4VcVerificationTypes
> = async (_agentContext, { signer, verification }) => {
  // Did-signed objects are accepted, as no list is returned for them
  if (signer.method !== 'x509') return undefined

  switch (verification.type) {
    // Credentials received over OpenID4VCI
    case 'credential':
      return { trustedIssuers: [{ method: 'x509', issuance: trustedIssuerRoots }] }
    // Signed OpenID4VP authorization requests
    case 'oauth2SecuredAuthorizationRequest':
      return { trustedIssuers: [{ method: 'x509', issuance: trustedVerifierRoots }] }
    default:
      return undefined
  }
}
```

:::

Without trusted certificates, receiving an X.509-signed SD-JWT VC or mdoc over OpenID4VCI fails, and so does resolving an authorization request signed with `x509_san_dns` or `x509_hash`. See [Receiving credentials](https://credo.js.org/guides/next/protocols/openid4vc/receive.md) and [Presenting credentials](https://credo.js.org/guides/next/protocols/openid4vc/present.md).

## Issuer

An OpenID4VCI issuer that requires wallet or key attestations uses the `oauth2ClientAttestation` and `openId4VciKeyAttestation` types to trust the wallet providers that sign them. See [Wallet and key attestations](https://credo.js.org/guides/next/protocols/openid4vc/authorization.md#wallet-and-key-attestations).

## Trusted certificates in the X.509 module

If the agent trusts the same root certificates for every X.509 signer, list them on the X.509 module:

```ts
new X509Module({ trustedCertificates: [rootCertificatePem] })
```

Credo only uses them for X.509 signers, and only when no earlier source returns trusted issuers, for example when the callback returns `undefined`. See [X.509 certificates](https://credo.js.org/guides/next/dids-and-trust/x509.md#configure-the-x509-module).

The X.509 module's `getTrustedCertificatesForVerification(agentContext, { certificateChain, verification })` callback is deprecated. It works like `getTrustedIssuersForVerification` for X.509 signers only, returning certificates instead of trusted issuers. Move its logic to `getTrustedIssuersForVerification`.

## Status list signers

An X.509 trusted issuer can also list the certificates that may sign status lists for its credentials, in `status`:

```ts
{ method: 'x509', issuance: [issuerRootPem], status: [statusListSignerPem] }
```

Without `status`, the status list must be signed with the same certificate chain as the credential. See [Status lists](https://credo.js.org/guides/next/credential-formats/status-lists.md).
