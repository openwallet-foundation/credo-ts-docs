import { AskarModule } from '@credo-ts/askar'
// start-section-1
import {
  Agent,
  ClaimFormat,
  DidKey,
  type KeyDidCreateOptions,
  W3cV2Credential,
  W3cV2CredentialRecord,
  W3cV2EnvelopedVerifiableCredential,
  W3cV2Presentation,
  W3cV2SdJwtCredentialService,
  w3cDate,
} from '@credo-ts/core'
// end-section-1
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'

function createAgent(id: string) {
  return new Agent({
    config: {},
    dependencies: agentDependencies,
    modules: {
      askar: new AskarModule({
        askar: NativeAskar,
        store: { id, key: id, database: { type: 'sqlite', config: { inMemory: true } } },
      }),
    },
  })
}

async function createDidKey(agent: Agent) {
  const { didState } = await agent.dids.create<KeyDidCreateOptions>({
    method: 'key',
    options: { createKey: { type: { kty: 'OKP', crv: 'Ed25519' } } },
  })
  if (didState.state !== 'finished') throw new Error('Creating the DID failed')
  return { did: didState.did, didUrl: `${didState.did}#${DidKey.fromDid(didState.did).publicJwk.fingerprint}` }
}

const issuer = createAgent('format-w3c-v2-issuer')
const holder = createAgent('format-w3c-v2-holder')
const verifier = createAgent('format-w3c-v2-verifier')
await issuer.initialize()
await holder.initialize()
await verifier.initialize()

const issuerDid = await createDidKey(issuer)
const holderDid = await createDidKey(holder)

// start-section-2
const credential = new W3cV2Credential({
  type: ['VerifiableCredential', 'MembershipCredential'],
  issuer: issuerDid.did,
  validFrom: w3cDate(Date.now()),
  credentialSubject: { id: holderDid.did, name: 'Jane Doe', memberSince: '2024-01-01' },
})

// vc+jwt
const jwtVc = await issuer.w3cV2Credentials.signCredential<ClaimFormat.JwtW3cVc>({
  format: ClaimFormat.JwtW3cVc,
  credential,
  alg: 'EdDSA',
  verificationMethod: issuerDid.didUrl,
})

// vc+sd-jwt: `cnf` binds the credential to the holder key
const sdJwtVc = await issuer.w3cV2Credentials.signCredential<ClaimFormat.SdJwtW3cVc>({
  format: ClaimFormat.SdJwtW3cVc,
  credential,
  alg: 'EdDSA',
  verificationMethod: issuerDid.didUrl,
  holder: { method: 'did', didUrl: holderDid.didUrl },
  disclosureFrame: { credentialSubject: { _sd: ['name', 'memberSince'] } },
})

// di_vc with a Data Integrity proof
const diVc = await issuer.w3cV2Credentials.signCredential<ClaimFormat.DiVc>({
  format: ClaimFormat.DiVc,
  credential,
  cryptosuite: 'eddsa-jcs-2022',
  verificationMethod: issuerDid.didUrl,
})

// `encoded` is a compact string for vc+jwt and vc+sd-jwt, and JSON for di_vc
console.log(sdJwtVc.encoded, diVc.encoded)
// end-section-2

// start-section-3
const sdJwtResult = await holder.w3cV2Credentials.verifyCredential({ credential: sdJwtVc.encoded })
const diResult = await holder.w3cV2Credentials.verifyCredential({ credential: diVc })
if (!sdJwtResult.isValid || !diResult.isValid) throw new Error('Received an invalid credential')

const record = await holder.w3cV2Credentials.store({ record: W3cV2CredentialRecord.fromCredential(sdJwtVc) })

// Returns credentials, not records
const memberships = await holder.w3cV2Credentials.findAllByQuery({
  claimFormat: ClaimFormat.SdJwtW3cVc,
  types: ['MembershipCredential'],
})
console.log(memberships.length)
// end-section-3

// start-section-4
// Received from the verifier
const challenge = '9d0e4c6a-2b1f-4e8d-a7c3-5f6b8e9d0a1c'
const domain = 'https://verifier.example.com'

// Selective disclosure is only available on the service
const sdJwtService = holder.dependencyManager.resolve(W3cV2SdJwtCredentialService)
const disclosed = await sdJwtService.present(holder.context, {
  credential: record.encoded,
  presentationFrame: { credentialSubject: { name: true } },
})

const sdJwtVp = await holder.w3cV2Credentials.signPresentation<ClaimFormat.SdJwtW3cVp>({
  format: ClaimFormat.SdJwtW3cVp,
  presentation: new W3cV2Presentation({
    holder: holderDid.did,
    verifiableCredential: [W3cV2EnvelopedVerifiableCredential.fromVerifiableCredential(disclosed)],
  }),
  challenge,
  domain,
})

const diVp = await holder.w3cV2Credentials.signPresentation<ClaimFormat.DiVp>({
  format: ClaimFormat.DiVp,
  presentation: new W3cV2Presentation({ holder: holderDid.did, verifiableCredential: [diVc] }),
  cryptosuite: 'eddsa-jcs-2022',
  verificationMethod: holderDid.didUrl,
  challenge,
  domain,
})
// end-section-4

// start-section-5
const sdJwtVpResult = await verifier.w3cV2Credentials.verifyPresentation({
  presentation: sdJwtVp.encoded,
  challenge,
  domain,
})
const diVpResult = await verifier.w3cV2Credentials.verifyPresentation({ presentation: diVp, challenge, domain })

if (!sdJwtVpResult.isValid) console.error(sdJwtVpResult.presentation.validations, sdJwtVpResult.credentialEntries)
console.log(sdJwtVpResult.isValid, diVpResult.isValid)
// end-section-5

// start-section-6
const jwtVcResult = await verifier.w3cV2Credentials.verifyCredential({
  credential: jwtVc.encoded,
  trustedIssuers: [{ method: 'did', issuance: issuerDid.did }],
})
console.log(jwtVcResult.isValid)
// end-section-6

await issuer.shutdown()
await holder.shutdown()
await verifier.shutdown()
