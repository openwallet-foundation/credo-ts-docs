// The issuer's certificate from openid4vc-issuer.ts, which this verifier trusts

// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent, ClaimFormat, Kms, X509Module } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import {
  OpenId4VcModule,
  OpenId4VcVerificationSessionState,
  type OpenId4VcVerificationSessionStateChangedEvent,
  OpenId4VcVerifierEvents,
} from '@credo-ts/openid4vc'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import express from 'express'
import { issuerCertificate } from './openid4vc-issuer.js'

const verifierPort = 4021
const app = express()

export const verifier = new Agent({
  config: {
    // Allows the http://localhost URLs of this example. Never enable this in production.
    allowInsecureHttpUrls: true,
  },
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      // In-memory database, so each run of this example starts fresh
      store: { id: 'verifier', key: 'verifier-key', database: { type: 'sqlite', config: { inMemory: true } } },
    }),
    // Certificates (or root CAs) of the credential issuers you accept
    x509: new X509Module({ trustedCertificates: [issuerCertificate] }),
    openid4vc: new OpenId4VcModule({
      app,
      verifier: { baseUrl: `http://localhost:${verifierPort}/oid4vp` },
    }),
  },
})

await verifier.initialize()
export const verifierServer = app.listen(verifierPort)
// end-section-1

// start-section-2
const verifierRecord = await verifier.openid4vc.verifier.createVerifier({
  clientMetadata: { client_name: 'Example Verifier' },
})

const verifierKey = await verifier.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })

// Self-signed for this example. With x509_san_dns, the host of the verifier's
// baseUrl must be a DNS name in the certificate's subject alternative names.
export const verifierCertificate = await verifier.x509.createCertificate({
  authorityKey: Kms.PublicJwk.fromPublicJwk(verifierKey.publicJwk),
  issuer: { commonName: 'Example Verifier', countryName: 'NL' },
  extensions: { subjectAlternativeName: { name: [{ type: 'dns', value: 'localhost' }] } },
})
// end-section-2

// start-section-3
export async function createEmployeeBadgeRequest() {
  const { authorizationRequest, verificationSession } = await verifier.openid4vc.verifier.createAuthorizationRequest({
    verifierId: verifierRecord.verifierId,
    requestSigner: { method: 'x5c', x5c: [verifierCertificate] },
    dcql: {
      query: {
        credentials: [
          {
            id: 'employee-badge',
            format: 'dc+sd-jwt',
            meta: { vct_values: ['urn:example:employee-badge:1'] },
            claims: [{ path: ['given_name'] }, { path: ['department'] }],
          },
        ],
      },
    },
  })

  // Show authorizationRequest as a QR code or link, and keep the session id to look up the result
  return { authorizationRequest, verificationSessionId: verificationSession.id }
}
// end-section-3

// start-section-4
verifier.events.on<OpenId4VcVerificationSessionStateChangedEvent>(
  OpenId4VcVerifierEvents.VerificationSessionStateChanged,
  ({ payload: { verificationSession } }) => {
    if (verificationSession.state === OpenId4VcVerificationSessionState.ResponseVerified) {
      console.log(`Verification session ${verificationSession.id} verified`)
    } else if (verificationSession.state === OpenId4VcVerificationSessionState.Error) {
      console.error(`Verification session ${verificationSession.id} failed: ${verificationSession.errorMessage}`)
    }
  }
)
// end-section-4

// start-section-5
export async function getEmployeeBadgeClaims(verificationSessionId: string) {
  // Throws unless the session is in state ResponseVerified
  const { dcql } = await verifier.openid4vc.verifier.getVerifiedAuthorizationResponse(verificationSessionId)

  const [presentation] = dcql?.presentations['employee-badge'] ?? []
  if (presentation?.claimFormat !== ClaimFormat.SdJwtDc) throw new Error('Expected an SD-JWT VC presentation')

  // Only the claims the holder disclosed, plus the always-visible ones like vct and iat
  return presentation.prettyClaims
}
// end-section-5
