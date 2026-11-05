# Status lists

> Revoke and suspend SD-JWT VCs and mdocs with IETF Token Status Lists, using agent.tokenStatusList.

A [Token Status List](https://datatracker.ietf.org/doc/draft-ietf-oauth-status-list/) is a signed, compressed list with one status entry per credential, which the issuer publishes at a URL. Each credential points to its entry with the URL and an index, and the verifier fetches the list to check the entry. Credo uses status lists for [SD-JWT VC](https://credo.js.org/guides/credential-formats/sd-jwt-vc.md) (as a JWT) and [mdoc](https://credo.js.org/guides/credential-formats/mdoc.md) (as a CWT). This page covers creating and updating lists with `agent.tokenStatusList`, referencing them from credentials, and how verification checks them.

## When you need one

Use a status list when you must be able to revoke or suspend credentials before they expire. Credentials that are short-lived and reissued often don't need one: their expiry does the job, and you have no list to host. Use 1 bit per entry if you only revoke, and 2 bits if you also suspend.

Credo supports Token Status Lists for SD-JWT VC and mdoc only. It doesn't support the W3C Bitstring Status List, so W3C credentials have no revocation in Credo (see [W3C Verifiable Credentials](https://credo.js.org/guides/credential-formats/w3c-vc.md#status-and-revocation)). AnonCreds uses its own revocation registries, published on the ledger, and the holder proves non-revocation in the presentation (see [AnonCreds](https://credo.js.org/guides/credential-formats/anoncreds.md#revocation)).

## What your app does

`agent.tokenStatusList` creates, updates and fetches status list tokens, and verification checks them. Everything around that is up to your app:

- Host each token at its URL, with content type `application/statuslist+jwt` or `application/statuslist+cwt`.
- Store the current token, and publish a new one after each change and before the current one expires.
- Allocate an index for each credential and remember which credential has which index. Pick unused indexes at random: indexes handed out in order reveal when a credential was issued.

The examples run an issuer, a holder and a verifier in one process, with a small HTTP server that stands in for your hosting:

```ts
// Your app hosts the status list tokens. This is a minimal stand-in for that endpoint.
const hostedStatusLists = new Map<string, { contentType: string; body: string | Uint8Array }>()
const server = createServer((request, response) => {
  const hosted = hostedStatusLists.get(request.url ?? '')
  if (!hosted) return response.writeHead(404).end()
  response.writeHead(200, { 'Content-Type': hosted.contentType }).end(hosted.body)
})
await new Promise<void>((resolve) => server.listen(4070, resolve))
```

## Create a status list

:::issuer

```ts
const statusListUri = 'http://localhost:4070/status-lists/1'

const { statusList: statusListJwt } = await issuer.tokenStatusList.createTokenStatusList<'jwt'>({
  format: 'jwt',
  signer: { method: 'did', didUrl: issuerDidUrl },
  alg: 'EdDSA',
  // A new list has every entry set to 0 (valid)
  statusList: { statusListLength: 100_000, bitsPerStatus: 1 },
  statusListUri,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  // Seconds a verifier may cache the list
  timeToLive: 60 * 60,
})

hostedStatusLists.set('/status-lists/1', { contentType: 'application/statuslist+jwt', body: statusListJwt })
```

:::

- `format` is `jwt` for SD-JWT VC and `cwt` for mdoc.
- `statusList` sets the number of entries and the bits per entry (1, 2, 4 or 8). The statuses are 0 (valid), 1 (invalid) and 2 (suspended), so suspension needs at least 2 bits. Every entry starts at 0.
- `statusListUri` is the URL where you host the token. It becomes the `sub` claim, and verification fails when it doesn't match the URL in the credential.
- `signer` is `{ method: 'did', didUrl }` or `{ method: 'x5c', x5c }`, with a key in the agent's KMS. CWT lists need `x5c`.

`expiresAt` and `timeToLive` set `exp` and `ttl`, where `ttl` tells verifiers how long they may cache the list. The result has the encoded token in `statusList` and the parsed token in `parsed`. Pass the format as type parameter, such as `createTokenStatusList<'jwt'>`, to get the matching result type.

## Reference the list from a credential

For an SD-JWT VC, add a `status` claim to the payload:

:::issuer

```ts
// Your app allocates the index and remembers which credential uses it
const statusListIndex = 4821

const credential = await issuer.sdJwtVc.sign({
  payload: {
    vct: 'https://credentials.example.com/identity',
    given_name: 'Jane',
    status: { status_list: { idx: statusListIndex, uri: statusListUri } },
  },
  issuer: { method: 'did', didUrl: issuerDidUrl },
  holder: { method: 'jwk', jwk: holderJwk },
  disclosureFrame: { _sd: ['given_name'] },
})
```

:::

The `status` claim can't be selectively disclosable. For an mdoc, pass `statusInfo: { index, uri }` to `agent.mdoc.sign` (see [mdoc](#mdoc) below).

## Revoke or suspend

Set the new status in the current token, and host the result:

:::issuer

```ts
// Load the current token (from your own storage, or fetch it), then set the new status
const { statusList: currentToken } = await issuer.tokenStatusList.fetchTokenStatusList<'jwt'>({
  uri: statusListUri,
  acceptedFormats: ['jwt'],
})

const { statusList: updatedStatusListJwt } = await issuer.tokenStatusList.updateTokenStatusList<'jwt'>({
  format: 'jwt',
  token: currentToken,
  // 0 = valid, 1 = invalid (revoked), 2 = suspended. Needs `bitsPerStatus: 2` or more for 2.
  status: { index: statusListIndex, status: 1 },
  signer: { method: 'did', didUrl: issuerDidUrl },
  alg: 'EdDSA',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
})

hostedStatusLists.set('/status-lists/1', { contentType: 'application/statuslist+jwt', body: updatedStatusListJwt })
```

:::

`status` takes one `{ index, status }` or an array, so you can change many entries in one update. The update keeps the URL, sets a new `iat`, and keeps `exp` and `ttl` unless you pass new values, so pass `expiresAt` again when the list should stay valid longer. `fetchTokenStatusList` downloads and parses a token, but doesn't verify its signature: load the current token from your own storage if you can.

## Verify

`agent.sdJwtVc.verify` fetches the status list of a credential with a `status` claim, verifies its signature and reads the entry:

:::verifier

```ts
const validResult = await verifier.sdJwtVc.verify({ compactSdJwtVc: credential.compact })
console.log(validResult.isValid) // true
```

:::

After the update the same credential fails:

:::verifier

```ts
const revokedResult = await verifier.sdJwtVc.verify({ compactSdJwtVc: credential.compact })
if (revokedResult.isValid === false) {
  // 'Status is not valid'
  console.log(revokedResult.error.message)
}
```

:::

Any status other than 0 fails verification, including suspended, and `disableStatusValidation: true` skips the check. Credo fetches the list on every verification, with the agent's `fetch`.

Which key may sign the status list depends on the [trusted issuer](https://credo.js.org/guides/dids-and-trust/trust.md) that matched the credential:

- No trusted issuers configured (DID issuers only): the list must be signed with the credential issuer's key.
- A trusted DID: the list's `iss` must be that DID.
- A trusted X.509 issuer: the list's certificate chain must chain to the `status` certificates of the trusted issuer. Without `status`, it must chain to the `issuance` certificates and be the same chain that signed the credential.

### mdoc

mdoc status lists are CWTs signed with an X.509 certificate, and need an expiration time. Verification of an mdoc, and of a device response, checks the status the same way: any status other than valid fails.

```ts
// mdoc status lists are CWTs, signed with the issuer certificate
const issuerKey = await issuer.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
const issuerCertificate = await issuer.x509.createCertificate({
  authorityKey: PublicJwk.fromPublicJwk(issuerKey.publicJwk),
  issuer: { commonName: 'Example mDL Issuer', countryName: 'NL' },
})

const mdocStatusListUri = 'http://localhost:4070/status-lists/mdoc-1'
const { statusList: statusListCwt } = await issuer.tokenStatusList.createTokenStatusList<'cwt'>({
  format: 'cwt',
  signer: { method: 'x5c', x5c: [issuerCertificate] },
  alg: 'ES256',
  statusList: { statusListLength: 100_000, bitsPerStatus: 1 },
  statusListUri: mdocStatusListUri,
  // Required for mdoc
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
})
hostedStatusLists.set('/status-lists/mdoc-1', { contentType: 'application/statuslist+cwt', body: statusListCwt })

const mdoc = await issuer.mdoc.sign({
  docType: 'org.iso.18013.5.1.mDL',
  namespaces: { 'org.iso.18013.5.1': { family_name: 'Doe', issuing_country: 'NL' } },
  validityInfo: { validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  issuerCertificate,
  holderKey: holderJwk,
  statusInfo: { index: statusListIndex, uri: mdocStatusListUri },
})

const { statusList: updatedStatusListCwt } = await issuer.tokenStatusList.updateTokenStatusList<'cwt'>({
  format: 'cwt',
  token: statusListCwt,
  status: { index: statusListIndex, status: 1 },
  signer: { method: 'x5c', x5c: [issuerCertificate] },
  alg: 'ES256',
})
hostedStatusLists.set('/status-lists/mdoc-1', { contentType: 'application/statuslist+cwt', body: updatedStatusListCwt })

const mdocResult = await verifier.mdoc.verify(Mdoc.fromBase64Url(mdoc.base64Url), {
  trustedCertificates: [issuerCertificate.toString('pem')],
})
console.log(mdocResult.isValid) // false
```

As with SD-JWT VC, the status list must be signed by the same certificate chain as the mdoc, unless you trust a separate status list certificate with `trustedCertificates: [{ issuance: [...], status: [...] }]`.
