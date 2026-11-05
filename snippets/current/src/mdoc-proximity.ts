// start-section-1
import {
  type Agent,
  CredentialMultiInstanceUseMode,
  isNonEmptyArray,
  type Mdoc,
  MdocDeviceResponse,
  type MdocDocumentRequest,
  TypedArrayEncoder,
  useInstanceFromCredentialRecord,
} from '@credo-ts/core'
import { DeviceRequest } from '@owf/mdoc'

// The requested data elements per document type, with the reader's intent to retain each one
export function decodeDeviceRequest(deviceRequest: Uint8Array): MdocDocumentRequest[] {
  return DeviceRequest.decode(deviceRequest).docRequests.map(({ itemsRequest }) => ({
    docType: itemsRequest.docType,
    nameSpaces: Object.fromEntries(
      Array.from(itemsRequest.namespaces, ([nameSpace, elements]) => [nameSpace, Object.fromEntries(elements)])
    ),
  }))
}
// end-section-1

// start-section-2
export async function createDeviceResponse(
  agent: Agent,
  options: { documentRequests: MdocDocumentRequest[]; sessionTranscript: Uint8Array }
) {
  const mdocs: Mdoc[] = []
  const documentRequests: MdocDocumentRequest[] = []

  for (const { docType, nameSpaces } of options.documentRequests) {
    const [record] = await agent.mdoc.findAllByQuery({ docType })
    if (!record) continue

    // A new instance for every presentation, if the mdoc was issued in a batch
    const { credentialInstance: mdoc } = await useInstanceFromCredentialRecord({
      agentContext: agent.context,
      credentialRecord: record,
      useMode: CredentialMultiInstanceUseMode.NewOrFirst,
    })

    // Disclose the requested elements the mdoc has. Requesting an element it doesn't have fails.
    const issuerSigned = mdoc.issuerSignedNamespaces
    const disclosed = Object.fromEntries(
      Object.entries(nameSpaces).map(([nameSpace, elements]) => [
        nameSpace,
        Object.fromEntries(Object.entries(elements).filter(([element]) => element in (issuerSigned[nameSpace] ?? {}))),
      ])
    )

    mdocs.push(mdoc)
    documentRequests.push({ docType, nameSpaces: disclosed })
  }

  if (!isNonEmptyArray(mdocs)) throw new Error('No mdoc of the requested document types')

  const deviceResponse = await MdocDeviceResponse.createDeviceResponse(agent.context, {
    mdocs,
    documentRequests,
    sessionTranscriptOptions: { type: 'sessionTranscriptBytes', sessionTranscriptBytes: options.sessionTranscript },
  })

  // The encoded DeviceResponse, for the transport to encrypt and send
  return deviceResponse.deviceResponse.encode()
}
// end-section-2

// start-section-3
export async function verifyDeviceResponse(
  agent: Agent,
  options: { deviceResponse: Uint8Array; sessionTranscript: Uint8Array; trustedCertificates: string[] }
) {
  const deviceResponse = MdocDeviceResponse.fromBase64Url(TypedArrayEncoder.toBase64Url(options.deviceResponse))

  // Throws when the response is invalid. Doesn't use the agent's trust configuration.
  await deviceResponse.verify(agent.context, {
    trustedCertificates: options.trustedCertificates,
    sessionTranscriptOptions: { type: 'sessionTranscriptBytes', sessionTranscriptBytes: options.sessionTranscript },
  })

  return deviceResponse.issuerClaims
}
// end-section-3
