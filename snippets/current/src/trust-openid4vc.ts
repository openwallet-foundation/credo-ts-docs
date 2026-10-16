// start-section-1
import { readFile } from 'node:fs/promises'
import type { GetTrustedIssuersForVerification, VerificationSigner } from '@credo-ts/core'
import type { OpenId4VcVerificationTypes } from '@credo-ts/openid4vc'

// A JSON array of PEM encoded certificates, for example exported from a trust list
async function loadTrustList(name: string): Promise<string[]> {
  return JSON.parse(await readFile(`trust-lists/${name}.json`, 'utf8'))
}
// end-section-1

// start-section-2
const trustedRootsByVerifier: Record<string, string[]> = {
  'pid-verifier': await loadTrustList('pid-providers'),
  'diploma-verifier': await loadTrustList('universities'),
}

export const getVerifierTrustedIssuers: GetTrustedIssuersForVerification<
  VerificationSigner,
  OpenId4VcVerificationTypes
> = async (_agentContext, { signer, verification }) => {
  if (verification.type !== 'openId4VpCredential') return undefined

  // Each verifier only accepts credentials from its own trust list
  const { verifierId } = verification.openId4VcVerificationSessionRecord
  const trustedRoots = trustedRootsByVerifier[verifierId] ?? []

  if (signer.method === 'x509') {
    return { trustedIssuers: [{ method: 'x509', issuance: trustedRoots }] }
  }

  // This verifier doesn't accept did-signed credentials
  return { trustedIssuers: [] }
}
// end-section-2

// start-section-3
const trustedIssuerRoots = await loadTrustList('issuers')
const trustedVerifierRoots = await loadTrustList('relying-parties')

export const getHolderTrustedIssuers: GetTrustedIssuersForVerification<
  VerificationSigner,
  OpenId4VcVerificationTypes
> = async (_agentContext, { signer, verification }) => {
  // Did-signed objects are accepted, as no list is returned for them
  if (signer.method !== 'x509') return undefined

  switch (verification.type) {
    // Credentials received over OpenID4VCI
    case 'credential':
      return { trustedIssuers: [{ method: 'x509', issuance: trustedIssuerRoots }] }
    // Signed OpenID4VP authorization requests
    case 'oauth2SecuredAuthorizationRequest':
      return { trustedIssuers: [{ method: 'x509', issuance: trustedVerifierRoots }] }
    default:
      return undefined
  }
}
// end-section-3
