# Verifying credentials

> Request and verify credential presentations with OpenID4VP and DCQL from a Credo verifier on Node.js.

This page covers verifying credentials with OpenID4VP from a Node.js agent: creating an authorization request with a DCQL query, choosing how the wallet responds and how the verifier identifies itself, and reading the verified claims. The examples request the SD-JWT VC issued in [Issuing credentials](https://credo.js.org/guides/next/protocols/openid4vc/issuer.md).

## Set up the verifier

Register `OpenId4VcModule` with a `verifier` configuration. [OpenID4VC](https://credo.js.org/guides/next/protocols/openid4vc.md) explains the module options.

```ts
import { Agent, ClaimFormat, Kms, X509Module } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import {
  OpenId4VcModule,
  OpenId4VcVerificationSessionState,
  type OpenId4VcVerificationSessionStateChangedEvent,
  OpenId4VcVerifierEvents,
} from '@credo-ts/openid4vc'
import express from 'express'
import { issuerCertificate } from './openid4vc-issuer.js'

const verifierPort = 4021
const app = express()

export const verifier = new Agent({
  config: {
    // Allows the http://localhost URLs of this example. Never enable this in production.
    allowInsecureHttpUrls: true,
  },
  dependencies: agentDependencies,
  modules: {
    ...storage, // Storage and key management, see Agent setup
    // Certificates (or root CAs) of the credential issuers you accept
    x509: new X509Module({ trustedCertificates: [issuerCertificate] }),
    openid4vc: new OpenId4VcModule({
      app,
      verifier: { baseUrl: `http://localhost:${verifierPort}/oid4vp` },
    }),
  },
})

await verifier.initialize()
export const verifierServer = app.listen(verifierPort)
```

- `baseUrl` is the public URL of the verifier endpoints. Wallets fetch requests from it and post their responses to it.
- The verifier only accepts credentials from issuers it trusts. For X.509-signed credentials it needs the issuer certificates or their root CAs, here `issuerCertificate` from [Issuing credentials](https://credo.js.org/guides/next/protocols/openid4vc/issuer.md). Credentials signed with a DID are accepted from any DID unless you restrict them. See [Trusted issuers](https://credo.js.org/guides/next/dids-and-trust/trust.md).

## Create a verifier

A verifier record gives the verifier an id, used in its URLs, and the client metadata that wallets show to the user, such as `client_name` and `logo_uri`. Create it once and keep its `verifierId`. One agent can host several verifiers.

The verifier also needs a way to identify itself to wallets. The example signs its requests with a self-signed certificate:

```ts
const verifierRecord = await verifier.openid4vc.verifier.createVerifier({
  clientMetadata: { client_name: 'Example Verifier' },
})

const verifierKey = await verifier.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })

// Self-signed for this example. With x509_san_dns, the host of the verifier's
// baseUrl must be a DNS name in the certificate's subject alternative names.
export const verifierCertificate = await verifier.x509.createCertificate({
  authorityKey: Kms.PublicJwk.fromPublicJwk(verifierKey.publicJwk),
  issuer: { commonName: 'Example Verifier', countryName: 'NL' },
  extensions: { subjectAlternativeName: { name: [{ type: 'dns', value: 'localhost' }] } },
})
```

In production, use a certificate from a CA that wallets trust. [Client identifiers](#client-identifiers) explains the options.

## Create an authorization request

An authorization request describes the credentials and claims you want in a DCQL query:

```ts
export async function createEmployeeBadgeRequest() {
  const { authorizationRequest, verificationSession } = await verifier.openid4vc.verifier.createAuthorizationRequest({
    verifierId: verifierRecord.verifierId,
    requestSigner: { method: 'x5c', x5c: [verifierCertificate] },
    dcql: {
      query: {
        credentials: [
          {
            id: 'employee-badge',
            format: 'dc+sd-jwt',
            meta: { vct_values: ['urn:example:employee-badge:1'] },
            claims: [{ path: ['given_name'] }, { path: ['department'] }],
          },
        ],
      },
    },
  })

  // Show authorizationRequest as a QR code or link, and keep the session id to look up the result
  return { authorizationRequest, verificationSessionId: verificationSession.id }
}
```

Each credential query has an `id`, which you use to find the presentation in the result. `meta.vct_values` limits the query to SD-JWT VCs of that type, and `claims` lists the claims the wallet must disclose. [SD-JWT VC with OpenID4VC](https://credo.js.org/guides/next/protocols/openid4vc/sd-jwt-vc.md), [mdoc with OpenID4VC](https://credo.js.org/guides/next/protocols/openid4vc/mdoc.md) and [W3C VCs with OpenID4VC](https://credo.js.org/guides/next/protocols/openid4vc/w3c.md) show the queries for each format.

`authorizationRequest` is a URI such as `openid4vp://?client_id=...&request_uri=...`. Show it as a QR code when the wallet runs on another device, or as a link on the same device. For a same-device flow, also set `authorizationResponseRedirectUri`: the wallet opens this URL after it submits the response, so the user returns to your website or app. Include enough randomness in the URL (at least 128 bits) that nobody can guess it.

The request expires after 5 minutes. Change it per request with `expirationInSeconds`, or for all requests with `authorizationRequestExpirationInSeconds` in the verifier configuration.

### Version and query language

Use the default `version`, `v1` (OpenID4VP 1.0), with DCQL. Set `version` to `v1.draft24` or `v1.draft21` only for wallets that don't support OpenID4VP 1.0 yet. Only those drafts accept a DIF Presentation Exchange definition (`presentationExchange`) instead of DCQL, and Credo throws if you combine draft 21 with DCQL, transaction data or `clientIdPrefix: 'x509_hash'`.

### Response modes

`responseMode` sets how the wallet returns the response:

| Response mode | How | Use |
| --- | --- | --- |
| `direct_post.jwt` (default) | The wallet encrypts the response to a key Credo generates for each request and posts it to the verifier. | By default. HAIP requires it. |
| `direct_post` | The wallet posts the response without encryption. | Only for wallets that can't encrypt. With drafts 21 and 24, mdoc requests need `direct_post.jwt`. |
| `dc_api.jwt`, `dc_api` | The request and response go through the browser's [Digital Credentials API](https://credo.js.org/guides/next/protocols/dc-api/verifier.md). | For requests from a website. |

With `direct_post` and `direct_post.jwt`, Credo receives and verifies the response at its endpoint. You don't have to call anything.

### Client identifiers

The `requestSigner` decides how the verifier identifies itself, and which client identifier prefix the request uses:

| `requestSigner` | Client identifier | What you need |
| --- | --- | --- |
| `{ method: 'x5c', x5c }` | `x509_san_dns:<host>` (default for `x5c`) | A certificate with the host of `baseUrl` as a DNS subject alternative name. |
| `{ method: 'x5c', x5c, clientIdPrefix: 'x509_hash' }` | `x509_hash:<certificate hash>` | A certificate. Its names don't have to match your host. |
| `{ method: 'did', didUrl }` | `decentralized_identifier:<did>` | A DID created by the agent, with `didUrl` pointing to the signing key. |
| `{ method: 'none' }` | `redirect_uri:<response URL>` | Nothing. The request isn't signed. |

In production, sign requests with an X.509 certificate from a CA that wallets trust, so wallets can show the user who is asking. Use `x509_hash` for wallets that follow HAIP, which requires it, and `x509_san_dns` for wallets that only support that prefix. Use `did` only in ecosystems where wallets trust verifier DIDs. Unsigned requests (`none`) let anyone pretend to be your verifier, and HAIP doesn't allow them. Use them only for development.

For `x5c`, `baseUrl` must use HTTPS. Put the certificate of the signing key first, followed by any intermediate certificates. The first certificate needs the KMS key id of its key: `agent.x509.createCertificate` sets it, and for a certificate you load yourself, set `certificate.keyId`. Credo doesn't support the `verifier_attestation`, `openid_federation`, `pre-registered` and `https` prefixes.

## Track verification sessions

Each request creates a verification session:

```ts
verifier.events.on<OpenId4VcVerificationSessionStateChangedEvent>(
  OpenId4VcVerifierEvents.VerificationSessionStateChanged,
  ({ payload: { verificationSession } }) => {
    if (verificationSession.state === OpenId4VcVerificationSessionState.ResponseVerified) {
      console.log(`Verification session ${verificationSession.id} verified`)
    } else if (verificationSession.state === OpenId4VcVerificationSessionState.Error) {
      console.error(`Verification session ${verificationSession.id} failed: ${verificationSession.errorMessage}`)
    }
  }
)
```

| State | When |
| --- | --- |
| `RequestCreated` | You created the request. |
| `RequestUriRetrieved` | The wallet fetched the request. |
| `ResponseVerified` | The wallet responded and all presentations passed verification. |
| `Error` | Verification failed, or the user declined and the wallet sent an error response. `errorMessage` says why. |

A verifier website usually shows the QR code and polls its backend, which checks the session with `getVerificationSessionById`.

## Read the verified result

When the session reaches `ResponseVerified`, Credo has already checked the signatures, the holder binding, the nonce and audience, and the issuer's trust. Get the presentations:

```ts
export async function getEmployeeBadgeClaims(verificationSessionId: string) {
  // Throws unless the session is in state ResponseVerified
  const { dcql } = await verifier.openid4vc.verifier.getVerifiedAuthorizationResponse(verificationSessionId)

  const [presentation] = dcql?.presentations['employee-badge'] ?? []
  if (presentation?.claimFormat !== ClaimFormat.SdJwtDc) throw new Error('Expected an SD-JWT VC presentation')

  // Only the claims the holder disclosed, plus the always-visible ones like vct and iat
  return presentation.prettyClaims
}
```

`dcql.presentations` has an entry per credential query id, with one presentation per credential the wallet shared (more than one only if the query sets `multiple: true`). For SD-JWT VC, `prettyClaims` holds the disclosed claims; the format pages show how to read the other formats. `dcql.presentationResult` is the DCQL result for the whole query, for example to see which `credential_sets` were satisfied.

## Next steps

- [Presenting credentials](https://credo.js.org/guides/next/protocols/openid4vc/present.md): the holder side of this flow.
- [Digital Credentials API](https://credo.js.org/guides/next/protocols/dc-api/verifier.md): request credentials through the browser.
- [Trusted issuers](https://credo.js.org/guides/next/dids-and-trust/trust.md): decide which issuers you accept.
