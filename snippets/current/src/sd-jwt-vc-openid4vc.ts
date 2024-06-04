import type { InitConfig, SdJwtVcRecord, W3cCredentialRecord } from '@credo-ts/core'
import { AskarModule } from '@credo-ts/askar'

const issuerConfig: InitConfig = {
  label: 'openid4vc-issuer',
  walletConfig: {
    id: 'openid4vc-issuer',
    key: 'testkey0000000000000000000000000',
  },
}

const holderConfig: InitConfig = {
  label: 'openid4vc-holder',
  walletConfig: {
    id: 'openid4vc-holder',
    key: 'testkey0000000000000000000000000',
  },
}

// start-section-4
import {
  OpenId4VcIssuanceSessionStateChangedEvent,
  OpenId4VcIssuerEvents,
  OpenId4VcVerificationSessionState,
  OpenId4VcVerificationSessionStateChangedEvent,
  OpenId4VcVerifierEvents,
  OpenId4VciCredentialFormatProfile,
  OpenId4VciCredentialRequestToCredentialMapper,
} from '@credo-ts/openid4vc'

const credentialRequestToCredentialMapper: OpenId4VciCredentialRequestToCredentialMapper = async ({
  // agent context for the current wallet / tenant
  agentContext,
  // the credential offer related to the credential request
  credentialOffer,
  // the received credential request
  credentialRequest,
  // the list of credentialsSupported entries
  credentialsSupported,
  // the cryptographic binding provided by the holder in the credential request proof
  holderBinding,
  // the issuance session associated with the credential request and offer
  issuanceSession,
}) => {
  const firstSupported = credentialsSupported[0]

  // We only support vc+sd-jwt in this example, but you can add more formats
  if (firstSupported.format !== OpenId4VciCredentialFormatProfile.SdJwtVc) {
    throw new Error('Only vc+sd-jwt is supported')
  }

  // We only support AcmeCorpEmployee in this example, but you can support any type
  if (firstSupported.vct !== 'AcmeCorpEmployee') {
    throw new Error('Only AcmeCorpEmployee is supported')
  }

  // find the first did:key did in our wallet. You can modify this based on your needs
  const didsApi = agentContext.dependencyManager.resolve(DidsApi)
  const [didKeyDidRecord] = await didsApi.getCreatedDids({
    method: 'key',
  })

  const didKey = DidKey.fromDid(didKeyDidRecord.did)
  const didUrl = `${didKey.did}#${didKey.key.fingerprint}`

  return {
    credentialSupportedId: firstSupported.id,
    format: 'vc+sd-jwt',
    // We can provide the holderBinding as is, if we don't want to make changes
    holder: holderBinding,
    payload: {
      vct: firstSupported.vct,
      firstName: 'John',
      lastName: 'Doe',
    },
    disclosureFrame: {
      _sd: ['lastName'],
    },
    issuer: {
      method: 'did',
      didUrl,
    },
  }
}

// end-section-4

// start-section-1
import { Agent, DidsApi, DifPresentationExchangeService, KeyType } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { ariesAskar } from '@hyperledger/aries-askar-nodejs'

import express, { Router } from 'express'
import { OpenId4VcIssuerModule, OpenId4VcVerifierModule } from '@credo-ts/openid4vc'

// Create two express routers, all endpoints for the
// issuer and verifier will be added to these routers
const verifierRouter = Router()
const issuerRouter = Router()

// Register the routers on the express server. The path should match
// with the baseUrl you configure in the modules below.
const app = express()
app.use('/oid4vci', issuerRouter)
app.use('/siop', verifierRouter)

const issuer = new Agent({
  config: issuerConfig,
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      ariesAskar,
    }),
    openId4VcIssuer: new OpenId4VcIssuerModule({
      baseUrl: 'http://127.0.0.1:3000/oid4vci',

      // If no router is passed, one will be created.
      // you still have to register the router on your express server
      // but you can access it on agent.modules.openId4VcIssuer.config.router
      // It works the same for verifier: agent.modules.openId4VcVerifier.config.router
      router: issuerRouter,

      // Each of the endpoints can have configuration associated with it, such as the
      // path (under the baseUrl) to use for the endpoints.
      endpoints: {
        // The credentialRequestToCredentialMapper is the only required endpoint
        // configuration that must be provided. This method is called whenever a
        // credential request has been received for an offer we created. The callback should
        // return the issued credential to return in the credential response to the holder.
        credential: {
          credentialRequestToCredentialMapper,
        },
      },
    }),

    // the base URL of the verifier, the router
    openId4VcVerifier: new OpenId4VcVerifierModule({
      baseUrl: 'http://127.0.0.1:3000/siop',

      router: verifierRouter,
    }),
  },
})

// listen on port 3000 for the openid4vc app
app.listen(3000)
// end-section-1

await issuer
  .initialize()
  .then(() => {
    console.log('Issuer agent initialized!')
  })
  .catch((e) => {
    console.error(`Something went wrong while setting up the issuer agent! Message: ${e}`)
  })

// we use the same agent for the verifier, but the tutorial uses verifier.xxx
const verifier = issuer

// start-section-2
import { JwaSignatureAlgorithm } from '@credo-ts/core'

// Create an issuer with one supported credential: AcmeCorpEmployee
const openid4vcIssuer = await issuer.modules.openId4VcIssuer.createIssuer({
  display: [
    {
      name: 'ACME Corp.',
      description: 'ACME Corp. is a company that provides the best services.',
      text_color: '#000000',
      background_color: '#FFFFFF',
      logo: {
        url: 'https://acme.com/logo.png',
        alt_text: 'ACME Corp. logo',
      },
    },
  ],
  credentialsSupported: [
    {
      format: 'vc+sd-jwt',
      vct: 'AcmeCorpEmployee',
      id: 'AcmeCorpEmployee',
      cryptographic_binding_methods_supported: ['did:key'],
      cryptographic_suites_supported: [JwaSignatureAlgorithm.ES256],
    },
  ],
})

// Create a did:key that we will use for issuance
const issuerDidResult = await issuer.dids.create<KeyDidCreateOptions>({
  method: 'key',
  options: {
    keyType: KeyType.Ed25519,
  },
})

if (issuerDidResult.didState.state !== 'finished') {
  throw new Error('DID creation failed.')
}
// end-section-2

// start-section-3
const { credentialOffer, issuanceSession } = await issuer.modules.openId4VcIssuer.createCredentialOffer({
  issuerId: openid4vcIssuer.issuerId,
  // values must match the `id` of the credential supported by the issuer
  offeredCredentials: ['AcmeCorpEmployee'],

  // Only pre-authorized code flow is supported
  preAuthorizedCodeFlowConfig: {
    userPinRequired: false,
  },

  // You can store any metadata about the issuance here
  issuanceMetadata: {
    someKey: 'someValue',
  },
})

// Listen and react to changes in the issuance session
issuer.events.on<OpenId4VcIssuanceSessionStateChangedEvent>(
  OpenId4VcIssuerEvents.IssuanceSessionStateChanged,
  (event) => {
    if (event.payload.issuanceSession.id === issuanceSession.id) {
      console.log('Issuance session state changed to ', event.payload.issuanceSession.state)
    }
  }
)
// end-section-3

// start-section-5
import { OpenId4VcHolderModule } from '@credo-ts/openid4vc'

const holder = new Agent({
  config: holderConfig,
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      ariesAskar,
    }),

    // no configuration required for holder module
    openId4VcHolderModule: new OpenId4VcHolderModule(),
  },
})
// end-section-5

await holder
  .initialize()
  .then(() => {
    console.log('Holder agent initialized!')
  })
  .catch((e) => {
    console.error(`Something went wrong while setting up the holder agent! Message: ${e}`)
  })

// start-section-6
import { KeyDidCreateOptions, getJwkFromKey, DidKey } from '@credo-ts/core'

// resolved credential offer contains the offer, metadata, etc..
const resolvedCredentialOffer = await holder.modules.openId4VcHolderModule.resolveCredentialOffer(credentialOffer)
console.log('Resolved credential offer', JSON.stringify(resolvedCredentialOffer.credentialOfferPayload, null, 2))

// issuer only supports pre-authorized flow for now
const credentials = await holder.modules.openId4VcHolderModule.acceptCredentialOfferUsingPreAuthorizedCode(
  resolvedCredentialOffer,
  {
    credentialBindingResolver: async ({
      supportedDidMethods,
      keyType,
      supportsAllDidMethods,
      // supportsJwk now also passed
      supportsJwk,
      credentialFormat,
    }) => {
      // NOTE: example implementation. Adjust based on your needs
      // Return the binding to the credential that should be used. Either did or jwk is supported

      if (supportsAllDidMethods || supportedDidMethods?.includes('did:key')) {
        const didResult = await holder.dids.create<KeyDidCreateOptions>({
          method: 'key',
          options: {
            keyType,
          },
        })

        if (didResult.didState.state !== 'finished') {
          throw new Error('DID creation failed.')
        }

        const didKey = DidKey.fromDid(didResult.didState.did)

        return {
          method: 'did',
          didUrl: `${didKey.did}#${didKey.key.fingerprint}`,
        }
      }

      // we also support plain jwk for sd-jwt only
      if (supportsJwk && credentialFormat === OpenId4VciCredentialFormatProfile.SdJwtVc) {
        const key = await holder.wallet.createKey({
          keyType,
        })

        // you now need to return an object instead of VerificationMethod instance
        // and method 'did' or 'jwk'
        return {
          method: 'jwk',
          jwk: getJwkFromKey(key),
        }
      }

      throw new Error('Unable to create a key binding')
    },
  }
)

console.log('Received credentials', JSON.stringify(credentials, null, 2))

// Store the received credentials
const records: Array<W3cCredentialRecord | SdJwtVcRecord> = []
for (const credential of credentials) {
  if ('compact' in credential) {
    const record = await holder.sdJwtVc.store(credential.compact)
    records.push(record)
  } else {
    const record = await holder.w3cCredentials.storeCredential({
      credential,
    })
    records.push(record)
  }
}
// end-section-6

// start-section-7
// Create a verifier
const openId4VcVerifier = await verifier.modules.openId4VcVerifier.createVerifier({})

// Create a did:key that we will use for signing OpenID4VP authorization requests
const verifierDidResult = await issuer.dids.create<KeyDidCreateOptions>({
  method: 'key',
  options: {
    keyType: KeyType.Ed25519,
  },
})

if (verifierDidResult.didState.state !== 'finished') {
  throw new Error('DID creation failed.')
}

const verifierDidKey = DidKey.fromDid(verifierDidResult.didState.did)
// end-section-7

// start-section-8
const { authorizationRequest, verificationSession } =
  await verifier.modules.openId4VcVerifier.createAuthorizationRequest({
    verifierId: openId4VcVerifier.verifierId,
    requestSigner: {
      didUrl: `${verifierDidKey.did}#${verifierDidKey.key.fingerprint}`,
      method: 'did',
    },
    // Add DIF presentation exchange data
    presentationExchange: {
      definition: {
        id: '9ed05140-b33b-445e-a0f0-9a23aa501868',
        name: 'Employee Verification',
        purpose: 'We need to verify your employee status to grant access to the employee portal',
        input_descriptors: [
          {
            id: '9c98fb43-6fd5-49b1-8dcc-69bd2a378f23',
            constraints: {
              // Require limit disclosure
              limit_disclosure: 'required',
              fields: [
                {
                  filter: {
                    type: 'string',
                    const: 'AcmeCorpEmployee',
                  },
                  path: ['$.vct'],
                },
              ],
            },
          },
        ],
      },
    },
  })

// Listen and react to changes in the verification session
verifier.events.on<OpenId4VcVerificationSessionStateChangedEvent>(
  OpenId4VcVerifierEvents.VerificationSessionStateChanged,
  async (event) => {
    if (event.payload.verificationSession.id === verificationSession.id) {
      console.log('Verification session state changed to ', event.payload.verificationSession.state)
    }

    if (event.payload.verificationSession.state === OpenId4VcVerificationSessionState.ResponseVerified) {
      const verifiedAuthorizationResponse = await verifier.modules.openId4VcVerifier.getVerifiedAuthorizationResponse(
        verificationSession.id
      )
      console.log('Successfully verified presentation.', JSON.stringify(verifiedAuthorizationResponse, null, 2))

      console.log('Exiting...')
      process.exit()
    }
  }
)
// end-section-8

// start-section-9

// resolved credential offer contains the offer, metadata, etc..
const resolvedAuthorizationRequest = await holder.modules.openId4VcHolderModule.resolveSiopAuthorizationRequest(
  authorizationRequest
)
console.log(
  'Resolved credentials for request',
  JSON.stringify(resolvedAuthorizationRequest.presentationExchange.credentialsForRequest, null, 2)
)

const presentationExchangeService = holder.dependencyManager.resolve(DifPresentationExchangeService)
// Automatically select credentials. In a wallet you could manually choose which credentials to return based on the "resolvedAuthorizationRequest.presentationExchange.credentialsForRequest" value
const selectedCredentials = presentationExchangeService.selectCredentialsForRequest(
  resolvedAuthorizationRequest.presentationExchange.credentialsForRequest
)

// issuer only supports pre-authorized flow for now
const authorizationResponse = await holder.modules.openId4VcHolderModule.acceptSiopAuthorizationRequest({
  authorizationRequest: resolvedAuthorizationRequest.authorizationRequest,
  presentationExchange: {
    credentials: selectedCredentials,
  },
})
console.log('Submitted authorization response', JSON.stringify(authorizationResponse.submittedResponse, null, 2))
// end-section-9
