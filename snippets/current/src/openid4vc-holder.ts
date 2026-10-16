// The certificates from openid4vc-issuer.ts and openid4vc-verifier.ts, which this holder trusts

// start-section-1
import { AskarModule } from '@credo-ts/askar'
import { Agent, Kms, MdocRecord, SdJwtVcRecord, W3cCredentialRecord, X509Module } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import {
  type OpenId4VciCredentialBindingResolver,
  OpenId4VcModule,
  preAuthorizedCodeGrantIdentifier,
} from '@credo-ts/openid4vc'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import { issuerCertificate } from './openid4vc-issuer.js'
import { verifierCertificate } from './openid4vc-verifier.js'

export const holder = new Agent({
  config: {
    // Allows the http://localhost URLs of this example. Never enable this in production.
    allowInsecureHttpUrls: true,
  },
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar: NativeAskar,
      // In-memory database, so each run of this example starts fresh
      store: { id: 'holder', key: 'holder-key', database: { type: 'sqlite', config: { inMemory: true } } },
    }),
    // Certificates (or root CAs) of the issuers and verifiers you trust
    x509: new X509Module({ trustedCertificates: [issuerCertificate, verifierCertificate] }),
    openid4vc: new OpenId4VcModule(),
  },
})

await holder.initialize()
// end-section-1

// start-section-4
const credentialBindingResolver: OpenId4VciCredentialBindingResolver = async ({ supportsJwk, proofTypes }) => {
  // The algorithms the issuer accepts for this credential that the wallet's KMS supports
  const algorithm = proofTypes.jwt?.supportedSignatureAlgorithms[0]
  if (!supportsJwk || !algorithm) throw new Error('The issuer does not support jwk binding with a jwt proof')

  const key = await holder.kms.createKeyForSignatureAlgorithm({ algorithm })
  return { method: 'jwk', keys: [Kms.PublicJwk.fromPublicJwk(key.publicJwk)] }
}
// end-section-4

export async function receiveCredential(credentialOffer: string, txCode?: string) {
  // start-section-2
  const resolvedCredentialOffer = await holder.openid4vc.holder.resolveCredentialOffer(credentialOffer)

  // What to show the user: the issuer, the offered credentials and whether a code is needed
  const issuerName = resolvedCredentialOffer.metadata.credentialIssuer.display?.[0]?.name
  const offeredCredentials = Object.keys(resolvedCredentialOffer.offeredCredentialConfigurations)
  const txCodeRequest =
    resolvedCredentialOffer.credentialOfferPayload.grants?.[preAuthorizedCodeGrantIdentifier]?.tx_code
  // end-section-2
  console.log(`${issuerName} offers ${offeredCredentials.join(', ')}`, txCodeRequest)

  // start-section-3
  // txCode is the code the user received from the issuer, if txCodeRequest is defined
  const token = await holder.openid4vc.holder.requestToken({ resolvedCredentialOffer, txCode })
  // end-section-3

  // start-section-5
  const { credentials, deferredCredentials } = await holder.openid4vc.holder.requestCredentials({
    resolvedCredentialOffer,
    accessToken: token.accessToken,
    cNonce: token.cNonce,
    dpop: token.dpop,
    credentialBindingResolver,
  })
  // end-section-5
  if (deferredCredentials.length > 0) throw new Error('This example does not handle deferred issuance')

  // start-section-6
  // requestCredentials verifies the credentials, but doesn't store them
  for (const { record } of credentials) {
    if (record instanceof SdJwtVcRecord) await holder.sdJwtVc.store({ record })
    else if (record instanceof MdocRecord) await holder.mdoc.store({ record })
    else if (record instanceof W3cCredentialRecord) await holder.w3cCredentials.store({ record })
    else await holder.w3cV2Credentials.store({ record })
  }
  // end-section-6
}

export async function presentCredential(authorizationRequest: string) {
  // start-section-7
  const resolvedRequest = await holder.openid4vc.holder.resolveOpenId4VpAuthorizationRequest(authorizationRequest)

  // Who is asking, e.g. prefix 'x509_san_dns' and client id 'x509_san_dns:localhost'
  const { clientIdPrefix, effectiveClientId } = resolvedRequest.verifier

  const queryResult = resolvedRequest.dcql?.queryResult
  if (!queryResult?.can_be_satisfied) throw new Error('Your stored credentials do not match the request')

  // For each credential query: the matching credentials and the claims they would disclose
  for (const [queryId, match] of Object.entries(queryResult.credential_matches)) {
    if (!match.success) continue
    for (const { record, claims } of match.valid_credentials) {
      console.log(queryId, record.type, claims.valid_claim_sets[0].output)
    }
  }
  // end-section-7
  console.log(`Request from ${effectiveClientId} (${clientIdPrefix})`)

  // start-section-8
  // Picks the first matching credential for each query. Ask the user for consent before you submit.
  const credentials = holder.openid4vc.holder.selectCredentialsForDcqlRequest(queryResult)

  const result = await holder.openid4vc.holder.acceptOpenId4VpAuthorizationRequest({
    authorizationRequestPayload: resolvedRequest.authorizationRequestPayload,
    dcql: { credentials },
  })

  if (!result.ok) throw new Error(`The verifier rejected the response: ${JSON.stringify(result.serverResponse.body)}`)
  // end-section-8

  // If the verifier returns a redirect URI, open it to continue in the verifier's app or website
  return result.redirectUri
}
