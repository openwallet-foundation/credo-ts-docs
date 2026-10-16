import { AskarModule } from '@credo-ts/askar'
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
import { agentDependencies } from '@credo-ts/node'
import {
  type OpenId4VciCredentialConfigurationSupportedWithFormats,
  OpenId4VciCredentialFormatProfile,
  type OpenId4VciCredentialRequestToCredentialMapper,
  type OpenId4VciSignW3cCredentials,
  type OpenId4VciSignW3cV2Credentials,
  OpenId4VcModule,
} from '@credo-ts/openid4vc'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import express from 'express'

const issuerUrl = 'http://localhost:4035'
const verifierUrl = 'http://localhost:4036'

function askar(id: string) {
  return new AskarModule({
    askar: NativeAskar,
    // In-memory storage, so the example leaves nothing behind
    store: { id, key: `${id}-key`, database: { type: 'sqlite', config: { inMemory: true } } },
  })
}

async function createDidKey(dids: DidsApi) {
  const { didState } = await dids.create<KeyDidCreateOptions>({
    method: 'key',
    options: { createKey: { type: { kty: 'OKP', crv: 'Ed25519' } } },
  })
  const verificationMethod = didState.didDocument?.verificationMethod?.[0]
  if (didState.state !== 'finished' || !verificationMethod) throw new Error('Failed to create did:key')

  return { did: didState.did, verificationMethodId: verificationMethod.id }
}

// start-section-1
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
// end-section-1

// The issuer DID is created once the issuer agent is initialized (see below)
let issuerDid: { did: string; verificationMethodId: string }

// start-section-2
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
// end-section-2

const issuerApp = express()
const issuer = new Agent({
  config: { allowInsecureHttpUrls: true },
  dependencies: agentDependencies,
  modules: {
    askar: askar('w3c-issuer'),
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
    askar: askar('w3c-verifier'),
    openid4vc: new OpenId4VcModule({ app: verifierApp, verifier: { baseUrl: `${verifierUrl}/oid4vp` } }),
  },
})

const holder = new Agent({
  config: { allowInsecureHttpUrls: true },
  dependencies: agentDependencies,
  modules: {
    askar: askar('w3c-holder'),
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

// start-section-3
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
// end-section-3

const verifierRecord = await verifier.openid4vc.verifier.createVerifier({ verifierId: 'example-verifier' })

// start-section-4
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
// end-section-4

// start-section-5
const resolvedRequest = await holder.openid4vc.holder.resolveOpenId4VpAuthorizationRequest(authorizationRequest)
if (!resolvedRequest.dcql?.queryResult.can_be_satisfied) throw new Error('No matching credentials')

const result = await holder.openid4vc.holder.acceptOpenId4VpAuthorizationRequest({
  authorizationRequestPayload: resolvedRequest.authorizationRequestPayload,
  dcql: { credentials: holder.openid4vc.holder.selectCredentialsForDcqlRequest(resolvedRequest.dcql.queryResult) },
})
if (!result.ok) throw new Error(`Verifier rejected the presentation: ${result.serverResponse.status}`)
// end-section-5

// start-section-6
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
// end-section-6

issuerServer.close()
verifierServer.close()
await issuer.shutdown()
await verifier.shutdown()
await holder.shutdown()
