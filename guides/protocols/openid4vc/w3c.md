# W3C VCs with OpenID4VC

> Issue, receive and verify W3C Verifiable Credentials over OpenID4VCI and OpenID4VP with Credo, as VCDM 1.1 JWTs or VCDM 2.0 SD-JWTs.

This page covers W3C Verifiable Credentials over OpenID4VC: which forms work, then issuance (the issuer's credential configurations and signing, and DID binding on the holder) and presentation (the verifier's DCQL query and the result). [Issuing credentials](https://credo.js.org/guides/protocols/openid4vc/issuer.md), [Receiving credentials](https://credo.js.org/guides/protocols/openid4vc/receive.md), [Presenting credentials](https://credo.js.org/guides/protocols/openid4vc/present.md) and [Verifying credentials](https://credo.js.org/guides/protocols/openid4vc/verifier.md) explain the flow itself, and [W3C Verifiable Credentials](https://credo.js.org/guides/credential-formats/w3c-vc.md) explains the formats.

Use W3C VCs only when your ecosystem requires the W3C data model. Otherwise [SD-JWT VC](https://credo.js.org/guides/protocols/openid4vc/sd-jwt-vc.md) is simpler: it binds to a key instead of a DID and is what HAIP requires.

## Supported forms

| Data model | Secured as | OpenID4VCI `format` | Issue and receive | Present with DCQL |
| --- | --- | --- | --- | --- |
| VCDM 1.1 | JWT | `jwt_vc_json` | Yes | Yes, `jwt_vc_json` |
| VCDM 2.0 | SD-JWT | `vc+sd-jwt` with `credential_definition` | Yes | Yes, `vc+sd-jwt` with `meta.type_values` |
| VCDM 1.1 | JSON-LD (Linked Data Proofs) | `ldp_vc` | Not recommended | No |
| VCDM 2.0 | JWT or Data Integrity | none | No | No |

Use `jwt_vc_json` for VCDM 1.1, or `vc+sd-jwt` for VCDM 2.0 with selective disclosure. The rest of this page uses those two. [Limitations](#limitations) explains the other rows.

## Issuance

### Configure the credentials

:::issuer

```ts
const credentialConfigurationsSupported = {
  // W3C VCDM 1.1, signed as a JWT
  'degree-jwt': {
    format: OpenId4VciCredentialFormatProfile.JwtVcJson,
    credential_definition: { type: ['VerifiableCredential', 'UniversityDegreeCredential'] },
    scope: 'degree-jwt',
    cryptographic_binding_methods_supported: ['did:key'],
    proof_types_supported: {
      jwt: { proof_signing_alg_values_supported: [KnownJwaSignatureAlgorithms.EdDSA] },
    },
  },
  // W3C VCDM 2.0, secured with SD-JWT. No `vct`, otherwise it is an SD-JWT VC.
  'degree-sd-jwt': {
    format: OpenId4VciCredentialFormatProfile.SdJwtVc,
    credential_definition: { type: ['VerifiableCredential', 'UniversityDegreeCredential'] },
    scope: 'degree-sd-jwt',
    cryptographic_binding_methods_supported: ['did:key'],
    proof_types_supported: {
      jwt: { proof_signing_alg_values_supported: [KnownJwaSignatureAlgorithms.EdDSA] },
    },
  },
} satisfies Record<string, OpenId4VciCredentialConfigurationSupportedWithFormats>
```

:::

- `credential_definition.type` lists the credential types. `vc+sd-jwt` with a `credential_definition` and no `vct` is a W3C VCDM 2.0 credential. With a `vct` it's an [SD-JWT VC](https://credo.js.org/guides/protocols/openid4vc/sd-jwt-vc.md).
- W3C credentials are bound to a DID of the holder, so list DID methods in `cryptographic_binding_methods_supported` (or `did` for any method). Credo doesn't bind W3C credentials to a bare key.

Add a `scope` if you offer the credentials through the [authorization code flow](https://credo.js.org/guides/protocols/openid4vc/authorization.md).

### Sign the credentials

The issuer signs with a DID that it created in its own agent, and the mapper puts the holder's DID in the credential:

:::issuer

```ts
const credentialRequestToCredentialMapper: OpenId4VciCredentialRequestToCredentialMapper = async ({
  credentialConfiguration,
  holderBinding,
}) => {
  // W3C credentials are bound to a DID of the holder
  if (holderBinding.bindingMethod !== 'did') throw new Error('Expected did holder binding')

  if (credentialConfiguration.format === OpenId4VciCredentialFormatProfile.JwtVcJson) {
    return {
      type: 'credentials',
      format: ClaimFormat.JwtVc,
      credentials: holderBinding.keys.map(({ didUrl }) => ({
        verificationMethod: issuerDid.verificationMethodId,
        credential: new W3cCredential({
          type: credentialConfiguration.credential_definition.type,
          issuer: new W3cIssuer({ id: issuerDid.did }),
          issuanceDate: w3cDate(Date.now()),
          credentialSubject: new W3cCredentialSubject({
            id: parseDid(didUrl).did,
            claims: { degree: 'Bachelor of Science' },
          }),
        }),
      })),
    } satisfies OpenId4VciSignW3cCredentials
  }

  // `vc+sd-jwt` with a `credential_definition` (and no `vct`) is a W3C VCDM 2.0 credential
  if (
    credentialConfiguration.format === OpenId4VciCredentialFormatProfile.SdJwtVc &&
    credentialConfiguration.credential_definition
  ) {
    return {
      type: 'credentials',
      format: ClaimFormat.SdJwtW3cVc,
      credentials: holderBinding.keys.map(({ didUrl }) => ({
        alg: KnownJwaSignatureAlgorithms.EdDSA,
        verificationMethod: issuerDid.verificationMethodId,
        holder: { method: 'did', didUrl },
        credential: new W3cV2Credential({
          type: credentialConfiguration.credential_definition.type,
          issuer: new W3cV2Issuer({ id: issuerDid.did }),
          validFrom: w3cDate(Date.now()),
          credentialSubject: new W3cV2CredentialSubject({ id: parseDid(didUrl).did, degree: 'Bachelor of Science' }),
        }),
        disclosureFrame: { credentialSubject: { _sd: ['degree'] } },
      })),
    } satisfies OpenId4VciSignW3cV2Credentials
  }

  throw new Error(`Unsupported credential configuration ${credentialConfiguration.format}`)
}
```

:::

- `issuerDid` is a DID created with `agent.dids.create`, for example `did:key`, and `verificationMethod` is the id of its signing key. W3C credentials can't be signed with an X.509 certificate. See [DIDs](https://credo.js.org/guides/dids-and-trust.md).
- `holderBinding.keys` has a `didUrl` for each holder key. Its DID becomes the credential subject.
- For VCDM 1.1 (`ClaimFormat.JwtVc`), return a `W3cCredential` and the verification method. Credo picks the JWT algorithm from the key.
- For VCDM 2.0 (`ClaimFormat.SdJwtW3cVc`), return a `W3cV2Credential`, the `alg`, the `holder` (written to `cnf`) and a `disclosureFrame`.

Don't add a `credentialStatus`: Credo can't check it, and a Credo verifier rejects VCDM 1.1 presentations of credentials that have one.

### Receive and store

The holder needs a DID it controls, and the binding resolver returns its verification method:

:::holder

```ts
const holderDid = await createDidKey(holder.dids)

const resolvedOffer = await holder.openid4vc.holder.resolveCredentialOffer(credentialOffer)
const token = await holder.openid4vc.holder.requestToken({ resolvedCredentialOffer: resolvedOffer })

const { credentials } = await holder.openid4vc.holder.requestCredentials({
  resolvedCredentialOffer: resolvedOffer,
  ...token,
  // W3C credentials can only be bound to a DID
  credentialBindingResolver: () => ({ method: 'did', didUrls: [holderDid.verificationMethodId] }),
})

for (const { record } of credentials) {
  if (record instanceof W3cCredentialRecord) await holder.w3cCredentials.store({ record })
  else if (record instanceof W3cV2CredentialRecord) await holder.w3cV2Credentials.store({ record })
  else throw new Error('Expected a W3C credential')
}
```

:::

VCDM 1.1 credentials arrive as a `W3cCredentialRecord`, which you store with `agent.w3cCredentials`. VCDM 2.0 credentials arrive as a `W3cV2CredentialRecord`, stored with `agent.w3cV2Credentials`. Credo verifies both before returning them, and accepts any DID issuer unless you configure [trusted issuers](https://credo.js.org/guides/dids-and-trust/trust.md).

## Presentation

### Request with DCQL

:::verifier

```ts
const { authorizationRequest, verificationSession } = await verifier.openid4vc.verifier.createAuthorizationRequest({
  verifierId: verifierRecord.verifierId,
  requestSigner: { method: 'none' },
  dcql: {
    query: {
      credentials: [
        {
          id: 'degree-jwt',
          format: 'jwt_vc_json',
          meta: { type_values: [['UniversityDegreeCredential']] },
        },
        {
          id: 'degree-sd-jwt',
          format: 'vc+sd-jwt',
          meta: { type_values: [['UniversityDegreeCredential']] },
          claims: [{ path: ['credentialSubject', 'degree'] }],
        },
      ],
    },
  },
})
```

:::

`meta.type_values` lists alternative sets of types. Credo compares them with the `type` values as they appear in the credential, not with expanded JSON-LD IRIs. For `jwt_vc_json`, the wallet presents the whole credential. For `vc+sd-jwt`, the `meta.type_values` make it a W3C VCDM 2.0 query, and `claims` paths point into the credential, for example `['credentialSubject', 'degree']`. The wallet discloses only those claims.

### Present

Presenting works as for other formats. The holder signs the presentation with the DID of the credential subject (VCDM 1.1) or the key in `cnf` (VCDM 2.0):

:::holder

```ts
const resolvedRequest = await holder.openid4vc.holder.resolveOpenId4VpAuthorizationRequest(authorizationRequest)
if (!resolvedRequest.dcql?.queryResult.can_be_satisfied) throw new Error('No matching credentials')

const result = await holder.openid4vc.holder.acceptOpenId4VpAuthorizationRequest({
  authorizationRequestPayload: resolvedRequest.authorizationRequestPayload,
  dcql: { credentials: holder.openid4vc.holder.selectCredentialsForDcqlRequest(resolvedRequest.dcql.queryResult) },
})
if (!result.ok) throw new Error(`Verifier rejected the presentation: ${result.serverResponse.status}`)
```

:::

### Read the presentations

:::verifier

```ts
const { dcql } = await verifier.openid4vc.verifier.getVerifiedAuthorizationResponse(verificationSession.id)

const [jwtPresentation] = dcql?.presentations['degree-jwt'] ?? []
if (jwtPresentation?.claimFormat !== ClaimFormat.JwtVp) throw new Error('Expected a JWT VP')
for (const credential of asArray(jwtPresentation.verifiableCredential)) {
  console.log(credential.type, credential.credentialSubject)
}

const [sdJwtPresentation] = dcql?.presentations['degree-sd-jwt'] ?? []
if (sdJwtPresentation?.claimFormat !== ClaimFormat.SdJwtW3cVp) throw new Error('Expected an SD-JWT VP')
for (const entry of asArray(sdJwtPresentation.resolvedPresentation.verifiableCredential)) {
  // The SD-JWT credential is enveloped in the presentation, with only the disclosed claims
  if ('resolvedCredential' in entry)
    console.log(entry.resolvedCredential.type, entry.resolvedCredential.credentialSubject)
}
```

:::

A `jwt_vc_json` query gives a `W3cJwtVerifiablePresentation`, with the credentials in `verifiableCredential`. A `vc+sd-jwt` query gives a `W3cV2SdJwtVerifiablePresentation`: the credential is enveloped in it, and `resolvedCredential` has the disclosed claims.

## Limitations

- `ldp_vc` (JSON-LD credentials with Linked Data Proofs) has known problems in this version: issuing between Credo agents needs workarounds, and presenting with DCQL fails when Credo creates the presentation.
- `jwt_vc_json-ld` is issued and stored like `jwt_vc_json`, but DCQL has no format for it.
- VCDM 2.0 credentials secured as a plain JWT (`vc+jwt`) or with Data Integrity proofs have no OpenID4VCI format.
- DIF Presentation Exchange only works with the OpenID4VP drafts, and not for VCDM 2.0 credentials.

## Full example

The issuer, holder and verifier from this page in one process:

<details>
<summary>openid4vc-w3c.ts</summary>

```ts
import {
  Agent,
  asArray,
  ClaimFormat,
  type DidsApi,
  type KeyDidCreateOptions,
  parseDid,
  W3cCredential,
  W3cCredentialRecord,
  W3cCredentialSubject,
  W3cIssuer,
  W3cV2Credential,
  W3cV2CredentialRecord,
  W3cV2CredentialSubject,
  W3cV2Issuer,
  w3cDate,
} from '@credo-ts/core'
import { KnownJwaSignatureAlgorithms } from '@credo-ts/core/kms'
import { openid4vcBundle } from '@credo-ts/drizzle-storage/openid4vc'
import { agentDependencies } from '@credo-ts/node'
import {
  type OpenId4VciCredentialConfigurationSupportedWithFormats,
  OpenId4VciCredentialFormatProfile,
  type OpenId4VciCredentialRequestToCredentialMapper,
  type OpenId4VciSignW3cCredentials,
  type OpenId4VciSignW3cV2Credentials,
  OpenId4VcModule,
} from '@credo-ts/openid4vc'
import express from 'express'
import { exampleStorage } from './example-storage.js'

const issuerUrl = 'http://localhost:4035'
const verifierUrl = 'http://localhost:4036'

// In-memory storage and keys, so the example leaves nothing behind
const issuerStorage = await exampleStorage([openid4vcBundle])
const verifierStorage = await exampleStorage([openid4vcBundle])
const holderStorage = await exampleStorage([openid4vcBundle])

async function createDidKey(dids: DidsApi) {
  const { didState } = await dids.create<KeyDidCreateOptions>({
    method: 'key',
    options: { createKey: { type: { kty: 'OKP', crv: 'Ed25519' } } },
  })
  const verificationMethod = didState.didDocument?.verificationMethod?.[0]
  if (didState.state !== 'finished' || !verificationMethod) throw new Error('Failed to create did:key')

  return { did: didState.did, verificationMethodId: verificationMethod.id }
}

const credentialConfigurationsSupported = {
  // W3C VCDM 1.1, signed as a JWT
  'degree-jwt': {
    format: OpenId4VciCredentialFormatProfile.JwtVcJson,
    credential_definition: { type: ['VerifiableCredential', 'UniversityDegreeCredential'] },
    scope: 'degree-jwt',
    cryptographic_binding_methods_supported: ['did:key'],
    proof_types_supported: {
      jwt: { proof_signing_alg_values_supported: [KnownJwaSignatureAlgorithms.EdDSA] },
    },
  },
  // W3C VCDM 2.0, secured with SD-JWT. No `vct`, otherwise it is an SD-JWT VC.
  'degree-sd-jwt': {
    format: OpenId4VciCredentialFormatProfile.SdJwtVc,
    credential_definition: { type: ['VerifiableCredential', 'UniversityDegreeCredential'] },
    scope: 'degree-sd-jwt',
    cryptographic_binding_methods_supported: ['did:key'],
    proof_types_supported: {
      jwt: { proof_signing_alg_values_supported: [KnownJwaSignatureAlgorithms.EdDSA] },
    },
  },
} satisfies Record<string, OpenId4VciCredentialConfigurationSupportedWithFormats>

// The issuer DID is created once the issuer agent is initialized (see below)
let issuerDid: { did: string; verificationMethodId: string }

const credentialRequestToCredentialMapper: OpenId4VciCredentialRequestToCredentialMapper = async ({
  credentialConfiguration,
  holderBinding,
}) => {
  // W3C credentials are bound to a DID of the holder
  if (holderBinding.bindingMethod !== 'did') throw new Error('Expected did holder binding')

  if (credentialConfiguration.format === OpenId4VciCredentialFormatProfile.JwtVcJson) {
    return {
      type: 'credentials',
      format: ClaimFormat.JwtVc,
      credentials: holderBinding.keys.map(({ didUrl }) => ({
        verificationMethod: issuerDid.verificationMethodId,
        credential: new W3cCredential({
          type: credentialConfiguration.credential_definition.type,
          issuer: new W3cIssuer({ id: issuerDid.did }),
          issuanceDate: w3cDate(Date.now()),
          credentialSubject: new W3cCredentialSubject({
            id: parseDid(didUrl).did,
            claims: { degree: 'Bachelor of Science' },
          }),
        }),
      })),
    } satisfies OpenId4VciSignW3cCredentials
  }

  // `vc+sd-jwt` with a `credential_definition` (and no `vct`) is a W3C VCDM 2.0 credential
  if (
    credentialConfiguration.format === OpenId4VciCredentialFormatProfile.SdJwtVc &&
    credentialConfiguration.credential_definition
  ) {
    return {
      type: 'credentials',
      format: ClaimFormat.SdJwtW3cVc,
      credentials: holderBinding.keys.map(({ didUrl }) => ({
        alg: KnownJwaSignatureAlgorithms.EdDSA,
        verificationMethod: issuerDid.verificationMethodId,
        holder: { method: 'did', didUrl },
        credential: new W3cV2Credential({
          type: credentialConfiguration.credential_definition.type,
          issuer: new W3cV2Issuer({ id: issuerDid.did }),
          validFrom: w3cDate(Date.now()),
          credentialSubject: new W3cV2CredentialSubject({ id: parseDid(didUrl).did, degree: 'Bachelor of Science' }),
        }),
        disclosureFrame: { credentialSubject: { _sd: ['degree'] } },
      })),
    } satisfies OpenId4VciSignW3cV2Credentials
  }

  throw new Error(`Unsupported credential configuration ${credentialConfiguration.format}`)
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
const issuerServer = issuerApp.listen(4035)
const verifierServer = verifierApp.listen(4036)

issuerDid = await createDidKey(issuer.dids)

const issuerRecord = await issuer.openid4vc.issuer.createIssuer({
  issuerId: 'example-w3c-issuer',
  credentialConfigurationsSupported,
})

const { credentialOffer } = await issuer.openid4vc.issuer.createCredentialOffer({
  issuerId: issuerRecord.issuerId,
  credentialConfigurationIds: ['degree-jwt', 'degree-sd-jwt'],
  preAuthorizedCodeFlowConfig: {},
})

const holderDid = await createDidKey(holder.dids)

const resolvedOffer = await holder.openid4vc.holder.resolveCredentialOffer(credentialOffer)
const token = await holder.openid4vc.holder.requestToken({ resolvedCredentialOffer: resolvedOffer })

const { credentials } = await holder.openid4vc.holder.requestCredentials({
  resolvedCredentialOffer: resolvedOffer,
  ...token,
  // W3C credentials can only be bound to a DID
  credentialBindingResolver: () => ({ method: 'did', didUrls: [holderDid.verificationMethodId] }),
})

for (const { record } of credentials) {
  if (record instanceof W3cCredentialRecord) await holder.w3cCredentials.store({ record })
  else if (record instanceof W3cV2CredentialRecord) await holder.w3cV2Credentials.store({ record })
  else throw new Error('Expected a W3C credential')
}

const verifierRecord = await verifier.openid4vc.verifier.createVerifier({ verifierId: 'example-verifier' })

const { authorizationRequest, verificationSession } = await verifier.openid4vc.verifier.createAuthorizationRequest({
  verifierId: verifierRecord.verifierId,
  requestSigner: { method: 'none' },
  dcql: {
    query: {
      credentials: [
        {
          id: 'degree-jwt',
          format: 'jwt_vc_json',
          meta: { type_values: [['UniversityDegreeCredential']] },
        },
        {
          id: 'degree-sd-jwt',
          format: 'vc+sd-jwt',
          meta: { type_values: [['UniversityDegreeCredential']] },
          claims: [{ path: ['credentialSubject', 'degree'] }],
        },
      ],
    },
  },
})

const resolvedRequest = await holder.openid4vc.holder.resolveOpenId4VpAuthorizationRequest(authorizationRequest)
if (!resolvedRequest.dcql?.queryResult.can_be_satisfied) throw new Error('No matching credentials')

const result = await holder.openid4vc.holder.acceptOpenId4VpAuthorizationRequest({
  authorizationRequestPayload: resolvedRequest.authorizationRequestPayload,
  dcql: { credentials: holder.openid4vc.holder.selectCredentialsForDcqlRequest(resolvedRequest.dcql.queryResult) },
})
if (!result.ok) throw new Error(`Verifier rejected the presentation: ${result.serverResponse.status}`)

const { dcql } = await verifier.openid4vc.verifier.getVerifiedAuthorizationResponse(verificationSession.id)

const [jwtPresentation] = dcql?.presentations['degree-jwt'] ?? []
if (jwtPresentation?.claimFormat !== ClaimFormat.JwtVp) throw new Error('Expected a JWT VP')
for (const credential of asArray(jwtPresentation.verifiableCredential)) {
  console.log(credential.type, credential.credentialSubject)
}

const [sdJwtPresentation] = dcql?.presentations['degree-sd-jwt'] ?? []
if (sdJwtPresentation?.claimFormat !== ClaimFormat.SdJwtW3cVp) throw new Error('Expected an SD-JWT VP')
for (const entry of asArray(sdJwtPresentation.resolvedPresentation.verifiableCredential)) {
  // The SD-JWT credential is enveloped in the presentation, with only the disclosed claims
  if ('resolvedCredential' in entry)
    console.log(entry.resolvedCredential.type, entry.resolvedCredential.credentialSubject)
}

issuerServer.close()
verifierServer.close()
await issuer.shutdown()
await verifier.shutdown()
await holder.shutdown()
```

</details>

## Next steps

- [W3C Verifiable Credentials](https://credo.js.org/guides/credential-formats/w3c-vc.md): signing, presenting and verifying outside OpenID4VC.
- [W3C VCs with DIDComm](https://credo.js.org/guides/protocols/didcomm/w3c.md): exchange W3C credentials over DIDComm.
- [DIDs](https://credo.js.org/guides/dids-and-trust.md): create the DIDs for issuers and holders.
