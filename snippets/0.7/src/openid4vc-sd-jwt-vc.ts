import { AskarModule } from '@credo-ts/askar'
import { Agent, ClaimFormat, SdJwtVcRecord, type X509Certificate } from '@credo-ts/core'
import { KnownJwaSignatureAlgorithms, PublicJwk } from '@credo-ts/core/kms'
import { agentDependencies } from '@credo-ts/node'
import {
  type OpenId4VciCredentialConfigurationSupportedWithFormats,
  OpenId4VciCredentialFormatProfile,
  type OpenId4VciCredentialRequestToCredentialMapper,
  type OpenId4VciSignSdJwtCredentials,
  OpenId4VcModule,
} from '@credo-ts/openid4vc'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import express from 'express'

const issuerUrl = 'http://localhost:4031'
const verifierUrl = 'http://localhost:4032'

function askar(id: string) {
  return new AskarModule({
    askar: NativeAskar,
    // In-memory storage, so the example leaves nothing behind
    store: { id, key: `${id}-key`, database: { type: 'sqlite', config: { inMemory: true } } },
  })
}

// start-section-1
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
// end-section-1

// The issuer certificate is created once the issuer agent is initialized (see below)
let issuerCertificate: X509Certificate

// start-section-2
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
// end-section-2

const issuerApp = express()
const issuer = new Agent({
  config: { allowInsecureHttpUrls: true },
  dependencies: agentDependencies,
  modules: {
    askar: askar('sd-jwt-vc-issuer'),
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
    askar: askar('sd-jwt-vc-verifier'),
    openid4vc: new OpenId4VcModule({ app: verifierApp, verifier: { baseUrl: `${verifierUrl}/oid4vp` } }),
  },
})

const holder = new Agent({
  config: { allowInsecureHttpUrls: true },
  dependencies: agentDependencies,
  modules: {
    askar: askar('sd-jwt-vc-holder'),
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

// start-section-3
// Both the holder and the verifier only accept credentials from issuers they trust
holder.x509.config.addTrustedCertificate(issuerCertificate)
verifier.x509.config.addTrustedCertificate(issuerCertificate)
// end-section-3

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

// start-section-4
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
// end-section-4

const verifierRecord = await verifier.openid4vc.verifier.createVerifier({
  verifierId: 'example-verifier',
  clientMetadata: { client_name: 'Credo example verifier' },
})

// start-section-5
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
// end-section-5

// start-section-6
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
// end-section-6

// start-section-7
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
// end-section-7

issuerServer.close()
verifierServer.close()
await issuer.shutdown()
await verifier.shutdown()
await holder.shutdown()
