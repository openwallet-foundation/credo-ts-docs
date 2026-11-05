# SD-JWT VC

> Sign, store, present and verify IETF SD-JWT VCs with agent.sdJwtVc, independent of the exchange protocol.

An SD-JWT VC ([IETF SD-JWT VC](https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/)) is a JWT signed by the issuer, in which the holder can disclose claims one by one. It's usually bound to a key the holder controls. This page covers `agent.sdJwtVc`: signing, storing, presenting and verifying SD-JWT VCs yourself. To issue and present them over OpenID4VC, see [SD-JWT VC with OpenID4VC](https://credo.js.org/guides/next/protocols/openid4vc/sd-jwt-vc.md). The protocol calls these same APIs for you.

## Set up

Everything on this page is in `@credo-ts/core`. `SdJwtVcModule` is a default module, so every agent has `agent.sdJwtVc`. The agent also needs [storage](https://credo.js.org/guides/next/agent-setup/storage.md) and key management. The examples use three agents: an issuer, a holder and a verifier.

```ts
import { Agent, DidKey, type KeyDidCreateOptions, SdJwtVcModule, SdJwtVcRecord } from '@credo-ts/core'
import { PublicJwk } from '@credo-ts/core/kms'
import { agentDependencies } from '@credo-ts/node'

function createAgent(storage: ExampleStorage, sdJwtVc?: SdJwtVcModule) {
  return new Agent({
    dependencies: agentDependencies,
    modules: {
      ...storage, // Storage and key management, see Agent setup
      // SdJwtVcModule is a default module. Register it yourself only to configure it.
      ...(sdJwtVc ? { sdJwtVc } : {}),
    },
  })
}
```

## Sign a credential

The issuer signs with a key of a DID it created (or imported with its keys), and binds the credential to the holder's public key:

:::issuer

```ts
// The issuer signs with a key of a DID it created
const { didState } = await issuer.dids.create<KeyDidCreateOptions>({
  method: 'key',
  options: { createKey: { type: { kty: 'OKP', crv: 'Ed25519' } } },
})
if (didState.state !== 'finished') throw new Error('Creating the issuer DID failed')
const issuerDid = didState.did
const issuerDidUrl = `${issuerDid}#${DidKey.fromDid(issuerDid).publicJwk.fingerprint}`

// The holder key. In a real flow the wallet sends the public key, for example in an OpenID4VCI proof.
const holderKey = await holder.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
const holderJwk = PublicJwk.fromPublicJwk(holderKey.publicJwk)

const credential = await issuer.sdJwtVc.sign({
  payload: {
    vct: 'https://credentials.example.com/identity',
    given_name: 'Jane',
    family_name: 'Doe',
    birthdate: '1990-01-01',
    address: { street_address: 'Main Street 1', locality: 'Utrecht', country: 'NL' },
    nationalities: ['NL', 'DE'],
  },
  issuer: { method: 'did', didUrl: issuerDidUrl },
  holder: { method: 'jwk', jwk: holderJwk },
  disclosureFrame: {
    _sd: ['given_name', 'family_name', 'birthdate'],
    _sd_decoy: 2,
    address: { _sd: ['street_address', 'locality'] },
    nationalities: { _sd: [0, 1] },
  },
  hashingAlgorithm: 'sha-256',
})

// The compact SD-JWT VC: issuer-signed JWT followed by the disclosures
console.log(credential.compact)
```

:::

- `payload` holds the claims and needs a `vct`, the credential type. Credo sets `iss`, `cnf` and `iat` (pass `iat: null` to leave `iat` out). Add `exp`, `nbf` or `status` yourself.
- `issuer` is `{ method: 'did', didUrl }` with a DID URL that points to a key, or `{ method: 'x5c', x5c }` with a certificate chain (see below).
- `holder` is `{ method: 'jwk', jwk }`, which sets `cnf.jwk`, or `{ method: 'did', didUrl }`, which sets `cnf.kid`.
- `disclosureFrame` lists the claims the holder can disclose one by one (see below).

`hashingAlgorithm` sets the digest algorithm of the disclosures: `sha-256` (default), `sha-384` or `sha-512`. `headerType` sets the `typ` header. Keep the default `dc+sd-jwt`, and use `vc+sd-jwt` only for verifiers that don't support `dc+sd-jwt` yet.

### Choose the holder binding

Bind to a JWK by default. The holder doesn't need a DID, and the key can stay in the secure hardware of a phone. Bind to a DID when holders and verifiers already work with DIDs. Without `holder` the credential is a bearer credential: anyone with a copy can present it, and a verifier can't require key binding.

### Design the disclosure frame

Each `_sd` lists the claims of one object that the holder can disclose separately: property names, or positions for array elements. Claims that aren't listed are always disclosed, and `iss`, `nbf`, `exp`, `cnf`, `vct` and `status` can't be listed.

- List every claim about the person, so the holder shares only what a verifier asks for. Leave claims visible that every verifier needs and that say nothing about the person.
- For a nested object, give it its own `_sd`, as for `address` above, so the holder can disclose the locality without the street. Also list the object in the parent `_sd` if even its presence says something about the person.
- Set `_sd_decoy` to add fake digests, so verifiers can't tell how many claims are hidden.

### Sign with an X.509 certificate

Sign with X.509 when your verifiers expect certificates, as HAIP and the EUDI Wallet do. Otherwise a DID is simpler. Put the certificate chain in `x5c`, leaf certificate first. Credo signs with the leaf certificate's key, so that key must be in the agent's KMS. A certificate you create with `agent.x509.createCertificate` from a KMS key is ready to use. For certificate chains and trust anchors, see [X.509 certificates](https://credo.js.org/guides/next/dids-and-trust/x509.md).

:::issuer

```ts
const issuerKey = await issuer.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
const issuerCertificate = await issuer.x509.createCertificate({
  authorityKey: PublicJwk.fromPublicJwk(issuerKey.publicJwk),
  issuer: { commonName: 'Example Issuer', countryName: 'NL' },
  extensions: { subjectAlternativeName: { name: [{ type: 'dns', value: 'issuer.example.com' }] } },
})

const x509Credential = await issuer.sdJwtVc.sign({
  payload: { vct: 'https://credentials.example.com/identity', given_name: 'Jane' },
  // `issuer` is optional. When set, it must match a SAN of the leaf certificate.
  issuer: { method: 'x5c', x5c: [issuerCertificate], issuer: 'https://issuer.example.com' },
  holder: { method: 'jwk', jwk: holderJwk },
  disclosureFrame: { _sd: ['given_name'] },
})
```

:::

## Store and query

The holder verifies a received credential, then stores it as an `SdJwtVcRecord`:

:::holder

```ts
const verification = await holder.sdJwtVc.verify({ compactSdJwtVc: credential.compact })
if (verification.isValid === false) throw verification.error

const record = await holder.sdJwtVc.store({
  record: new SdJwtVcRecord({
    // The KMS key id lets Credo sign the key binding JWT when presenting
    credentialInstances: [{ compactSdJwtVc: credential.compact, kmsKeyId: holderKey.keyId }],
  }),
})

const [identityRecord] = await holder.sdJwtVc.findAllByQuery({ vct: 'https://credentials.example.com/identity' })
console.log(identityRecord.firstCredential.prettyClaims)
```

:::

`kmsKeyId` is the KMS key the credential is bound to. Credo signs the key binding JWT with it when presenting. A DID-bound credential doesn't need it, because Credo finds the key through the DID. `credentialInstances` can hold several copies of the same credential, each bound to its own key, as issued with batch issuance.

Records are tagged with `vct`, `alg` and `sdAlg` for queries. `agent.sdJwtVc` also has `getById`, `getAll`, `update` and `deleteById`, and `fromCompact` decodes a credential without verifying it. With [OpenID4VCI](https://credo.js.org/guides/next/protocols/openid4vc/sd-jwt-vc.md), the holder flow returns the `SdJwtVcRecord` with `kmsKeyId` set, and you only store it.

## Present

The holder chooses which claims to disclose with a presentation frame, and adds a key binding JWT for the verifier:

:::holder

```ts
// Received from the verifier
const audience = 'https://verifier.example.com'
const nonce = 'f8b4a1d2-7c1e-4b0a-9d3e-2a6c5e8f1b90'

const presentation = await holder.sdJwtVc.present({
  // firstCredential carries the kmsKeyId of the record
  sdJwtVc: record.firstCredential,
  presentationFrame: { given_name: true, address: { locality: true } },
  verifierMetadata: { audience, nonce, issuedAt: Math.floor(Date.now() / 1000) },
})
```

:::

- `presentationFrame` sets `true` for each selectively disclosable claim to disclose, nested like the payload. Claims that aren't selectively disclosable are always included.
- `verifierMetadata` creates the key binding JWT with the verifier's `audience` and `nonce`, and `additionalPayload` adds claims to it. Key binding fails for a credential without `cnf`. Leave `verifierMetadata` out to present without key binding.

Pass `record.firstCredential` rather than the compact string, so Credo knows which key to sign with. For records with several instances, `useInstanceFromCredentialRecord` from `@credo-ts/core` picks an unused one.

## Verify

:::verifier

```ts
const result = await verifier.sdJwtVc.verify({
  compactSdJwtVc: presentation,
  keyBinding: { audience, nonce },
  requiredClaimKeys: ['given_name', 'address.locality'],
  fetchTypeMetadata: true,
  trustedIssuers: [{ method: 'did', issuance: issuerDid }],
})

if (result.isValid === false) throw result.error
// { vct, iss, cnf, iat, given_name, address: { locality, country }, nationalities: [] }
console.log(result.sdJwtVc.prettyClaims)
console.log(result.sdJwtVc.typeMetadata?.name)
```

:::

`verify` returns `{ isValid: true, sdJwtVc }` or `{ isValid: false, error }`, and `sdJwtVc.prettyClaims` holds the disclosed claims. Verification checks the issuer signature, the digests of the disclosures, `iat`, `nbf` and `exp` (with the agent's `validitySkewSeconds`), the `typ` header and the status. Options:

| Option | Effect |
| --- | --- |
| `keyBinding` | Requires a key binding JWT signed by the `cnf` key, with this `audience` and `nonce`. |
| `requiredClaimKeys` | Claims that must be disclosed, as dot paths such as `address.locality`. |
| `trustedIssuers` | The issuers to accept for this call. |
| `fetchTypeMetadata` | Resolves the type metadata of the `vct` into `sdJwtVc.typeMetadata`. A failed fetch doesn't fail verification. |
| `disableStatusValidation` | Skips the status check. |
| `now` | The time to verify against. |

Trust depends on how the credential is signed:

- DID: any issuer DID is accepted unless `trustedIssuers` or the agent's `getTrustedIssuersForVerification` callback returns a list. With a list, the issuer DID must be on it.
- X.509: verification fails unless a trust anchor is configured, per call or on the agent.

:::verifier

```ts
const x509Result = await verifier.sdJwtVc.verify({
  compactSdJwtVc: x509Credential.compact,
  trustedIssuers: [{ method: 'x509', issuance: [issuerCertificate.toString('pem')] }],
})
if (x509Result.isValid === false) throw x509Result.error
```

:::

To configure trust once for all verifications, see [Trusted issuers](https://credo.js.org/guides/next/dids-and-trust/trust.md).

If the credential has a `status` claim, `verify` fetches the status list and fails when the credential is revoked or suspended. See [Status lists](https://credo.js.org/guides/next/credential-formats/status-lists.md).

### Errors

Many errors from the SD-JWT checks have a `code`, so you can handle them without parsing the message:

```ts
const expired = await issuer.sdJwtVc.sign({
  payload: { vct: 'https://credentials.example.com/identity', exp: Math.floor(Date.now() / 1000) - 3600 },
  issuer: { method: 'did', didUrl: issuerDidUrl },
})

const expiredResult = await verifier.sdJwtVc.verify({ compactSdJwtVc: expired.compact })
if (expiredResult.isValid === false && 'code' in expiredResult.error) {
  // 'JWT_EXPIRED'
  console.log(expiredResult.error.code)
}
```

Common codes are `JWT_EXPIRED`, `JWT_NOT_YET_VALID`, `INVALID_JWT_SIGNATURE` and `STATUS_INVALID`. Time and status errors also have `details` with the values that were compared. Not every error has a code: checks that Credo does itself, such as issuer trust and the key binding audience, and some library checks, such as a missing required claim, only have a message.

## Type metadata and module options

SD-JWT VC type metadata describes a `vct`: display names, claim labels and rendering. By default Credo only resolves `vct` values that are HTTPS URLs, by fetching them. To serve type metadata yourself, or resolve other `vct` values, register `SdJwtVcModule` with a `customTypeMetadataResolver`:

```ts
const identityTypeMetadata = {
  vct: 'https://credentials.example.com/identity',
  name: 'Identity credential',
  display: [{ locale: 'en-US', name: 'Identity credential' }],
  claims: [{ path: ['given_name'], display: [{ locale: 'en-US', label: 'Given name' }] }],
}

const sdJwtVcModule = new SdJwtVcModule({
  // Called for the `vct` of a credential and for every `extends` value in its type metadata
  customTypeMetadataResolver: async (vct, _integrity, { defaultResolver }) => {
    if (vct === identityTypeMetadata.vct) return identityTypeMetadata
    return defaultResolver({})
  },
  // Replaces the HTTP GET of the status list JWT. The JWT is verified after it is returned.
  customStatusListFetcher: async (uri, { defaultFetcher }) => {
    if (!uri.startsWith('https://')) throw new Error(`Refusing to fetch status list over ${uri}`)
    return defaultFetcher()
  },
})
```

- `customTypeMetadataResolver` is called for the `vct`, and for each `extends` value in the type metadata. Return the type metadata document, `undefined` for none, or call `defaultResolver` for the HTTPS fetch. If the credential has a `vct#integrity` claim, your resolver has to check it; `IntegrityVerifier` from `@credo-ts/core` does that. The default resolver checks integrity itself.
- `customStatusListFetcher` replaces the HTTP request for the status list JWT, for example to allow only certain hosts or to cache lists. Credo verifies the returned JWT as usual.

Pass the module under the `sdJwtVc` key, which replaces the default module. `agent.sdJwtVc.fetchTypeMetadata(sdJwtVc)` resolves type metadata outside of verification.

## Next steps

- [SD-JWT VC with OpenID4VC](https://credo.js.org/guides/next/protocols/openid4vc/sd-jwt-vc.md)
- [Status lists](https://credo.js.org/guides/next/credential-formats/status-lists.md)
- [Trusted issuers](https://credo.js.org/guides/next/dids-and-trust/trust.md)
