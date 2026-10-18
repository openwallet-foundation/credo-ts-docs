// Which credential formats Credo can exchange over which protocols. Used by the
// landing page, the Supported standards page and the Markdown docs. The same for
// 0.7 and 0.8, except that 0.8 removes the DIDComm v1 protocols.

export type Support = 'yes' | 'no' | 'partial'

export interface ProtocolGroup {
  id: 'openid4vc' | 'mdoc' | 'didcomm'
  label: string
  docs: string
}

export interface ProtocolColumn {
  id: 'oid4vci' | 'oid4vp' | 'dcApi' | 'isoProximity' | 'isoDcApi' | 'didcommIssue' | 'didcommPresent'
  label: string
  group: ProtocolGroup['id']
  docs: string
}

export interface FormatRow {
  id: string
  label: string
  detail: string
  docs: string
  support: Record<ProtocolColumn['id'], Support>
  notes?: Partial<Record<ProtocolColumn['id'], string>>
}

export const protocolGroups: ProtocolGroup[] = [
  { id: 'openid4vc', label: 'OpenID4VC', docs: 'protocols/openid4vc' },
  { id: 'mdoc', label: 'ISO mdoc', docs: 'protocols/mdoc' },
  { id: 'didcomm', label: 'DIDComm', docs: 'protocols/didcomm' },
]

export const protocolColumns: ProtocolColumn[] = [
  { id: 'oid4vci', label: 'OpenID4VCI', group: 'openid4vc', docs: 'protocols/openid4vc/issuer' },
  { id: 'oid4vp', label: 'OpenID4VP', group: 'openid4vc', docs: 'protocols/openid4vc/verifier' },
  { id: 'dcApi', label: 'DC API', group: 'openid4vc', docs: 'protocols/dc-api' },
  { id: 'isoProximity', label: 'Proximity', group: 'mdoc', docs: 'protocols/mdoc/proximity' },
  { id: 'isoDcApi', label: 'DC API', group: 'mdoc', docs: 'protocols/dc-api' },
  { id: 'didcommIssue', label: 'Issue Credential v2', group: 'didcomm', docs: 'protocols/didcomm/issue-credential' },
  { id: 'didcommPresent', label: 'Present Proof v2', group: 'didcomm', docs: 'protocols/didcomm/present-proof' },
]

export const formatRows: FormatRow[] = [
  {
    id: 'sd-jwt-vc',
    label: 'SD-JWT VC',
    detail: 'dc+sd-jwt',
    docs: 'credential-formats/sd-jwt-vc',
    support: {
      oid4vci: 'yes',
      oid4vp: 'yes',
      dcApi: 'yes',
      isoProximity: 'no',
      isoDcApi: 'no',
      didcommIssue: 'no',
      didcommPresent: 'no',
    },
  },
  {
    id: 'mdoc',
    label: 'mdoc',
    detail: 'ISO 18013-5',
    docs: 'credential-formats/mdoc',
    support: {
      oid4vci: 'yes',
      oid4vp: 'yes',
      dcApi: 'yes',
      isoProximity: 'yes',
      isoDcApi: 'yes',
      didcommIssue: 'no',
      didcommPresent: 'no',
    },
    notes: { isoProximity: 'The BLE or NFC transport comes from a native module', isoDcApi: 'ISO/IEC 18013-7 Annex C' },
  },
  {
    id: 'w3c-jwt',
    label: 'W3C VC 1.1, JWT',
    detail: 'jwt_vc_json',
    docs: 'credential-formats/w3c-vc',
    support: {
      oid4vci: 'yes',
      oid4vp: 'yes',
      dcApi: 'yes',
      isoProximity: 'no',
      isoDcApi: 'no',
      didcommIssue: 'no',
      didcommPresent: 'yes',
    },
    notes: { didcommPresent: 'Through DIF Presentation Exchange' },
  },
  {
    id: 'w3c-ldp',
    label: 'W3C VC 1.1, JSON-LD',
    detail: 'ldp_vc',
    docs: 'credential-formats/w3c-vc',
    support: {
      oid4vci: 'partial',
      oid4vp: 'partial',
      dcApi: 'partial',
      isoProximity: 'no',
      isoDcApi: 'no',
      didcommIssue: 'yes',
      didcommPresent: 'yes',
    },
    notes: {
      oid4vci: 'Issuing between Credo agents needs workarounds',
      oid4vp: 'Presenting with DCQL fails when Credo creates the presentation',
      dcApi: 'Presenting with DCQL fails when Credo creates the presentation',
      didcommPresent: 'Through DIF Presentation Exchange',
    },
  },
  {
    id: 'w3c-v2-sd-jwt',
    label: 'W3C VC 2.0, SD-JWT',
    detail: 'vc+sd-jwt',
    docs: 'credential-formats/w3c-vc',
    support: {
      oid4vci: 'yes',
      oid4vp: 'yes',
      dcApi: 'yes',
      isoProximity: 'no',
      isoDcApi: 'no',
      didcommIssue: 'yes',
      didcommPresent: 'no',
    },
    notes: { didcommIssue: 'Aries RFC 0881' },
  },
  {
    id: 'w3c-v2-di',
    label: 'W3C VC 2.0, Data Integrity',
    detail: 'eddsa-jcs-2022',
    docs: 'credential-formats/w3c-vc',
    support: {
      oid4vci: 'no',
      oid4vp: 'no',
      dcApi: 'no',
      isoProximity: 'no',
      isoDcApi: 'no',
      didcommIssue: 'yes',
      didcommPresent: 'no',
    },
    notes: { didcommIssue: "The issuer doesn't verify the holder's binding proof" },
  },
  {
    id: 'anoncreds',
    label: 'AnonCreds',
    detail: 'CL signatures',
    docs: 'credential-formats/anoncreds',
    support: {
      oid4vci: 'no',
      oid4vp: 'no',
      dcApi: 'no',
      isoProximity: 'no',
      isoDcApi: 'no',
      didcommIssue: 'yes',
      didcommPresent: 'yes',
    },
  },
]

export const didMethods = [
  { method: 'did:key', package: '@credo-ts/core' },
  { method: 'did:jwk', package: '@credo-ts/core' },
  { method: 'did:peer', package: '@credo-ts/core' },
  { method: 'did:web', package: '@credo-ts/core' },
  { method: 'did:webvh', package: '@credo-ts/webvh' },
  { method: 'did:cheqd', package: '@credo-ts/cheqd' },
  { method: 'did:indy', package: '@credo-ts/indy-vdr' },
  { method: 'did:sov', package: '@credo-ts/indy-vdr' },
  { method: 'did:hedera', package: '@credo-ts/hedera' },
]

/** The support matrix as a Markdown table, for the Markdown versions of the docs. */
export function standardsMatrixMarkdown(docUrl: (docPath: string) => string): string {
  const mark = (support: Support) => ({ yes: 'Yes', partial: 'Partly', no: 'No' })[support]
  const groupLabel = (id: ProtocolGroup['id']) => protocolGroups.find((group) => group.id === id)?.label
  const header = `| Format | ${protocolColumns.map((column) => `${groupLabel(column.group)} ${column.label}`).join(' | ')} |`
  const divider = `| --- | ${protocolColumns.map(() => '---').join(' | ')} |`
  const rows = formatRows.map((row) => {
    const cells = protocolColumns.map((column) => {
      const note = row.notes?.[column.id]
      return note && row.support[column.id] !== 'no'
        ? `${mark(row.support[column.id])} (${note})`
        : mark(row.support[column.id])
    })
    return `| [${row.label}](${docUrl(row.docs)}) (\`${row.detail}\`) | ${cells.join(' | ')} |`
  })
  return [header, divider, ...rows].join('\n')
}
