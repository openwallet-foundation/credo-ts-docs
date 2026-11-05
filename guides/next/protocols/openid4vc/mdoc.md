# mdoc with OpenID4VC

> Issue, receive and verify ISO 18013-5 mdocs, such as mobile driving licences, over OpenID4VCI and OpenID4VP with Credo.

This page covers what is specific to mdoc (ISO/IEC 18013-5, `mso_mdoc`) in OpenID4VC, in the order of the flow. Issuance covers the issuer's credential configuration, certificate and signing, and the holder's trust and storage. Presentation covers the verifier's DCQL query and the result. [Issuing credentials](https://credo.js.org/guides/next/protocols/openid4vc/issuer.md), [Receiving credentials](https://credo.js.org/guides/next/protocols/openid4vc/receive.md), [Presenting credentials](https://credo.js.org/guides/next/protocols/openid4vc/present.md) and [Verifying credentials](https://credo.js.org/guides/next/protocols/openid4vc/verifier.md) explain the flow itself, and [mdoc](https://credo.js.org/guides/next/credential-formats/mdoc.md) explains the format.

Use mdoc for credentials that follow an ISO document type, such as the mobile driving licence, or that holders also present in person ([ISO mdoc](https://credo.js.org/guides/next/protocols/mdoc.md)). To request mdocs from a website, see [Digital Credentials API](https://credo.js.org/guides/next/protocols/dc-api.md).

## Issuance

### Configure the credential

Add an `mso_mdoc` entry to the `credentialConfigurationsSupported` of the issuer:

:::issuer

```ts
const mdlNamespace = 'org.iso.18013.5.1'

const credentialConfigurationsSupported = {
  'mdl-mdoc': {
    format: OpenId4VciCredentialFormatProfile.MsoMdoc,
    doctype: 'org.iso.18013.5.1.mDL',
    scope: 'mdl',
    cryptographic_binding_methods_supported: ['cose_key'],
    proof_types_supported: {
      jwt: { proof_signing_alg_values_supported: [KnownJwaSignatureAlgorithms.ES256] },
    },
    credential_metadata: {
      display: [{ name: 'Mobile driving licence', locale: 'en' }],
      claims: [
        { path: [mdlNamespace, 'given_name'], display: [{ name: 'Given name', locale: 'en' }] },
        { path: [mdlNamespace, 'family_name'], display: [{ name: 'Family name', locale: 'en' }] },
        { path: [mdlNamespace, 'birth_date'], display: [{ name: 'Date of birth', locale: 'en' }] },
      ],
    },
  },
} satisfies Record<string, OpenId4VciCredentialConfigurationSupportedWithFormats>
```

:::

- `doctype` is the document type, such as `org.iso.18013.5.1.mDL` for a mobile driving licence. Credo checks that every mdoc the mapper returns has this doctype.
- An mdoc is always bound to a key of the holder, never to a DID. `cose_key` (or `jwk`) in `cryptographic_binding_methods_supported` tells the wallet so.

In `credential_metadata.claims`, the `path` of a data element is its namespace and element identifier. Add a `scope` if you offer the credential through the [authorization code flow](https://credo.js.org/guides/next/protocols/openid4vc/authorization.md).

### Create the issuer certificate

mdocs are signed with an X.509 certificate, the document signer certificate:

:::issuer

```ts
// Self-signed for the example. In production this is a document signer certificate issued by your IACA.
issuerCertificate = await issuer.x509.createCertificate({
  authorityKey: PublicJwk.fromPublicJwk((await issuer.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })).publicJwk),
  // mdoc verification requires a country (C) in the issuer certificate
  issuer: { commonName: 'Credo example mDL issuer', countryName: 'NL' },
})
```

:::

The subject must have a country (`countryName`): verification fails without it, and checks that `issuing_country` in the mdoc matches it (and `issuing_jurisdiction` the state, if present). In production, your issuing authority CA (IACA) issues the document signer certificate, and verifiers trust the IACA certificate. Pass the chain as an array, leaf first, to include it in the mdoc. [X.509 certificates](https://credo.js.org/guides/next/dids-and-trust/x509.md) explains creating certificates and chains.

### Sign the credential

The mapper returns the mdoc sign options, one entry for each holder key:

:::issuer

```ts
const credentialRequestToCredentialMapper: OpenId4VciCredentialRequestToCredentialMapper = async ({
  credentialConfiguration,
  holderBinding,
}) => {
  if (credentialConfiguration.format !== OpenId4VciCredentialFormatProfile.MsoMdoc) {
    throw new Error(`Unsupported credential format ${credentialConfiguration.format}`)
  }
  // An mdoc is always bound to a key, never to a DID
  if (holderBinding.bindingMethod !== 'jwk') throw new Error('Expected jwk holder binding')

  const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

  return {
    type: 'credentials',
    format: ClaimFormat.MsoMdoc,
    credentials: holderBinding.keys.map(({ jwk }) => ({
      docType: credentialConfiguration.doctype,
      holderKey: jwk,
      issuerCertificate,
      // `signed` and `validFrom` default to now
      validityInfo: { validUntil: oneYearFromNow },
      namespaces: {
        [mdlNamespace]: {
          given_name: 'Erika',
          family_name: 'Mustermann',
          birth_date: new DateOnly('1984-01-26'),
          issue_date: new DateOnly(),
          expiry_date: new DateOnly(oneYearFromNow.toISOString().slice(0, 10)),
          // Must match the country (C) of the issuer certificate
          issuing_country: 'NL',
          document_number: 'NL-123456',
        },
      },
    })),
  } satisfies OpenId4VciSignMdocCredentials
}
```

:::

- `docType` must be the `doctype` of the configuration, and `holderKey` is the key from `holderBinding`.
- `validityInfo` needs `validUntil`. Leave `signed` and `validFrom` out so they default to now: Credo rejects a `validFrom` that is even a few milliseconds before `signed`, which happens if you pass `new Date()`.
- `namespaces` maps each namespace to its data elements. Use `DateOnly` for elements of type `full-date`, such as `birth_date`. Every data element can be disclosed on its own.

For revocation, add `statusInfo` with a [status list](https://credo.js.org/guides/next/credential-formats/status-lists.md). `keyAuthorizations` lists data elements the wallet may sign itself (device signed).

### Trust the issuer

The holder verifies the mdoc when it receives it, and the verifier verifies it again in the presentation. Both need the issuer certificate or its IACA root:

```ts
// The holder verifies the mdoc when receiving it, and the verifier when it is presented
holder.x509.config.addTrustedCertificate(issuerCertificate)
verifier.x509.config.addTrustedCertificate(issuerCertificate)
```

Without a trusted certificate, verification fails. To decide per verification, for example from a list of IACAs, use `getTrustedIssuersForVerification` in the agent config. See [Trusted issuers](https://credo.js.org/guides/next/dids-and-trust/trust.md).

### Receive and store

The binding resolver must return keys (`method: 'jwk'`):

:::holder

```ts
const resolvedOffer = await holder.openid4vc.holder.resolveCredentialOffer(credentialOffer)
const token = await holder.openid4vc.holder.requestToken({ resolvedCredentialOffer: resolvedOffer })

const { credentials } = await holder.openid4vc.holder.requestCredentials({
  resolvedCredentialOffer: resolvedOffer,
  ...token,
  // mdoc only supports binding to a key (jwk)
  credentialBindingResolver: async ({ proofTypes }) => {
    const algorithm = proofTypes.jwt?.supportedSignatureAlgorithms[0]
    if (!algorithm) throw new Error('No supported proof of possession algorithm')

    const key = await holder.kms.createKeyForSignatureAlgorithm({ algorithm })
    return { method: 'jwk', keys: [PublicJwk.fromPublicJwk(key.publicJwk)] }
  },
})

for (const { record } of credentials) {
  if (!(record instanceof MdocRecord)) throw new Error('Expected an mdoc')

  await holder.mdoc.store({ record })
  console.log(record.firstCredential.docType, record.firstCredential.issuerSignedNamespaces)
}
```

:::

`requestCredentials` doesn't store anything. The `MdocRecord` has one instance per mdoc the issuer returned. `record.firstCredential.issuerSignedNamespaces` has the data elements per namespace.

## Presentation

The verifier needs the same trust configuration as the holder, see [Trust the issuer](#trust-the-issuer).

### Request data elements with DCQL

The verifier asks for an mdoc by doctype and lists the data elements it needs:

:::verifier

```ts
const { authorizationRequest, verificationSession } = await verifier.openid4vc.verifier.createAuthorizationRequest({
  verifierId: verifierRecord.verifierId,
  requestSigner: { method: 'none' },
  // Encrypted response (the default)
  responseMode: 'direct_post.jwt',
  dcql: {
    query: {
      credentials: [
        {
          id: 'mdl',
          format: 'mso_mdoc',
          meta: { doctype_value: 'org.iso.18013.5.1.mDL' },
          claims: [
            { path: ['org.iso.18013.5.1', 'given_name'], intent_to_retain: false },
            { path: ['org.iso.18013.5.1', 'birth_date'], intent_to_retain: false },
          ],
        },
      ],
    },
  },
})
```

:::

`format` is `mso_mdoc` and `meta.doctype_value` the doctype. Each claim `path` is a namespace and a data element identifier, and `intent_to_retain` tells the wallet whether you store the element. The wallet discloses only the requested data elements. Keep the default response mode `direct_post.jwt`: with OpenID4VP drafts 21 and 24, mdoc requests require it.

### Present

Presenting works as for other formats. Credo creates an ISO 18013-5 device response, signed with the key the mdoc is bound to:

:::holder

```ts
const resolvedRequest = await holder.openid4vc.holder.resolveOpenId4VpAuthorizationRequest(authorizationRequest)
if (!resolvedRequest.dcql?.queryResult.can_be_satisfied) throw new Error('No matching mdoc')

const result = await holder.openid4vc.holder.acceptOpenId4VpAuthorizationRequest({
  authorizationRequestPayload: resolvedRequest.authorizationRequestPayload,
  dcql: { credentials: holder.openid4vc.holder.selectCredentialsForDcqlRequest(resolvedRequest.dcql.queryResult) },
})
if (!result.ok) throw new Error(`Verifier rejected the presentation: ${result.serverResponse.status}`)
```

:::

### Read the disclosed data elements

After the session reaches `ResponseVerified`, the presentation is an `MdocDeviceResponse`:

:::verifier

```ts
const { dcql } = await verifier.openid4vc.verifier.getVerifiedAuthorizationResponse(verificationSession.id)

const [deviceResponse] = dcql?.presentations.mdl ?? []
if (deviceResponse?.claimFormat !== ClaimFormat.MsoMdoc) throw new Error('Expected an mdoc presentation')

// { 'org.iso.18013.5.1.mDL': { 'org.iso.18013.5.1': { given_name: 'Erika', birth_date: DateOnly } } }
console.log(deviceResponse.issuerClaims)
```

:::

`issuerClaims` has the issuer-signed data elements per doctype and namespace. `deviceClaims` has the data elements the wallet signed itself, if any.

## Full example

The issuer, holder and verifier from this page in one process:

<details>
<summary>openid4vc-mdoc.ts</summary>

```ts
import { Agent, ClaimFormat, DateOnly, MdocRecord, type X509Certificate } from '@credo-ts/core'
import { KnownJwaSignatureAlgorithms, PublicJwk } from '@credo-ts/core/kms'
import { openid4vcBundle } from '@credo-ts/drizzle-storage/openid4vc'
import { agentDependencies } from '@credo-ts/node'
import {
  type OpenId4VciCredentialConfigurationSupportedWithFormats,
  OpenId4VciCredentialFormatProfile,
  type OpenId4VciCredentialRequestToCredentialMapper,
  type OpenId4VciSignMdocCredentials,
  OpenId4VcModule,
} from '@credo-ts/openid4vc'
import express from 'express'
import { exampleStorage } from './example-storage.js'

const issuerUrl = 'http://localhost:4033'
const verifierUrl = 'http://localhost:4034'

// In-memory storage and keys, so the example leaves nothing behind
const issuerStorage = await exampleStorage([openid4vcBundle])
const holderStorage = await exampleStorage([openid4vcBundle])

const verifierStorage = await exampleStorage([openid4vcBundle])

const mdlNamespace = 'org.iso.18013.5.1'

const credentialConfigurationsSupported = {
  'mdl-mdoc': {
    format: OpenId4VciCredentialFormatProfile.MsoMdoc,
    doctype: 'org.iso.18013.5.1.mDL',
    scope: 'mdl',
    cryptographic_binding_methods_supported: ['cose_key'],
    proof_types_supported: {
      jwt: { proof_signing_alg_values_supported: [KnownJwaSignatureAlgorithms.ES256] },
    },
    credential_metadata: {
      display: [{ name: 'Mobile driving licence', locale: 'en' }],
      claims: [
        { path: [mdlNamespace, 'given_name'], display: [{ name: 'Given name', locale: 'en' }] },
        { path: [mdlNamespace, 'family_name'], display: [{ name: 'Family name', locale: 'en' }] },
        { path: [mdlNamespace, 'birth_date'], display: [{ name: 'Date of birth', locale: 'en' }] },
      ],
    },
  },
} satisfies Record<string, OpenId4VciCredentialConfigurationSupportedWithFormats>

// The issuer certificate is created once the issuer agent is initialized (see below)
let issuerCertificate: X509Certificate

const credentialRequestToCredentialMapper: OpenId4VciCredentialRequestToCredentialMapper = async ({
  credentialConfiguration,
  holderBinding,
}) => {
  if (credentialConfiguration.format !== OpenId4VciCredentialFormatProfile.MsoMdoc) {
    throw new Error(`Unsupported credential format ${credentialConfiguration.format}`)
  }
  // An mdoc is always bound to a key, never to a DID
  if (holderBinding.bindingMethod !== 'jwk') throw new Error('Expected jwk holder binding')

  const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

  return {
    type: 'credentials',
    format: ClaimFormat.MsoMdoc,
    credentials: holderBinding.keys.map(({ jwk }) => ({
      docType: credentialConfiguration.doctype,
      holderKey: jwk,
      issuerCertificate,
      // `signed` and `validFrom` default to now
      validityInfo: { validUntil: oneYearFromNow },
      namespaces: {
        [mdlNamespace]: {
          given_name: 'Erika',
          family_name: 'Mustermann',
          birth_date: new DateOnly('1984-01-26'),
          issue_date: new DateOnly(),
          expiry_date: new DateOnly(oneYearFromNow.toISOString().slice(0, 10)),
          // Must match the country (C) of the issuer certificate
          issuing_country: 'NL',
          document_number: 'NL-123456',
        },
      },
    })),
  } satisfies OpenId4VciSignMdocCredentials
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
const issuerServer = issuerApp.listen(4033)
const verifierServer = verifierApp.listen(4034)

// Self-signed for the example. In production this is a document signer certificate issued by your IACA.
issuerCertificate = await issuer.x509.createCertificate({
  authorityKey: PublicJwk.fromPublicJwk((await issuer.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })).publicJwk),
  // mdoc verification requires a country (C) in the issuer certificate
  issuer: { commonName: 'Credo example mDL issuer', countryName: 'NL' },
})

// The holder verifies the mdoc when receiving it, and the verifier when it is presented
holder.x509.config.addTrustedCertificate(issuerCertificate)
verifier.x509.config.addTrustedCertificate(issuerCertificate)

const issuerRecord = await issuer.openid4vc.issuer.createIssuer({
  issuerId: 'example-mdl-issuer',
  credentialConfigurationsSupported,
})

const { credentialOffer } = await issuer.openid4vc.issuer.createCredentialOffer({
  issuerId: issuerRecord.issuerId,
  credentialConfigurationIds: ['mdl-mdoc'],
  preAuthorizedCodeFlowConfig: {},
})

const resolvedOffer = await holder.openid4vc.holder.resolveCredentialOffer(credentialOffer)
const token = await holder.openid4vc.holder.requestToken({ resolvedCredentialOffer: resolvedOffer })

const { credentials } = await holder.openid4vc.holder.requestCredentials({
  resolvedCredentialOffer: resolvedOffer,
  ...token,
  // mdoc only supports binding to a key (jwk)
  credentialBindingResolver: async ({ proofTypes }) => {
    const algorithm = proofTypes.jwt?.supportedSignatureAlgorithms[0]
    if (!algorithm) throw new Error('No supported proof of possession algorithm')

    const key = await holder.kms.createKeyForSignatureAlgorithm({ algorithm })
    return { method: 'jwk', keys: [PublicJwk.fromPublicJwk(key.publicJwk)] }
  },
})

for (const { record } of credentials) {
  if (!(record instanceof MdocRecord)) throw new Error('Expected an mdoc')

  await holder.mdoc.store({ record })
  console.log(record.firstCredential.docType, record.firstCredential.issuerSignedNamespaces)
}

const verifierRecord = await verifier.openid4vc.verifier.createVerifier({ verifierId: 'example-verifier' })

const { authorizationRequest, verificationSession } = await verifier.openid4vc.verifier.createAuthorizationRequest({
  verifierId: verifierRecord.verifierId,
  requestSigner: { method: 'none' },
  // Encrypted response (the default)
  responseMode: 'direct_post.jwt',
  dcql: {
    query: {
      credentials: [
        {
          id: 'mdl',
          format: 'mso_mdoc',
          meta: { doctype_value: 'org.iso.18013.5.1.mDL' },
          claims: [
            { path: ['org.iso.18013.5.1', 'given_name'], intent_to_retain: false },
            { path: ['org.iso.18013.5.1', 'birth_date'], intent_to_retain: false },
          ],
        },
      ],
    },
  },
})

const resolvedRequest = await holder.openid4vc.holder.resolveOpenId4VpAuthorizationRequest(authorizationRequest)
if (!resolvedRequest.dcql?.queryResult.can_be_satisfied) throw new Error('No matching mdoc')

const result = await holder.openid4vc.holder.acceptOpenId4VpAuthorizationRequest({
  authorizationRequestPayload: resolvedRequest.authorizationRequestPayload,
  dcql: { credentials: holder.openid4vc.holder.selectCredentialsForDcqlRequest(resolvedRequest.dcql.queryResult) },
})
if (!result.ok) throw new Error(`Verifier rejected the presentation: ${result.serverResponse.status}`)

const { dcql } = await verifier.openid4vc.verifier.getVerifiedAuthorizationResponse(verificationSession.id)

const [deviceResponse] = dcql?.presentations.mdl ?? []
if (deviceResponse?.claimFormat !== ClaimFormat.MsoMdoc) throw new Error('Expected an mdoc presentation')

// { 'org.iso.18013.5.1.mDL': { 'org.iso.18013.5.1': { given_name: 'Erika', birth_date: DateOnly } } }
console.log(deviceResponse.issuerClaims)

issuerServer.close()
verifierServer.close()
await issuer.shutdown()
await verifier.shutdown()
await holder.shutdown()
```

</details>

## Next steps

- [mdoc](https://credo.js.org/guides/next/credential-formats/mdoc.md): signing, presenting and verifying outside OpenID4VC.
- [Digital Credentials API](https://credo.js.org/guides/next/protocols/dc-api.md): request mdocs from a website, with OpenID4VP or ISO 18013-7 Annex C.
- [ISO mdoc](https://credo.js.org/guides/next/protocols/mdoc.md): present mdocs in person.
- [Authorization and wallet security](https://credo.js.org/guides/next/protocols/openid4vc/authorization.md): DPoP, wallet attestations and key attestations.
