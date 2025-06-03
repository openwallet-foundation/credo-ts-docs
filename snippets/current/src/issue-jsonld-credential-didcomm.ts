import type { CredentialStateChangedEvent, InitConfig, ProofStateChangedEvent } from '@credo-ts/core'

import { AskarModule } from '@credo-ts/askar'
import {
  CredentialEventTypes,
  CredentialState,
  DidsModule,
  HttpOutboundTransport,
  WsOutboundTransport,
  Agent,
  CredentialsModule,
  V2CredentialProtocol,
  DifPresentationExchangeProofFormatService,
  ProofsModule,
  V2ProofProtocol,
  CacheModule,
  InMemoryLruCache,
  W3cCredentialsModule,
  JsonLdCredentialFormatService,
  KeyType,
  DidDocumentBuilder,
  utils,
  getEd25519VerificationKey2018,
  ProofEventTypes,
  ProofState,
} from '@credo-ts/core'
import { agentDependencies, HttpInboundTransport } from '@credo-ts/node'
import { ariesAskar } from '@hyperledger/aries-askar-nodejs'
import { makeConnection } from '@credo-ts/test-utils'

import { CheqdModule, CheqdModuleConfig, CheqdDidRegistrar, CheqdDidResolver } from '@credo-ts/cheqd'

// start-section-1
let issuerDid: string
const issuerConfig: InitConfig = {
  label: 'docs-agent-nodejs-issue-a-credential-issuer',
  walletConfig: {
    id: 'wallet-id-issuer',
    key: 'testkey0000000000000000000000000',
  },
}
const initializeIssuerAgent = async () => {
  const issuer = new Agent({
    config: issuerConfig,
    dependencies: agentDependencies,
    modules: {
      askar: new AskarModule({
        ariesAskar,
      }),
      dids: new DidsModule({
        registrars: [new CheqdDidRegistrar()],
        resolvers: [new CheqdDidResolver()],
      }),
      // Add cheqd module
      cheqd: new CheqdModule(
        new CheqdModuleConfig({
          networks: [
            {
              network: '<mainnet or testnet>',
              cosmosPayerSeed: '<cosmos payer seed or mnemonic>',
            },
          ],
        })
      ),
      credentials: new CredentialsModule({
        credentialProtocols: [
          new V2CredentialProtocol({
            credentialFormats: [new JsonLdCredentialFormatService()],
          }),
        ],
      }),
      proofs: new ProofsModule({
        proofProtocols: [
          new V2ProofProtocol({
            proofFormats: [new DifPresentationExchangeProofFormatService()],
          }),
        ],
      }),
      cache: new CacheModule({
        cache: new InMemoryLruCache({ limit: 100 }),
      }),
      w3cCredentials: new W3cCredentialsModule({}),
    },
  })

  // Register a simple `WebSocket` outbound transport
  issuer.registerOutboundTransport(new WsOutboundTransport())

  // Register a simple `Http` outbound transport
  issuer.registerOutboundTransport(new HttpOutboundTransport())

  // Register a simple `Http` inbound transport
  issuer.registerInboundTransport(new HttpInboundTransport({ port: 3002 }))

  await issuer.initialize()
  // Create a DID with Ed25519 verification method
  const did = `did:cheqd:testnet:${utils.uuid()}`
  const ed25519Key = await issuer.wallet.createKey({
    keyType: KeyType.Ed25519,
  })
  const createResult = await issuer.dids.create({
    method: 'cheqd', // Adjust based on your DID method
    didDocument: new DidDocumentBuilder(did)
      .addController(did)
      .addVerificationMethod(
        getEd25519VerificationKey2018({
          key: ed25519Key,
          controller: did,
          id: `${did}#${ed25519Key.fingerprint}`,
        })
      )
      .addAssertionMethod(`${did}#${ed25519Key.fingerprint}`)
      .addAuthentication(`${did}#${ed25519Key.fingerprint}`)
      .build(),
  })

  if (!createResult.didState.did) {
    throw new Error('DID creation failed: did is undefined')
  }
  issuerDid = createResult.didState.did
  return issuer
}
// end-section-1
// start-section-2
const holderConfig: InitConfig = {
  label: 'docs-agent-nodejs-issue-a-credential-holder',
  walletConfig: {
    id: 'wallet-id-holder',
    key: 'testkey0000000000000000000000000',
  },
}
const initializeHolderAgent = async () => {
  const holder = new Agent({
    config: holderConfig,
    dependencies: agentDependencies,
    modules: {
      askar: new AskarModule({
        ariesAskar,
      }),
      dids: new DidsModule({
        resolvers: [new CheqdDidResolver()],
      }),
      credentials: new CredentialsModule({
        credentialProtocols: [
          new V2CredentialProtocol({
            credentialFormats: [new JsonLdCredentialFormatService()],
          }),
        ],
      }),
      proofs: new ProofsModule({
        proofProtocols: [
          new V2ProofProtocol({
            proofFormats: [new DifPresentationExchangeProofFormatService()],
          }),
        ],
      }),
      cache: new CacheModule({
        cache: new InMemoryLruCache({ limit: 100 }),
      }),
      w3cCredentials: new W3cCredentialsModule({}),
    },
  })

  // Register a simple `WebSocket` outbound transport
  holder.registerOutboundTransport(new WsOutboundTransport())

  // Register a simple `Http` outbound transport
  holder.registerOutboundTransport(new HttpOutboundTransport())

  // Register a simple `Http` inbound transport
  holder.registerInboundTransport(new HttpInboundTransport({ port: 3002 }))

  await holder.initialize()
  return holder
}
// end-section-2

// start-section-3
const setupCredentialListener = (agent: Agent, cb: (...args: any) => void) => {
  agent.events.on<CredentialStateChangedEvent>(CredentialEventTypes.CredentialStateChanged, async ({ payload }) => {
    const { credentialRecord } = payload
    switch (credentialRecord.state) {
      case CredentialState.ProposalReceived:
        console.log('Issuer: Credential proposal received from Holder')
        console.log('Issuer: Sending credential offer to Holder...')

        await agent.credentials.acceptProposal({
          credentialRecordId: credentialRecord.id,
          comment: 'V2 W3C JSON-LD Offer',
        })
        break
      case CredentialState.OfferReceived:
        console.log('Holder: Credential offer received from Issuer, accepting...')
        // Auto-accept the credential offer
        await agent.credentials.acceptOffer({
          credentialRecordId: credentialRecord.id,
          credentialFormats: {
            jsonld: {}, // Accept with default options
          },
        })
        break
      case CredentialState.RequestReceived:
        console.log('Issuer: Credential request received from Holder')
        console.log('Issuer: Sending credential to Holder...')
        await agent.credentials.acceptRequest({
          credentialRecordId: credentialRecord.id,
          comment: 'V2 JSON-LD Credential',
        })
        break
      case CredentialState.CredentialReceived:
        console.log('Holder: Credential received from Issuer, accepting...')
        // Auto-accept the credential
        await agent.credentials.acceptCredential({
          credentialRecordId: credentialRecord.id,
        })
        break
      case CredentialState.Done:
        console.log('Credential exchange completed!')
        console.log('Credential ID:', credentialRecord.id)
        break
    }
  })
}
// end-section-3

// start-section-4
const setupProofListener = (agent: Agent, cb: (...args: any) => void) => {
  agent.events.on<ProofStateChangedEvent>(ProofEventTypes.ProofStateChanged, async ({ payload }) => {
    const { proofRecord } = payload
    switch (proofRecord.state) {
      case ProofState.PresentationReceived:
        console.log('Issuer: Proof presentation received from Holder')
        console.log('Issuer: Verifying proof...')
        await agent.proofs.acceptPresentation({
          proofRecordId: proofRecord.id,
        })
        break

      case ProofState.Done:
        console.log('Issuer: Proof verification completed!')
        // Check if proof is valid
        const proof = await agent.proofs.getById(proofRecord.id)
        console.log('Issuer: Proof is valid:', proof.isVerified)
        break
      case ProofState.RequestReceived:
        console.log('Holder: Proof request received from Issuer')
        console.log('HolderS: Selecting credentials and creating presentation...')
        // Get the available credentials that match the request
        const requestedCredentials = await agent.proofs.selectCredentialsForRequest({
          proofRecordId: proofRecord.id,
        })
        // Accept the proof request with selected credentials
        await agent.proofs.acceptRequest({
          proofRecordId: proofRecord.id,
          proofFormats: {
            presentationExchange: {
              credentials: requestedCredentials.proofFormats['presentation-exchange']?.credentials || {},
            },
          },
        })
        break
    }
  })
}
// end-section-4

const run = async () => {
  let holderConnectionId: string
  let issuerConnectionId: string
  console.log('Initializing Issuer agent...')
  const issuerAgent = await initializeIssuerAgent()

  console.log('Initializing Holder agent...')
  const holderAgent = await initializeHolderAgent()
  ;[{ id: issuerConnectionId }, { id: holderConnectionId }] = await makeConnection(issuerAgent, holderAgent)
  setupCredentialListener(holderAgent, () => console.log('Holder Credential-exchange Listeners registered!'))
  setupCredentialListener(issuerAgent, () => console.log('Issuer Credential-exchange Listeners registered!'))
  setupProofListener(holderAgent, () => console.log('Holder Proof-exchange Listeners registered!'))
  setupProofListener(issuerAgent, () => console.log('Issuer Proof-exchange Listeners registered!'))

  // start-section-5
  // Define the credential Holder wants to propose
  const signCredentialOptions = {
    credential: {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/citizenship/v1',
        'https://w3id.org/security/bbs/v1',
      ],
      id: 'https://issuer.oidp.uscis.gov/credentials/83627465',
      type: ['VerifiableCredential', 'PermanentResidentCard'],
      issuer: issuerDid, // Issuer's DID
      issuanceDate: '2019-12-03T12:19:52Z',
      expirationDate: '2029-12-03T12:19:52Z',
      identifier: '83627465',
      name: 'Permanent Resident Card',
      credentialSubject: {
        id: 'did:example:b34ca6cd37bbf23', // Holder's DID
        type: ['PermanentResident', 'Person'],
        givenName: 'JOHN',
        familyName: 'SMITH',
        gender: 'Male',
        image: 'data:image/png;base64,iVBORw0KGgokJggg==',
        residentSince: '2015-01-01',
        description: 'Government of Example Permanent Resident Card.',
        lprCategory: 'C09',
        lprNumber: '999-999-999',
        commuterClassification: 'C1',
        birthCountry: 'Bahamas',
        birthDate: '1958-07-17',
      },
    },
    options: {
      proofType: 'Ed25519Signature2018',
      proofPurpose: 'assertionMethod',
    },
  }
  console.log('Holder proposing credential...')
  // Holder proposes credential to Issuer
  const credentialExchangeRecord = await holderAgent.credentials.proposeCredential({
    connectionId: holderConnectionId, // Holder's existing connection ID
    protocolVersion: 'v2',
    credentialFormats: { jsonld: signCredentialOptions },
    comment: 'v2 propose credential test for W3C Credentials',
  })
  console.log('Connection ID:', credentialExchangeRecord.connectionId)
  console.log('Protocol Version:', credentialExchangeRecord.protocolVersion)
  console.log('State:', credentialExchangeRecord.state) // Should be ProposalSent
  console.log('Thread ID:', credentialExchangeRecord.threadId)
  // end-section-5
  // start-section-6
  console.log('Issuer requesting proof from Holder...')
  // Define the presentation request using Presentation Exchange
  const presentationDefinition = {
    id: 'permanent-resident-card-presentation',
    input_descriptors: [
      {
        id: 'permanent-resident-card',
        name: 'Permanent Resident Card',
        purpose: 'We need to verify your permanent resident status',
        schema: [
          {
            uri: 'https://w3id.org/citizenship/v1',
          },
        ],
        constraints: {
          fields: [
            {
              path: ['$.type'],
              filter: {
                type: 'array',
                contains: {
                  const: 'PermanentResidentCard',
                },
              },
            },
            {
              path: ['$.credentialSubject.givenName'],
              filter: {
                type: 'string',
              },
            },
            {
              path: ['$.credentialSubject.familyName'],
              filter: {
                type: 'string',
              },
            },
            {
              path: ['$.credentialSubject.lprNumber'],
              filter: {
                type: 'string',
              },
            },
          ],
        },
      },
    ],
  }
  console.log('Issuer: Requesting proof from Holder...')
  const proofExchangeRecord = await issuerAgent.proofs.requestProof({
    connectionId: issuerConnectionId,
    protocolVersion: 'v2',
    proofFormats: {
      presentationExchange: { presentationDefinition },
    },
    comment: 'Please present your Permanent Resident Card for verification',
  })
  // end-section-6
}

export default run

void run()
