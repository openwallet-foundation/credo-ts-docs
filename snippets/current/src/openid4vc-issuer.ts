import { openid4vcBundle } from '@credo-ts/drizzle-storage/openid4vc'
import { exampleStorage } from './example-storage.js'

const storage = await exampleStorage([openid4vcBundle])

// start-section-1
import { Agent, ClaimFormat, Kms, type SdJwtVcSignOptions } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import {
  OpenId4VcIssuanceSessionState,
  type OpenId4VcIssuanceSessionStateChangedEvent,
  OpenId4VcIssuerEvents,
  OpenId4VciCredentialFormatProfile,
  type OpenId4VciCredentialRequestToCredentialMapperOptions,
  type OpenId4VciSignSdJwtCredentials,
  OpenId4VcModule,
} from '@credo-ts/openid4vc'
import express from 'express'

const issuerPort = 4020
const app = express()

export const issuer = new Agent({
  config: {
    // Allows the http://localhost URLs of this example. Never enable this in production.
    allowInsecureHttpUrls: true,
  },
  dependencies: agentDependencies,
  modules: {
    ...storage, // Storage and key management, see Agent setup
    openid4vc: new OpenId4VcModule({
      app,
      issuer: {
        baseUrl: `http://localhost:${issuerPort}/oid4vci`,
        credentialRequestToCredentialMapper,
      },
    }),
  },
})

await issuer.initialize()
export const issuerServer = app.listen(issuerPort)
// end-section-1

// start-section-2
const issuerKey = await issuer.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })

// Self-signed for this example. In production, a CA issues the certificate for your key.
export const issuerCertificate = await issuer.x509.createCertificate({
  authorityKey: Kms.PublicJwk.fromPublicJwk(issuerKey.publicJwk),
  issuer: { commonName: 'Example Corp', countryName: 'NL' },
})
// end-section-2

// start-section-3
const issuerRecord = await issuer.openid4vc.issuer.createIssuer({
  display: [{ name: 'Example Corp', locale: 'en' }],
  credentialConfigurationsSupported: {
    'employee-badge': {
      format: OpenId4VciCredentialFormatProfile.SdJwtDc,
      vct: 'urn:example:employee-badge:1',
      cryptographic_binding_methods_supported: ['jwk'],
      credential_signing_alg_values_supported: [Kms.KnownJwaSignatureAlgorithms.ES256],
      proof_types_supported: {
        jwt: { proof_signing_alg_values_supported: [Kms.KnownJwaSignatureAlgorithms.ES256] },
      },
      credential_metadata: {
        display: [{ name: 'Employee badge', locale: 'en', background_color: '#12107c', text_color: '#ffffff' }],
        claims: [
          { path: ['given_name'], display: [{ name: 'Given name', locale: 'en' }] },
          { path: ['family_name'], display: [{ name: 'Family name', locale: 'en' }] },
          { path: ['department'], display: [{ name: 'Department', locale: 'en' }] },
        ],
      },
    },
  },
})
// end-section-3

// start-section-4
// Stands in for your own user database
const employees = new Map([['employee-123', { given_name: 'Jane', family_name: 'Doe', department: 'Engineering' }]])

async function credentialRequestToCredentialMapper({
  credentialConfiguration,
  holderBinding,
  issuanceSession,
}: OpenId4VciCredentialRequestToCredentialMapperOptions): Promise<OpenId4VciSignSdJwtCredentials> {
  if (credentialConfiguration.format !== OpenId4VciCredentialFormatProfile.SdJwtDc) {
    throw new Error(`Unsupported credential format '${credentialConfiguration.format}'`)
  }

  // Set as issuanceMetadata when creating the offer
  const employeeId = issuanceSession.issuanceMetadata?.employeeId
  const employee = typeof employeeId === 'string' ? employees.get(employeeId) : undefined
  if (!employee) throw new Error('Unknown employee')

  return {
    type: 'credentials',
    format: ClaimFormat.SdJwtDc,
    // One credential per key the wallet wants the credential bound to
    credentials: holderBinding.keys.map(
      (holder): SdJwtVcSignOptions => ({
        payload: { vct: credentialConfiguration.vct, ...employee },
        holder,
        issuer: { method: 'x5c', x5c: [issuerCertificate] },
        disclosureFrame: { _sd: ['given_name', 'family_name', 'department'] },
      })
    ),
  }
}
// end-section-4

// start-section-5
export async function createEmployeeBadgeOffer(employeeId: string) {
  const { credentialOffer, issuanceSession } = await issuer.openid4vc.issuer.createCredentialOffer({
    issuerId: issuerRecord.issuerId,
    credentialConfigurationIds: ['employee-badge'],
    preAuthorizedCodeFlowConfig: {
      txCode: { input_mode: 'numeric', length: 6, description: 'Enter the code from the email we sent you' },
    },
    issuanceMetadata: { employeeId },
  })

  // Show credentialOffer as a QR code or link. Send the code (userPin) to the user over another channel.
  return { credentialOffer, txCode: issuanceSession.userPin }
}
// end-section-5

// start-section-6
issuer.events.on<OpenId4VcIssuanceSessionStateChangedEvent>(
  OpenId4VcIssuerEvents.IssuanceSessionStateChanged,
  ({ payload: { issuanceSession } }) => {
    if (issuanceSession.state === OpenId4VcIssuanceSessionState.Completed) {
      console.log(`Issuance session ${issuanceSession.id} completed`)
    } else if (issuanceSession.state === OpenId4VcIssuanceSessionState.Error) {
      console.error(`Issuance session ${issuanceSession.id} failed: ${issuanceSession.errorMessage}`)
    }
  }
)
// end-section-6
