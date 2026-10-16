import { createServer } from 'node:http'
import { AskarModule } from '@credo-ts/askar'
import { Agent, DidKey, type KeyDidCreateOptions, Mdoc } from '@credo-ts/core'
import { PublicJwk } from '@credo-ts/core/kms'
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

const issuer = createAgent('format-status-list-issuer')
const holder = createAgent('format-status-list-holder')
const verifier = createAgent('format-status-list-verifier')
await issuer.initialize()
await holder.initialize()
await verifier.initialize()

const { didState } = await issuer.dids.create<KeyDidCreateOptions>({
  method: 'key',
  options: { createKey: { type: { kty: 'OKP', crv: 'Ed25519' } } },
})
if (didState.state !== 'finished') throw new Error('Creating the issuer DID failed')
const issuerDidUrl = `${didState.did}#${DidKey.fromDid(didState.did).publicJwk.fingerprint}`

const holderKey = await holder.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
const holderJwk = PublicJwk.fromPublicJwk(holderKey.publicJwk)

// start-section-1
// Your app hosts the status list tokens. This is a minimal stand-in for that endpoint.
const hostedStatusLists = new Map<string, { contentType: string; body: string | Uint8Array }>()
const server = createServer((request, response) => {
  const hosted = hostedStatusLists.get(request.url ?? '')
  if (!hosted) return response.writeHead(404).end()
  response.writeHead(200, { 'Content-Type': hosted.contentType }).end(hosted.body)
})
await new Promise<void>((resolve) => server.listen(4070, resolve))
// end-section-1

// start-section-2
const statusListUri = 'http://localhost:4070/status-lists/1'

const { statusList: statusListJwt } = await issuer.tokenStatusList.createTokenStatusList<'jwt'>({
  format: 'jwt',
  signer: { method: 'did', didUrl: issuerDidUrl },
  alg: 'EdDSA',
  // A new list has every entry set to 0 (valid)
  statusList: { statusListLength: 100_000, bitsPerStatus: 1 },
  statusListUri,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  // Seconds a verifier may cache the list
  timeToLive: 60 * 60,
})

hostedStatusLists.set('/status-lists/1', { contentType: 'application/statuslist+jwt', body: statusListJwt })
// end-section-2

// start-section-3
// Your app allocates the index and remembers which credential uses it
const statusListIndex = 4821

const credential = await issuer.sdJwtVc.sign({
  payload: {
    vct: 'https://credentials.example.com/identity',
    given_name: 'Jane',
    status: { status_list: { idx: statusListIndex, uri: statusListUri } },
  },
  issuer: { method: 'did', didUrl: issuerDidUrl },
  holder: { method: 'jwk', jwk: holderJwk },
  disclosureFrame: { _sd: ['given_name'] },
})
// end-section-3

// start-section-4
const validResult = await verifier.sdJwtVc.verify({ compactSdJwtVc: credential.compact })
console.log(validResult.isValid) // true
// end-section-4

// start-section-5
// Load the current token (from your own storage, or fetch it), then set the new status
const { statusList: currentToken } = await issuer.tokenStatusList.fetchTokenStatusList<'jwt'>({
  uri: statusListUri,
  acceptedFormats: ['jwt'],
})

const { statusList: updatedStatusListJwt } = await issuer.tokenStatusList.updateTokenStatusList<'jwt'>({
  format: 'jwt',
  token: currentToken,
  // 0 = valid, 1 = invalid (revoked), 2 = suspended. Needs `bitsPerStatus: 2` or more for 2.
  status: { index: statusListIndex, status: 1 },
  signer: { method: 'did', didUrl: issuerDidUrl },
  alg: 'EdDSA',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
})

hostedStatusLists.set('/status-lists/1', { contentType: 'application/statuslist+jwt', body: updatedStatusListJwt })
// end-section-5

// start-section-6
const revokedResult = await verifier.sdJwtVc.verify({ compactSdJwtVc: credential.compact })
if (revokedResult.isValid === false && 'code' in revokedResult.error) {
  // 'STATUS_INVALID'
  console.log(revokedResult.error.code)
}
// end-section-6

// start-section-7
// mdoc status lists are CWTs, signed with the issuer certificate
const issuerKey = await issuer.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
const issuerCertificate = await issuer.x509.createCertificate({
  authorityKey: PublicJwk.fromPublicJwk(issuerKey.publicJwk),
  issuer: { commonName: 'Example mDL Issuer', countryName: 'NL' },
})

const mdocStatusListUri = 'http://localhost:4070/status-lists/mdoc-1'
const { statusList: statusListCwt } = await issuer.tokenStatusList.createTokenStatusList<'cwt'>({
  format: 'cwt',
  signer: { method: 'x5c', x5c: [issuerCertificate] },
  alg: 'ES256',
  statusList: { statusListLength: 100_000, bitsPerStatus: 1 },
  statusListUri: mdocStatusListUri,
  // Required for mdoc
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
})
hostedStatusLists.set('/status-lists/mdoc-1', { contentType: 'application/statuslist+cwt', body: statusListCwt })

const mdoc = await issuer.mdoc.sign({
  docType: 'org.iso.18013.5.1.mDL',
  namespaces: { 'org.iso.18013.5.1': { family_name: 'Doe', issuing_country: 'NL' } },
  validityInfo: { validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  issuerCertificate,
  holderKey: holderJwk,
  statusInfo: { index: statusListIndex, uri: mdocStatusListUri },
})

const { statusList: updatedStatusListCwt } = await issuer.tokenStatusList.updateTokenStatusList<'cwt'>({
  format: 'cwt',
  token: statusListCwt,
  status: { index: statusListIndex, status: 1 },
  signer: { method: 'x5c', x5c: [issuerCertificate] },
  alg: 'ES256',
})
hostedStatusLists.set('/status-lists/mdoc-1', { contentType: 'application/statuslist+cwt', body: updatedStatusListCwt })

const mdocResult = await verifier.mdoc.verify(Mdoc.fromBase64Url(mdoc.base64Url), {
  trustedCertificates: [issuerCertificate.toString('pem')],
})
console.log(mdocResult.isValid) // false
// end-section-7

server.close()
await issuer.shutdown()
await holder.shutdown()
await verifier.shutdown()
