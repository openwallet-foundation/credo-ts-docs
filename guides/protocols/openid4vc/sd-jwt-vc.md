# SD-JWT VC with OpenID4VC

> Issue, receive and verify SD-JWT VCs over OpenID4VCI and OpenID4VP with Credo, including selective disclosure with DCQL and transaction data.

This page covers what is specific to SD-JWT VC in OpenID4VC, in the order of the flow. Issuance covers the issuer's credential configuration and signing, and what the holder stores. Presentation covers the verifier's DCQL query, transaction data and the result. [Issuing credentials](https://credo.js.org/guides/protocols/openid4vc/issuer.md), [Receiving credentials](https://credo.js.org/guides/protocols/openid4vc/receive.md), [Presenting credentials](https://credo.js.org/guides/protocols/openid4vc/present.md) and [Verifying credentials](https://credo.js.org/guides/protocols/openid4vc/verifier.md) explain the flow itself, and [SD-JWT VC](https://credo.js.org/guides/credential-formats/sd-jwt-vc.md) explains the format.

Use SD-JWT VC by default. HAIP requires SD-JWT VC or mdoc, and the EU PID uses SD-JWT VC.

## Issuance

### Configure the credential

Add a `dc+sd-jwt` entry to the `credentialConfigurationsSupported` of the issuer:

:::issuer

```ts
const credentialConfigurationsSupported = {
  'identity-sd-jwt': {
    format: OpenId4VciCredentialFormatProfile.SdJwtDc,
    vct: 'urn:example:identity:1',
    scope: 'identity',
    cryptographic_binding_methods_supported: ['jwk'],
    credential_signing_alg_values_supported: [KnownJwaSignatureAlgorithms.ES256],
    proof_types_supported: {
      jwt: { proof_signing_alg_values_supported: [KnownJwaSignatureAlgorithms.ES256] },
    },
    credential_metadata: {
      display: [{ name: 'Identity card', locale: 'en', background_color: '#1d3557', text_color: '#ffffff' }],
      claims: [
        { path: ['given_name'], display: [{ name: 'Given name', locale: 'en' }] },
        { path: ['family_name'], display: [{ name: 'Family name', locale: 'en' }] },
        { path: ['birthdate'], display: [{ name: 'Date of birth', locale: 'en' }] },
        { path: ['address', 'country'], display: [{ name: 'Country', locale: 'en' }] },
      ],
    },
  },
} satisfies Record<string, OpenId4VciCredentialConfigurationSupportedWithFormats>
```

:::

- `vct` is the credential type. Verifiers request credentials by it, and Credo checks that every credential the mapper returns has this `vct`. If it's an HTTPS URL, a Credo holder fetches the type metadata from it when it receives the credential and keeps it on the record (`record.typeMetadata`).
- `cryptographic_binding_methods_supported` decides what the holder binds the credential to: `jwk` for a key (the default choice, and what HAIP requires), or DID methods such as `did:key`.

`credential_metadata` holds what wallets show: the card in `display` and a label per claim in `claims`, where `path` points into the credential. Add a `scope` if you offer the credential through the [authorization code flow](https://credo.js.org/guides/protocols/openid4vc/authorization.md).

Wallets that implement older drafts use the format `vc+sd-jwt`. Credo accepts it as SD-JWT VC when the configuration has a `vct`, and signs the credential with `vc+sd-jwt` as `typ`. Without a `vct`, `vc+sd-jwt` means a W3C VCDM 2.0 credential, see [W3C VCs with OpenID4VC](https://credo.js.org/guides/protocols/openid4vc/w3c.md).

### Sign the credential

The mapper returns the SD-JWT VC sign options, one entry for each holder key:

:::issuer

```ts
const credentialRequestToCredentialMapper: OpenId4VciCredentialRequestToCredentialMapper = async ({
  credentialConfiguration,
  holderBinding,
  issuanceSession,
}) => {
  if (credentialConfiguration.format !== OpenId4VciCredentialFormatProfile.SdJwtDc) {
    throw new Error(`Unsupported credential format ${credentialConfiguration.format}`)
  }
  if (holderBinding.bindingMethod !== 'jwk') throw new Error('Only jwk holder binding is supported')

  // Look up the data for this user, e.g. based on the issuance metadata of the offer
  const { userId } = issuanceSession.issuanceMetadata ?? {}
  if (userId !== 'user-123') throw new Error('Unknown user')

  return {
    type: 'credentials',
    format: ClaimFormat.SdJwtDc,
    // One credential per holder key (more than one with batch issuance)
    credentials: holderBinding.keys.map((holder) => ({
      holder,
      issuer: { method: 'x5c', x5c: [issuerCertificate], issuer: issuerUrl },
      payload: {
        vct: credentialConfiguration.vct,
        given_name: 'Erika',
        family_name: 'Mustermann',
        birthdate: '1984-01-26',
        address: { street_address: 'Heidestraße 17', locality: 'Köln', country: 'DE' },
      },
      disclosureFrame: {
        _sd: ['given_name', 'family_name', 'birthdate'],
        address: { _sd: ['street_address', 'locality', 'country'] },
      },
    })),
  } satisfies OpenId4VciSignSdJwtCredentials
}
```

:::

- `payload.vct` must be the `vct` of the configuration. Credo adds `iat`, and sets `iss` and `cnf` from `issuer` and `holder`.
- `issuer` signs with an X.509 certificate chain (`x5c`, leaf first) or a DID (`{ method: 'did', didUrl }`, for a DID created in this agent). The optional `issuer` URL becomes the `iss` claim and must match a DNS or URI subject alternative name of the leaf certificate.
- `disclosureFrame` lists in `_sd` the claims the holder can disclose one by one. Claims that aren't listed are always visible. [SD-JWT VC](https://credo.js.org/guides/credential-formats/sd-jwt-vc.md) explains nested frames and decoys.

For revocation, add a `status` claim to the payload. See [Status lists](https://credo.js.org/guides/credential-formats/status-lists.md).

### Trust the issuer

The holder verifies each credential when it receives it, and the verifier verifies it again in the presentation. For an X.509-signed credential, both need the issuer certificate or its root CA:

```ts
// Both the holder and the verifier only accept credentials from issuers they trust
holder.x509.config.addTrustedCertificate(issuerCertificate)
verifier.x509.config.addTrustedCertificate(issuerCertificate)
```

DID-signed credentials are accepted from any DID unless you configure trusted issuers. [Trusted issuers](https://credo.js.org/guides/dids-and-trust/trust.md) covers both, and how to decide per verification.

### Receive and store

The holder side is the same as for other formats. Only the record type differs:

:::holder

```ts
const resolvedOffer = await holder.openid4vc.holder.resolveCredentialOffer(credentialOffer)
const token = await holder.openid4vc.holder.requestToken({ resolvedCredentialOffer: resolvedOffer })

const { credentials } = await holder.openid4vc.holder.requestCredentials({
  resolvedCredentialOffer: resolvedOffer,
  ...token,
  credentialBindingResolver: async ({ proofTypes }) => {
    const algorithm = proofTypes.jwt?.supportedSignatureAlgorithms[0]
    if (!algorithm) throw new Error('No supported proof of possession algorithm')

    const key = await holder.kms.createKeyForSignatureAlgorithm({ algorithm })
    return { method: 'jwk', keys: [PublicJwk.fromPublicJwk(key.publicJwk)] }
  },
})

for (const { record } of credentials) {
  if (!(record instanceof SdJwtVcRecord)) throw new Error('Expected an SD-JWT VC')

  await holder.sdJwtVc.store({ record })
  console.log('Stored SD-JWT VC with claims', record.firstCredential.prettyClaims)
}
```

:::

`requestCredentials` doesn't store anything. The `SdJwtVcRecord` has one instance per credential the issuer returned, so a batch ends up in one record. `record.firstCredential.prettyClaims` has all claims, decoded.

## Presentation

The verifier needs the same trust configuration as the holder, see [Trust the issuer](#trust-the-issuer).

### Request claims with DCQL

The verifier asks for SD-JWT VCs by `vct` and lists the claims it needs:

:::verifier

```ts
const { authorizationRequest, verificationSession } = await verifier.openid4vc.verifier.createAuthorizationRequest({
  verifierId: verifierRecord.verifierId,
  requestSigner: { method: 'none' },
  dcql: {
    query: {
      credentials: [
        {
          id: 'identity',
          format: 'dc+sd-jwt',
          meta: { vct_values: ['urn:example:identity:1'] },
          // Only these claims are disclosed, the others stay hidden
          claims: [{ path: ['given_name'] }, { path: ['address', 'country'] }],
        },
      ],
    },
  },
  transactionData: [
    {
      type: 'urn:example:transaction:age-check',
      credential_ids: ['identity'],
      transaction_data_hashes_alg: ['sha-256'],
    },
  ],
})
```

:::

- `format` is `dc+sd-jwt`. `meta.vct_values` also matches credentials whose type metadata extends one of the values.
- Each entry in `claims` has a `path` into the credential. `null` in a path selects all items of an array, and a number selects one item. Add `values` to only accept certain values, and `claim_sets` to accept alternative combinations of claims.

The wallet discloses only the requested claims. Claims the issuer didn't make selectively disclosable are always in the presentation.

### Add transaction data

A verifier can ask the holder to sign over extra data, such as the details of a payment, as part of the presentation. The request above has one `transactionData` entry. `type` is defined by your application, and `credential_ids` lists the DCQL credential query ids that may sign it. `transaction_data_hashes_alg` defaults to `sha-256`. Credo supports transaction data for SD-JWT VC only, and not with OpenID4VP draft 21.

### Sign transaction data

`resolvedRequest.transactionData` lists each entry with the credentials that can sign it. Show the user what they're signing, and pass one credential id per entry when you accept:

:::holder

```ts
const resolvedRequest = await holder.openid4vc.holder.resolveOpenId4VpAuthorizationRequest(authorizationRequest)
if (!resolvedRequest.dcql?.queryResult.can_be_satisfied) throw new Error('No matching credentials')

const result = await holder.openid4vc.holder.acceptOpenId4VpAuthorizationRequest({
  authorizationRequestPayload: resolvedRequest.authorizationRequestPayload,
  dcql: { credentials: holder.openid4vc.holder.selectCredentialsForDcqlRequest(resolvedRequest.dcql.queryResult) },
  // Sign each transaction data entry with one of the credentials it lists
  transactionData: resolvedRequest.transactionData?.map(({ matchedCredentialIds }) => ({
    credentialId: matchedCredentialIds[0],
  })),
})
if (!result.ok) throw new Error(`Verifier rejected the presentation: ${result.serverResponse.status}`)
```

:::

The holder includes a hash of each entry in the key binding JWT.

### Read the disclosed claims

After the session reaches `ResponseVerified`, the presentation is an `SdJwtVc`:

:::verifier

```ts
const { dcql, transactionData } = await verifier.openid4vc.verifier.getVerifiedAuthorizationResponse(
  verificationSession.id
)

const [presentation] = dcql?.presentations.identity ?? []
if (presentation?.claimFormat !== ClaimFormat.SdJwtDc) throw new Error('Expected an SD-JWT VC presentation')

// Only the disclosed claims (plus the always visible ones, like vct and iss)
console.log('Disclosed claims', presentation.prettyClaims)
console.log(
  'Signed transaction data',
  transactionData?.map(({ decoded }) => decoded.type)
)
```

:::

`prettyClaims` has the disclosed claims and the claims that are always visible, such as `vct`, `iss` and `cnf`. `payload` has the raw JWT payload. `transactionData` has an entry per transaction data entry, with the decoded entry, the credential query id that signed it, and the hashes Credo checked.

## Full example

The issuer, holder and verifier from this page in one process:

<details>
<summary>openid4vc-sd-jwt-vc.ts</summary>

```ts
import { Agent, ClaimFormat, SdJwtVcRecord, type X509Certificate } from '@credo-ts/core'
import { KnownJwaSignatureAlgorithms, PublicJwk } from '@credo-ts/core/kms'
import { openid4vcBundle } from '@credo-ts/drizzle-storage/openid4vc'
import { agentDependencies } from '@credo-ts/node'
import {
  type OpenId4VciCredentialConfigurationSupportedWithFormats,
  OpenId4VciCredentialFormatProfile,
  type OpenId4VciCredentialRequestToCredentialMapper,
  type OpenId4VciSignSdJwtCredentials,
  OpenId4VcModule,
} from '@credo-ts/openid4vc'
import express from 'express'
import { exampleStorage } from './example-storage.js'

const issuerUrl = 'http://localhost:4031'
const verifierUrl = 'http://localhost:4032'

// In-memory storage and keys, so the example leaves nothing behind
const issuerStorage = await exampleStorage([openid4vcBundle])
const verifierStorage = await exampleStorage([openid4vcBundle])
const holderStorage = await exampleStorage([openid4vcBundle])

const credentialConfigurationsSupported = {
  'identity-sd-jwt': {
    format: OpenId4VciCredentialFormatProfile.SdJwtDc,
    vct: 'urn:example:identity:1',
    scope: 'identity',
    cryptographic_binding_methods_supported: ['jwk'],
    credential_signing_alg_values_supported: [KnownJwaSignatureAlgorithms.ES256],
    proof_types_supported: {
      jwt: { proof_signing_alg_values_supported: [KnownJwaSignatureAlgorithms.ES256] },
    },
    credential_metadata: {
      display: [{ name: 'Identity card', locale: 'en', background_color: '#1d3557', text_color: '#ffffff' }],
      claims: [
        { path: ['given_name'], display: [{ name: 'Given name', locale: 'en' }] },
        { path: ['family_name'], display: [{ name: 'Family name', locale: 'en' }] },
        { path: ['birthdate'], display: [{ name: 'Date of birth', locale: 'en' }] },
        { path: ['address', 'country'], display: [{ name: 'Country', locale: 'en' }] },
      ],
    },
  },
} satisfies Record<string, OpenId4VciCredentialConfigurationSupportedWithFormats>

// The issuer certificate is created once the issuer agent is initialized (see below)
let issuerCertificate: X509Certificate

const credentialRequestToCredentialMapper: OpenId4VciCredentialRequestToCredentialMapper = async ({
  credentialConfiguration,
  holderBinding,
  issuanceSession,
}) => {
  if (credentialConfiguration.format !== OpenId4VciCredentialFormatProfile.SdJwtDc) {
    throw new Error(`Unsupported credential format ${credentialConfiguration.format}`)
  }
  if (holderBinding.bindingMethod !== 'jwk') throw new Error('Only jwk holder binding is supported')

  // Look up the data for this user, e.g. based on the issuance metadata of the offer
  const { userId } = issuanceSession.issuanceMetadata ?? {}
  if (userId !== 'user-123') throw new Error('Unknown user')

  return {
    type: 'credentials',
    format: ClaimFormat.SdJwtDc,
    // One credential per holder key (more than one with batch issuance)
    credentials: holderBinding.keys.map((holder) => ({
      holder,
      issuer: { method: 'x5c', x5c: [issuerCertificate], issuer: issuerUrl },
      payload: {
        vct: credentialConfiguration.vct,
        given_name: 'Erika',
        family_name: 'Mustermann',
        birthdate: '1984-01-26',
        address: { street_address: 'Heidestraße 17', locality: 'Köln', country: 'DE' },
      },
      disclosureFrame: {
        _sd: ['given_name', 'family_name', 'birthdate'],
        address: { _sd: ['street_address', 'locality', 'country'] },
      },
    })),
  } satisfies OpenId4VciSignSdJwtCredentials
}

const issuerApp = express()
const issuer = new Agent({
  config: { allowInsecureHttpUrls: true },
  dependencies: agentDependencies,
  modules: {
    ...issuerStorage,
    openid4vc: new OpenId4VcModule({
      app: issuerApp,
      issuer: { baseUrl: `${issuerUrl}/oid4vci`, credentialRequestToCredentialMapper },
    }),
  },
})

const verifierApp = express()
const verifier = new Agent({
  config: { allowInsecureHttpUrls: true },
  dependencies: agentDependencies,
  modules: {
    ...verifierStorage,
    openid4vc: new OpenId4VcModule({ app: verifierApp, verifier: { baseUrl: `${verifierUrl}/oid4vp` } }),
  },
})

const holder = new Agent({
  config: { allowInsecureHttpUrls: true },
  dependencies: agentDependencies,
  modules: {
    ...holderStorage,
    openid4vc: new OpenId4VcModule(),
  },
})

await issuer.initialize()
await verifier.initialize()
await holder.initialize()
const issuerServer = issuerApp.listen(4031)
const verifierServer = verifierApp.listen(4032)

// Self-signed certificate for the example. The SAN must match the host of `issuerUrl`.
issuerCertificate = await issuer.x509.createCertificate({
  authorityKey: PublicJwk.fromPublicJwk((await issuer.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })).publicJwk),
  issuer: { commonName: 'Credo example issuer', countryName: 'NL' },
  extensions: { subjectAlternativeName: { name: [{ type: 'dns', value: 'localhost' }] } },
})

// Both the holder and the verifier only accept credentials from issuers they trust
holder.x509.config.addTrustedCertificate(issuerCertificate)
verifier.x509.config.addTrustedCertificate(issuerCertificate)

const issuerRecord = await issuer.openid4vc.issuer.createIssuer({
  issuerId: 'example-issuer',
  display: [{ name: 'Credo example issuer', locale: 'en' }],
  credentialConfigurationsSupported,
})

const { credentialOffer } = await issuer.openid4vc.issuer.createCredentialOffer({
  issuerId: issuerRecord.issuerId,
  credentialConfigurationIds: ['identity-sd-jwt'],
  preAuthorizedCodeFlowConfig: {},
  issuanceMetadata: { userId: 'user-123' },
})

const resolvedOffer = await holder.openid4vc.holder.resolveCredentialOffer(credentialOffer)
const token = await holder.openid4vc.holder.requestToken({ resolvedCredentialOffer: resolvedOffer })

const { credentials } = await holder.openid4vc.holder.requestCredentials({
  resolvedCredentialOffer: resolvedOffer,
  ...token,
  credentialBindingResolver: async ({ proofTypes }) => {
    const algorithm = proofTypes.jwt?.supportedSignatureAlgorithms[0]
    if (!algorithm) throw new Error('No supported proof of possession algorithm')

    const key = await holder.kms.createKeyForSignatureAlgorithm({ algorithm })
    return { method: 'jwk', keys: [PublicJwk.fromPublicJwk(key.publicJwk)] }
  },
})

for (const { record } of credentials) {
  if (!(record instanceof SdJwtVcRecord)) throw new Error('Expected an SD-JWT VC')

  await holder.sdJwtVc.store({ record })
  console.log('Stored SD-JWT VC with claims', record.firstCredential.prettyClaims)
}

const verifierRecord = await verifier.openid4vc.verifier.createVerifier({
  verifierId: 'example-verifier',
  clientMetadata: { client_name: 'Credo example verifier' },
})

const { authorizationRequest, verificationSession } = await verifier.openid4vc.verifier.createAuthorizationRequest({
  verifierId: verifierRecord.verifierId,
  requestSigner: { method: 'none' },
  dcql: {
    query: {
      credentials: [
        {
          id: 'identity',
          format: 'dc+sd-jwt',
          meta: { vct_values: ['urn:example:identity:1'] },
          // Only these claims are disclosed, the others stay hidden
          claims: [{ path: ['given_name'] }, { path: ['address', 'country'] }],
        },
      ],
    },
  },
  transactionData: [
    {
      type: 'urn:example:transaction:age-check',
      credential_ids: ['identity'],
      transaction_data_hashes_alg: ['sha-256'],
    },
  ],
})

const resolvedRequest = await holder.openid4vc.holder.resolveOpenId4VpAuthorizationRequest(authorizationRequest)
if (!resolvedRequest.dcql?.queryResult.can_be_satisfied) throw new Error('No matching credentials')

const result = await holder.openid4vc.holder.acceptOpenId4VpAuthorizationRequest({
  authorizationRequestPayload: resolvedRequest.authorizationRequestPayload,
  dcql: { credentials: holder.openid4vc.holder.selectCredentialsForDcqlRequest(resolvedRequest.dcql.queryResult) },
  // Sign each transaction data entry with one of the credentials it lists
  transactionData: resolvedRequest.transactionData?.map(({ matchedCredentialIds }) => ({
    credentialId: matchedCredentialIds[0],
  })),
})
if (!result.ok) throw new Error(`Verifier rejected the presentation: ${result.serverResponse.status}`)

const { dcql, transactionData } = await verifier.openid4vc.verifier.getVerifiedAuthorizationResponse(
  verificationSession.id
)

const [presentation] = dcql?.presentations.identity ?? []
if (presentation?.claimFormat !== ClaimFormat.SdJwtDc) throw new Error('Expected an SD-JWT VC presentation')

// Only the disclosed claims (plus the always visible ones, like vct and iss)
console.log('Disclosed claims', presentation.prettyClaims)
console.log(
  'Signed transaction data',
  transactionData?.map(({ decoded }) => decoded.type)
)

issuerServer.close()
verifierServer.close()
await issuer.shutdown()
await verifier.shutdown()
await holder.shutdown()
```

</details>

## Next steps

- [SD-JWT VC](https://credo.js.org/guides/credential-formats/sd-jwt-vc.md): signing, presenting and verifying outside OpenID4VC.
- [Digital Credentials API](https://credo.js.org/guides/protocols/dc-api.md): request SD-JWT VCs from a website.
- [Authorization and wallet security](https://credo.js.org/guides/protocols/openid4vc/authorization.md): DPoP, wallet attestations and key attestations.
