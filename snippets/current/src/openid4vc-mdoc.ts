import { AskarModule } from '@credo-ts/askar'
import { Agent, ClaimFormat, DateOnly, MdocRecord, type X509Certificate } from '@credo-ts/core'
import { KnownJwaSignatureAlgorithms, PublicJwk } from '@credo-ts/core/kms'
import { agentDependencies } from '@credo-ts/node'
import {
  type OpenId4VciCredentialConfigurationSupportedWithFormats,
  OpenId4VciCredentialFormatProfile,
  type OpenId4VciCredentialRequestToCredentialMapper,
  type OpenId4VciSignMdocCredentials,
  OpenId4VcModule,
} from '@credo-ts/openid4vc'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import express from 'express'

const issuerUrl = 'http://localhost:4033'
const verifierUrl = 'http://localhost:4034'

function askar(id: string) {
  return new AskarModule({
    askar: NativeAskar,
    // In-memory storage, so the example leaves nothing behind
    store: { id, key: `${id}-key`, database: { type: 'sqlite', config: { inMemory: true } } },
  })
}

// start-section-1
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
// end-section-1

// The issuer certificate is created once the issuer agent is initialized (see below)
let issuerCertificate: X509Certificate

// start-section-2
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
// end-section-2

const issuerApp = express()
const issuer = new Agent({
  config: { allowInsecureHttpUrls: true },
  dependencies: agentDependencies,
  modules: {
    askar: askar('mdoc-issuer'),
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
    askar: askar('mdoc-verifier'),
    openid4vc: new OpenId4VcModule({ app: verifierApp, verifier: { baseUrl: `${verifierUrl}/oid4vp` } }),
  },
})

const holder = new Agent({
  config: { allowInsecureHttpUrls: true },
  dependencies: agentDependencies,
  modules: {
    askar: askar('mdoc-holder'),
    openid4vc: new OpenId4VcModule(),
  },
})

await issuer.initialize()
await verifier.initialize()
await holder.initialize()
const issuerServer = issuerApp.listen(4033)
const verifierServer = verifierApp.listen(4034)

// start-section-3
// Self-signed for the example. In production this is a document signer certificate issued by your IACA.
issuerCertificate = await issuer.x509.createCertificate({
  authorityKey: PublicJwk.fromPublicJwk((await issuer.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })).publicJwk),
  // mdoc verification requires a country (C) in the issuer certificate
  issuer: { commonName: 'Credo example mDL issuer', countryName: 'NL' },
})
// end-section-3

// start-section-4
// The holder verifies the mdoc when receiving it, and the verifier when it is presented
holder.x509.config.addTrustedCertificate(issuerCertificate)
verifier.x509.config.addTrustedCertificate(issuerCertificate)
// end-section-4

const issuerRecord = await issuer.openid4vc.issuer.createIssuer({
  issuerId: 'example-mdl-issuer',
  credentialConfigurationsSupported,
})

const { credentialOffer } = await issuer.openid4vc.issuer.createCredentialOffer({
  issuerId: issuerRecord.issuerId,
  credentialConfigurationIds: ['mdl-mdoc'],
  preAuthorizedCodeFlowConfig: {},
})

// start-section-5
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
// end-section-5

const verifierRecord = await verifier.openid4vc.verifier.createVerifier({ verifierId: 'example-verifier' })

// start-section-6
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
// end-section-6

// start-section-7
const resolvedRequest = await holder.openid4vc.holder.resolveOpenId4VpAuthorizationRequest(authorizationRequest)
if (!resolvedRequest.dcql?.queryResult.can_be_satisfied) throw new Error('No matching mdoc')

const result = await holder.openid4vc.holder.acceptOpenId4VpAuthorizationRequest({
  authorizationRequestPayload: resolvedRequest.authorizationRequestPayload,
  dcql: { credentials: holder.openid4vc.holder.selectCredentialsForDcqlRequest(resolvedRequest.dcql.queryResult) },
})
if (!result.ok) throw new Error(`Verifier rejected the presentation: ${result.serverResponse.status}`)
// end-section-7

// start-section-8
const { dcql } = await verifier.openid4vc.verifier.getVerifiedAuthorizationResponse(verificationSession.id)

const [deviceResponse] = dcql?.presentations.mdl ?? []
if (deviceResponse?.claimFormat !== ClaimFormat.MsoMdoc) throw new Error('Expected an mdoc presentation')

// { 'org.iso.18013.5.1.mDL': { 'org.iso.18013.5.1': { given_name: 'Erika', birth_date: DateOnly } } }
console.log(deviceResponse.issuerClaims)
// end-section-8

issuerServer.close()
verifierServer.close()
await issuer.shutdown()
await verifier.shutdown()
await holder.shutdown()
