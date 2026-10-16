import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import { KnownJwaSignatureAlgorithms, PublicJwk } from '@credo-ts/core/kms'
import { agentDependencies } from '@credo-ts/node'
import {
  getScopesFromCredentialConfigurationsSupported,
  OpenId4VciAuthorizationFlow,
  type OpenId4VciCredentialConfigurationSupportedWithFormats,
  OpenId4VciCredentialFormatProfile,
  OpenId4VcModule,
} from '@credo-ts/openid4vc'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import express from 'express'

// Creates the issuers and offers. Receiving the credentials needs a running authorization server.

function askar(id: string) {
  return new AskarModule({
    askar: NativeAskar,
    // In-memory storage, so the example leaves nothing behind
    store: { id, key: `${id}-key`, database: { type: 'sqlite', config: { inMemory: true } } },
  })
}

const issuer = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: askar('external-as-issuer'),
    openid4vc: new OpenId4VcModule({
      app: express(),
      issuer: {
        baseUrl: 'https://issuer.example.com/oid4vci',
        credentialRequestToCredentialMapper: () => {
          throw new Error('See the credential format pages for mappers')
        },
      },
    }),
  },
})

const holder = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: askar('external-as-holder'),
    openid4vc: new OpenId4VcModule(),
  },
})

await issuer.initialize()
await holder.initialize()

const credentialConfigurationsSupported = {
  employee: {
    format: OpenId4VciCredentialFormatProfile.SdJwtDc,
    vct: 'urn:example:employee:1',
    scope: 'employee',
    cryptographic_binding_methods_supported: ['jwk'],
    proof_types_supported: { jwt: { proof_signing_alg_values_supported: [KnownJwaSignatureAlgorithms.ES256] } },
  },
} satisfies Record<string, OpenId4VciCredentialConfigurationSupportedWithFormats>

// start-section-1
// Wallets use your authorization server directly
const directIssuer = await issuer.openid4vc.issuer.createIssuer({
  issuerId: 'employee-direct',
  credentialConfigurationsSupported,
  authorizationServerConfigs: [
    {
      type: 'direct',
      issuer: 'https://auth.example.com',
      // Only needed if Credo has to introspect the access tokens
      clientAuthentication: { clientId: 'credo-issuer', clientSecret: 'secret' },
    },
  ],
})

await issuer.openid4vc.issuer.createCredentialOffer({
  issuerId: directIssuer.issuerId,
  credentialConfigurationIds: ['employee'],
  authorizationCodeFlowConfig: { authorizationServerUrl: 'https://auth.example.com' },
})
// end-section-1

// start-section-2
// Wallets use Credo's authorization server, which sends the user to your identity provider
const chainedIssuer = await issuer.openid4vc.issuer.createIssuer({
  issuerId: 'employee-chained',
  credentialConfigurationsSupported,
  authorizationServerConfigs: [
    {
      type: 'chained',
      issuer: 'https://idp.example.com',
      // Credo's client at the identity provider. Register
      // https://issuer.example.com/oid4vci/employee-chained/redirect as its redirect URI.
      clientAuthentication: { type: 'clientSecret', clientId: 'credo-issuer', clientSecret: 'secret' },
      // Credential scope -> scopes to request from the identity provider
      scopesMapping: { employee: ['openid', 'profile'] },
    },
  ],
})

await issuer.openid4vc.issuer.createCredentialOffer({
  issuerId: chainedIssuer.issuerId,
  credentialConfigurationIds: ['employee'],
  // Selects the chained authorization server
  authorizationCodeFlowConfig: { authorizationServerUrl: 'https://idp.example.com' },
})
// end-section-2

// start-section-3
/**
 * `openAuthorizationUrl` opens the URL in a browser and resolves with the URL the
 * authorization server redirected to, for example using an in-app browser session.
 */
export async function receiveWithRedirect(
  credentialOffer: string,
  openAuthorizationUrl: (authorizationRequestUrl: string) => Promise<string>
) {
  const clientId = 'example-wallet'
  const redirectUri = 'https://wallet.example.com/redirect'

  const resolvedOffer = await holder.openid4vc.holder.resolveCredentialOffer(credentialOffer)
  const authorization = await holder.openid4vc.holder.resolveOpenId4VciAuthorizationRequest(resolvedOffer, {
    clientId,
    redirectUri,
    scope: getScopesFromCredentialConfigurationsSupported(resolvedOffer.offeredCredentialConfigurations),
  })
  if (authorization.authorizationFlow !== OpenId4VciAuthorizationFlow.Oauth2Redirect) {
    throw new Error('Expected a redirect to the authorization server')
  }

  const authorizationResponseRedirectUrl = await openAuthorizationUrl(authorization.authorizationRequestUrl)
  const { authorizationCode } = holder.openid4vc.holder.parseAuthorizationCodeFromAuthorizationResponse({
    authorizationResponseRedirectUrl,
    resolvedCredentialOffer: resolvedOffer,
  })

  const token = await holder.openid4vc.holder.requestToken({
    resolvedCredentialOffer: resolvedOffer,
    code: authorizationCode,
    clientId,
    redirectUri,
    codeVerifier: authorization.codeVerifier,
    // Bound to the DPoP key used for the pushed authorization request, if any
    dpop: authorization.dpop,
  })

  return holder.openid4vc.holder.requestCredentials({
    resolvedCredentialOffer: resolvedOffer,
    ...token,
    clientId,
    credentialBindingResolver: async () => {
      const key = await holder.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
      return { method: 'jwk', keys: [PublicJwk.fromPublicJwk(key.publicJwk)] }
    },
  })
}
// end-section-3

console.log('Created issuers', directIssuer.issuerId, chainedIssuer.issuerId)

await issuer.shutdown()
await holder.shutdown()
