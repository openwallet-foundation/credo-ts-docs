import { AskarModule } from '@credo-ts/askar'
import { Agent, DateOnly, MdocRecord, TypedArrayEncoder } from '@credo-ts/core'
import { PublicJwk } from '@credo-ts/core/kms'
import { agentDependencies } from '@credo-ts/node'
import { NativeAskar } from '@openwallet-foundation/askar-nodejs'
import { createDeviceResponse, verifyDeviceResponse } from './mdoc-proximity.js'

// Plays both sides in one process: an issuer gives the wallet an mDL, the wallet answers a request,
// and a reader verifies the response.
function createAgent(id: string) {
  return new Agent({
    dependencies: agentDependencies,
    modules: {
      askar: new AskarModule({
        askar: NativeAskar,
        store: { id, key: id, database: { type: 'sqlite', config: { inMemory: true } } },
      }),
    },
  })
}

const issuer = createAgent('mdoc-proximity-issuer')
const wallet = createAgent('mdoc-proximity-wallet')
const reader = createAgent('mdoc-proximity-reader')
await issuer.initialize()
await wallet.initialize()
await reader.initialize()

const issuerKey = await issuer.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
const issuerCertificate = await issuer.x509.createCertificate({
  authorityKey: PublicJwk.fromPublicJwk(issuerKey.publicJwk),
  issuer: { commonName: 'Example mDL issuer', countryName: 'NL' },
})

const deviceKey = await wallet.kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })
const mdl = await issuer.mdoc.sign({
  docType: 'org.iso.18013.5.1.mDL',
  holderKey: PublicJwk.fromPublicJwk(deviceKey.publicJwk),
  issuerCertificate,
  validityInfo: { validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
  namespaces: {
    'org.iso.18013.5.1': {
      given_name: 'Erika',
      family_name: 'Mustermann',
      birth_date: new DateOnly('1984-01-26'),
      age_over_18: true,
      issuing_country: 'NL',
    },
  },
})
await wallet.mdoc.store({
  record: new MdocRecord({
    credentialInstances: [{ issuerSignedBase64Url: mdl.base64Url, kmsKeyId: deviceKey.keyId }],
  }),
})

// In a real exchange, the transport derives the session transcript during engagement and passes it to
// both sides. A fixed session transcript (with NFC handover) stands in for it here.
const sessionTranscript = TypedArrayEncoder.fromHex(
  'd81859024183d8185858a20063312e30018201d818584ba4010220012158205a88d182bce5f42efa59943f33359d2e8a968ff289d93e5fa444b624343167fe225820b16e8cf858ddc7690407ba61d4c338237a8cfcf3de6aa672fc60a557aa32fc67d818584ba40102200121582060e3392385041f51403051f2415531cb56dd3f999c71687013aac6768bc8187e225820e58deb8fdbe907f7dd5368245551a34796f7d2215c440c339bb0f7b67beccdfa8258c391020f487315d10209616301013001046d646f631a200c016170706c69636174696f6e2f766e642e626c7565746f6f74682e6c652e6f6f6230081b28128b37282801021c015c1e580469736f2e6f72673a31383031333a646576696365656e676167656d656e746d646f63a20063312e30018201d818584ba4010220012158205a88d182bce5f42efa59943f33359d2e8a968ff289d93e5fa444b624343167fe225820b16e8cf858ddc7690407ba61d4c338237a8cfcf3de6aa672fc60a557aa32fc6758cd91022548721591020263720102110204616301013000110206616301036e6663005102046163010157001a201e016170706c69636174696f6e2f766e642e626c7565746f6f74682e6c652e6f6f6230081b28078080bf2801021c021107c832fff6d26fa0beb34dfcd555d4823a1c11010369736f2e6f72673a31383031333a6e66636e6663015a172b016170706c69636174696f6e2f766e642e7766612e6e616e57030101032302001324fec9a70b97ac9684a4e326176ef5b981c5e8533e5f00298cfccbc35e700a6b020414'
)

// The decoded device request of the reader. The mDL has no portrait, so the wallet leaves it out.
const documentRequests = [
  {
    docType: 'org.iso.18013.5.1.mDL',
    nameSpaces: { 'org.iso.18013.5.1': { given_name: false, age_over_18: false, portrait: false } },
  },
]

const deviceResponse = await createDeviceResponse(wallet, { documentRequests, sessionTranscript })

const claims = await verifyDeviceResponse(reader, {
  deviceResponse,
  sessionTranscript,
  trustedCertificates: [issuerCertificate.toString('pem')],
})
console.log(claims)

await issuer.shutdown()
await wallet.shutdown()
await reader.shutdown()
