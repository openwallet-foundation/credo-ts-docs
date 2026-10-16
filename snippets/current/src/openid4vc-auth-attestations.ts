import { AskarModule } from '@credo-ts/askar'
import {
  Agent,
  ClaimFormat,
  type GetTrustedIssuersForVerification,
  JwsService,
  JwtPayload,
  MdocRecord,
  type VerificationSigner,
  type X509Certificate,
} from '@credo-ts/core'
import { KnownJwaSignatureAlgorithms, PublicJwk } from '@credo-ts/core/kms'
import { agentDependencies } from '@credo-ts/node'
import {
  OpenId4VciCredentialFormatProfile,
  type OpenId4VciCredentialRequestToCredentialMapper,
  OpenId4VciKeyAttestationLevel,
  type OpenId4VciSignMdocCredentials,
  OpenId4VcModule,
  type OpenId4VcVerificationTypes,
} from '@credo-ts/openid4vc'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import express from 'express'

const issuerUrl = 'http://localhost:4039'

function askar(id: string) {
  return new AskarModule({
    askar: NativeAskar,
    // In-memory storage, so the example leaves nothing behind
    store: { id, key: `${id}-key`, database: { type: 'sqlite', config: { inMemory: true } } },
  })
}

// Created once the agents are initialized (see below)
let issuerCertificate: X509Certificate
let walletProviderCertificate: X509Certificate

// start-section-1
// Trust the wallet provider for wallet attestations and key attestations
const getTrustedIssuersForVerification: GetTrustedIssuersForVerification<
  VerificationSigner,
  OpenId4VcVerificationTypes
> = async (_agentContext, { verification }) => {
  if (verification.type === 'oauth2ClientAttestation' || verification.type === 'openId4VciKeyAttestation') {
    return { trustedIssuers: [{ method: 'x509', issuance: [walletProviderCertificate.toString('pem')] }] }
  }

  // Use the other trust configuration for everything else
  return undefined
}
// end-section-1

// start-section-3
const credentialRequestToCredentialMapper: OpenId4VciCredentialRequestToCredentialMapper = async ({
  credentialConfiguration,
  holderBinding,
}) => {
  if (credentialConfiguration.format !== OpenId4VciCredentialFormatProfile.MsoMdoc) {
    throw new Error(`Unsupported credential format ${credentialConfiguration.format}`)
  }
  if (holderBinding.bindingMethod !== 'jwk') throw new Error('Expected jwk holder binding')

  // Credo verified the key attestation, its trust and the required levels
  console.log('Attested key storage', holderBinding.keyAttestation?.payload.key_storage)

  return {
    type: 'credentials',
    format: ClaimFormat.MsoMdoc,
    // One credential per attested key
    credentials: holderBinding.keys.map(({ jwk }) => ({
      docType: credentialConfiguration.doctype,
      holderKey: jwk,
      issuerCertificate,
      validityInfo: { validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
      namespaces: { 'org.example.membership.1': { member_id: 'M-1234', issuing_country: 'NL' } },
    })),
  } satisfies OpenId4VciSignMdocCredentials
}
// end-section-3

const app = express()
const issuer = new Agent({
  // start-section-2
  config: { allowInsecureHttpUrls: true, getTrustedIssuersForVerification },
  dependencies: agentDependencies,
  modules: {
    askar: askar('attestations-issuer'),
    openid4vc: new OpenId4VcModule({
      app,
      issuer: {
        baseUrl: `${issuerUrl}/oid4vci`,
        credentialRequestToCredentialMapper,
        // Every issuance session requires a wallet attestation
        walletAttestationsRequired: true,
      },
    }),
  },
  // end-section-2
})

const holder = new Agent({
  config: { allowInsecureHttpUrls: true },
  dependencies: agentDependencies,
  modules: {
    askar: askar('attestations-holder'),
    openid4vc: new OpenId4VcModule(),
  },
})

await issuer.initialize()
await holder.initialize()
const server = app.listen(4039)

issuerCertificate = await issuer.x509.createCertificate({
  authorityKey: PublicJwk.fromPublicJwk((await issuer.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })).publicJwk),
  issuer: { commonName: 'Credo example issuer', countryName: 'NL' },
})
holder.x509.config.addTrustedCertificate(issuerCertificate)

// Stand-in for the wallet provider's backend, which attests genuine wallet instances and their keys.
// It is not part of Credo. The key lives in the holder agent to keep the example short.
walletProviderCertificate = await holder.x509.createCertificate({
  authorityKey: PublicJwk.fromPublicJwk((await holder.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })).publicJwk),
  issuer: { commonName: 'Example wallet provider', countryName: 'NL' },
})
function signByWalletProvider(typ: string, payload: Record<string, unknown>) {
  return holder.context.resolve(JwsService).createJwsCompact(holder.context, {
    keyId: walletProviderCertificate.publicJwk.keyId,
    payload: JwtPayload.fromJson({
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300,
      ...payload,
    }),
    protectedHeaderOptions: {
      alg: KnownJwaSignatureAlgorithms.ES256,
      typ,
      x5c: [walletProviderCertificate.toString('base64')],
    },
  })
}

const clientId = 'example-wallet'
const walletInstanceKey = await holder.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
const walletAttestationJwt = await signByWalletProvider('oauth-client-attestation+jwt', {
  iss: 'https://wallet-provider.example.com',
  sub: clientId,
  cnf: { jwk: PublicJwk.fromPublicJwk(walletInstanceKey.publicJwk).toJson() },
  wallet_name: 'Example wallet',
})

const attestedKeys = await Promise.all(
  [1, 2].map(async () =>
    PublicJwk.fromPublicJwk((await holder.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })).publicJwk)
  )
)
const keyAttestationJwt = await signByWalletProvider('key-attestation+jwt', {
  attested_keys: attestedKeys.map((key) => key.toJson()),
  key_storage: [OpenId4VciKeyAttestationLevel.High],
  user_authentication: [OpenId4VciKeyAttestationLevel.High],
})

// start-section-4
const issuerRecord = await issuer.openid4vc.issuer.createIssuer({
  issuerId: 'example-issuer',
  // Advertise attestation based client authentication
  clientAttestationSigningAlgValuesSupported: [KnownJwaSignatureAlgorithms.ES256],
  clientAttestationPopSigningAlgValuesSupported: [KnownJwaSignatureAlgorithms.ES256],
  batchCredentialIssuance: { batchSize: 2 },
  credentialConfigurationsSupported: {
    membership: {
      format: OpenId4VciCredentialFormatProfile.MsoMdoc,
      doctype: 'org.example.membership.1',
      cryptographic_binding_methods_supported: ['cose_key'],
      proof_types_supported: {
        jwt: {
          proof_signing_alg_values_supported: [KnownJwaSignatureAlgorithms.ES256],
          // The holder keys must be attested at this level
          key_attestations_required: {
            key_storage: [OpenId4VciKeyAttestationLevel.High],
            user_authentication: [OpenId4VciKeyAttestationLevel.High],
          },
        },
      },
    },
  },
})
// end-section-4

const { credentialOffer } = await issuer.openid4vc.issuer.createCredentialOffer({
  issuerId: issuerRecord.issuerId,
  credentialConfigurationIds: ['membership'],
  preAuthorizedCodeFlowConfig: {},
})

// start-section-5
const resolvedOffer = await holder.openid4vc.holder.resolveCredentialOffer(credentialOffer)

// Credo signs the attestation proof of possession with the key in the attestation's `cnf`
const token = await holder.openid4vc.holder.requestToken({
  resolvedCredentialOffer: resolvedOffer,
  walletAttestationJwt,
})

const { credentials } = await holder.openid4vc.holder.requestCredentials({
  resolvedCredentialOffer: resolvedOffer,
  ...token,
  clientId,
  credentialBindingResolver: ({ proofTypes }) => {
    if (!proofTypes.jwt?.keyAttestationsRequired) throw new Error('Expected key attestations to be required')

    // Without a nonce, Credo sends a jwt proof signed with the first attested key
    return { method: 'attestation', keyAttestationJwt }
  },
})
// end-section-5

for (const { record } of credentials) {
  if (!(record instanceof MdocRecord)) throw new Error('Expected an mdoc')
  await holder.mdoc.store({ record })
  console.log('Received', record.credentialInstances.length, 'mdoc instances')
}

server.close()
await issuer.shutdown()
await holder.shutdown()
