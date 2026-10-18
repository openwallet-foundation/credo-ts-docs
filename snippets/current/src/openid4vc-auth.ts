import { Agent, ClaimFormat, SdJwtVcRecord, type X509Certificate } from '@credo-ts/core'
import { KnownJwaSignatureAlgorithms, PublicJwk } from '@credo-ts/core/kms'
import { openid4vcBundle } from '@credo-ts/drizzle-storage/openid4vc'
import { agentDependencies } from '@credo-ts/node'
import {
  getScopesFromCredentialConfigurationsSupported,
  OpenId4VciAuthorizationFlow,
  OpenId4VciCredentialFormatProfile,
  type OpenId4VciCredentialRequestToCredentialMapper,
  type OpenId4VciGetVerificationSession,
  type OpenId4VciSignSdJwtCredentials,
  OpenId4VcModule,
  OpenId4VcVerifierApi,
} from '@credo-ts/openid4vc'
import express from 'express'
import { exampleStorage } from './example-storage.js'

const issuerUrl = 'http://localhost:4030'

// In-memory storage and keys, so the example leaves nothing behind
const issuerStorage = await exampleStorage([openid4vcBundle])
const holderStorage = await exampleStorage([openid4vcBundle])

// Created once the issuer agent is initialized (see below)
let issuerCertificate: X509Certificate

// start-section-2
const getVerificationSession: OpenId4VciGetVerificationSession = async ({ agentContext, issuanceSession, scopes }) => {
  if (!scopes.includes('diploma')) throw new Error(`Unsupported scopes ${scopes.join(', ')}`)

  // Resolve the verifier from the agent context, so this also works for tenants
  const verifier = agentContext.resolve(OpenId4VcVerifierApi)
  const authorizationRequest = await verifier.createAuthorizationRequest({
    // A verifier with the same id as the issuer (created next to the issuer)
    verifierId: issuanceSession.issuerId,
    requestSigner: { method: 'x5c', x5c: [issuerCertificate] },
    dcql: {
      query: {
        credentials: [
          {
            id: 'pid',
            format: 'dc+sd-jwt',
            meta: { vct_values: ['urn:example:pid:1'] },
            claims: [{ path: ['given_name'] }, { path: ['family_name'] }],
          },
        ],
      },
    },
  })

  // The scopes that are granted once the presentation is verified
  return { ...authorizationRequest, scopes: ['diploma'] }
}
// end-section-2

// start-section-3
const credentialRequestToCredentialMapper: OpenId4VciCredentialRequestToCredentialMapper = async ({
  credentialConfiguration,
  holderBinding,
  verification,
}) => {
  if (credentialConfiguration.format !== OpenId4VciCredentialFormatProfile.SdJwtDc) {
    throw new Error(`Unsupported credential format ${credentialConfiguration.format}`)
  }
  if (holderBinding.bindingMethod !== 'jwk') throw new Error('Expected jwk holder binding')

  // The verified presentation from the authorization step
  const [pid] = verification?.dcql?.presentations.pid ?? []
  if (pid?.claimFormat !== ClaimFormat.SdJwtDc) throw new Error('Expected a verified PID presentation')

  return {
    type: 'credentials',
    format: ClaimFormat.SdJwtDc,
    credentials: holderBinding.keys.map((holder) => ({
      holder,
      issuer: { method: 'x5c', x5c: [issuerCertificate], issuer: issuerUrl },
      payload: {
        vct: credentialConfiguration.vct,
        name: `${pid.prettyClaims.given_name} ${pid.prettyClaims.family_name}`,
        degree: 'Bachelor of Science',
      },
      disclosureFrame: { _sd: ['name', 'degree'] },
    })),
  } satisfies OpenId4VciSignSdJwtCredentials
}
// end-section-3

const app = express()
// start-section-1
const issuer = new Agent({
  config: { allowInsecureHttpUrls: true },
  dependencies: agentDependencies,
  modules: {
    ...issuerStorage, // Storage and key management, see Agent setup
    openid4vc: new OpenId4VcModule({
      app,
      issuer: {
        baseUrl: `${issuerUrl}/oid4vci`,
        credentialRequestToCredentialMapper,
        // Creates the OpenID4VP request for presentation during issuance
        getVerificationSession,
        // Require DPoP for all issuance sessions. PKCE is required by default.
        dpopRequired: true,
      },
      // Presentation during issuance uses the verifier of the same agent
      verifier: { baseUrl: `${issuerUrl}/oid4vp` },
    }),
  },
})
// end-section-1

const holder = new Agent({
  config: { allowInsecureHttpUrls: true },
  dependencies: agentDependencies,
  modules: {
    ...holderStorage,
    openid4vc: new OpenId4VcModule(),
  },
})

await issuer.initialize()
await holder.initialize()
const server = app.listen(4030)

// Self-signed certificate for the example. The SAN must match the host of `issuerUrl`.
issuerCertificate = await issuer.x509.createCertificate({
  authorityKey: PublicJwk.fromPublicJwk((await issuer.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })).publicJwk),
  issuer: { commonName: 'Credo example issuer', countryName: 'NL' },
  extensions: { subjectAlternativeName: { name: [{ type: 'dns', value: 'localhost' }] } },
})
issuer.x509.config.addTrustedCertificate(issuerCertificate)
holder.x509.config.addTrustedCertificate(issuerCertificate)

// The holder already has a PID, which it presents to get the diploma
const pidKey = await holder.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
const pid = await issuer.sdJwtVc.sign({
  issuer: { method: 'x5c', x5c: [issuerCertificate], issuer: issuerUrl },
  holder: { method: 'jwk', jwk: PublicJwk.fromPublicJwk(pidKey.publicJwk) },
  payload: { vct: 'urn:example:pid:1', given_name: 'Erika', family_name: 'Mustermann' },
  disclosureFrame: { _sd: ['given_name', 'family_name'] },
})
await holder.sdJwtVc.store({
  record: new SdJwtVcRecord({ credentialInstances: [{ compactSdJwtVc: pid.compact, kmsKeyId: pidKey.keyId }] }),
})

// start-section-4
const issuerRecord = await issuer.openid4vc.issuer.createIssuer({
  issuerId: 'example-issuer',
  // Advertise DPoP support in the authorization server metadata
  dpopSigningAlgValuesSupported: [KnownJwaSignatureAlgorithms.ES256],
  credentialConfigurationsSupported: {
    diploma: {
      format: OpenId4VciCredentialFormatProfile.SdJwtDc,
      vct: 'urn:example:diploma:1',
      // Required for the authorization code flow
      scope: 'diploma',
      cryptographic_binding_methods_supported: ['jwk'],
      proof_types_supported: {
        jwt: { proof_signing_alg_values_supported: [KnownJwaSignatureAlgorithms.ES256] },
      },
    },
  },
})
await issuer.openid4vc.verifier.createVerifier({ verifierId: issuerRecord.issuerId })

const { credentialOffer } = await issuer.openid4vc.issuer.createCredentialOffer({
  issuerId: issuerRecord.issuerId,
  credentialConfigurationIds: ['diploma'],
  authorizationCodeFlowConfig: { requirePresentationDuringIssuance: true },
})
// end-section-4

// start-section-5
const clientId = 'example-wallet'
const redirectUri = 'https://wallet.example.com/redirect'

const resolvedOffer = await holder.openid4vc.holder.resolveCredentialOffer(credentialOffer)
const authorization = await holder.openid4vc.holder.resolveOpenId4VciAuthorizationRequest(resolvedOffer, {
  clientId,
  redirectUri,
  scope: getScopesFromCredentialConfigurationsSupported(resolvedOffer.offeredCredentialConfigurations),
})
if (authorization.authorizationFlow !== OpenId4VciAuthorizationFlow.PresentationDuringIssuance) {
  throw new Error('Expected presentation during issuance')
}

// Present the PID with OpenID4VP
const presentationRequest = await holder.openid4vc.holder.resolveOpenId4VpAuthorizationRequest(
  authorization.openid4vpRequestUrl
)
if (!presentationRequest.dcql?.queryResult.can_be_satisfied) throw new Error('No matching credentials')
const presentation = await holder.openid4vc.holder.acceptOpenId4VpAuthorizationRequest({
  authorizationRequestPayload: presentationRequest.authorizationRequestPayload,
  dcql: { credentials: holder.openid4vc.holder.selectCredentialsForDcqlRequest(presentationRequest.dcql.queryResult) },
})
if (!presentation.ok) throw new Error('Presentation was rejected')

// Exchange the presentation for an authorization code
const { authorizationCode, dpop } = await holder.openid4vc.holder.retrieveAuthorizationCodeUsingPresentation({
  resolvedCredentialOffer: resolvedOffer,
  authSession: authorization.authSession,
  presentationDuringIssuanceSession: presentation.presentationDuringIssuanceSession,
  dpop: authorization.dpop,
})

const token = await holder.openid4vc.holder.requestToken({
  resolvedCredentialOffer: resolvedOffer,
  code: authorizationCode,
  clientId,
  redirectUri,
  // PKCE: proves this is the client that started the authorization
  codeVerifier: authorization.codeVerifier,
  // Keep using the same DPoP key
  dpop,
})

const { credentials } = await holder.openid4vc.holder.requestCredentials({
  resolvedCredentialOffer: resolvedOffer,
  ...token,
  clientId,
  credentialBindingResolver: async () => {
    const key = await holder.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
    return { method: 'jwk', keys: [PublicJwk.fromPublicJwk(key.publicJwk)] }
  },
})
// end-section-5

for (const { record } of credentials) {
  if (!(record instanceof SdJwtVcRecord)) throw new Error('Expected an SD-JWT VC')
  await holder.sdJwtVc.store({ record })
  console.log('Received diploma', record.firstCredential.prettyClaims.name, 'with DPoP', token.dpop !== undefined)
}

server.close()
await issuer.shutdown()
await holder.shutdown()
