// What Credo does in the wallet's request UI (dc-api-wallet-request.tsx): resolve the request for
// the origin the operating system passed, and create the response to hand back to it.
import type {
  IsoMdocProtocolRequest,
  IsoMdocResponseOptions,
  Openid4vpProtocolRequest,
  Openid4vpResponseOptions,
} from '@animo-id/expo-digital-credentials-api/request-handler'
import type { WalletAgent } from './dc-api-wallet-agent.js'

// start-section-1
export async function createOpenId4VpResponse(
  agent: WalletAgent,
  { protocol, data }: Openid4vpProtocolRequest,
  origin: string
): Promise<Openid4vpResponseOptions> {
  // The request arrives as a JSON string
  const resolved = await agent.openid4vc.holder.resolveOpenId4VpAuthorizationRequest(JSON.parse(data), { origin })
  if (!resolved.dcql?.queryResult.can_be_satisfied) throw new Error('No matching credentials')

  const { authorizationResponse } = await agent.openid4vc.holder.acceptOpenId4VpAuthorizationRequest({
    authorizationRequestPayload: resolved.authorizationRequestPayload,
    dcql: { credentials: agent.openid4vc.holder.selectCredentialsForDcqlRequest(resolved.dcql.queryResult) },
    origin,
  })

  // Answer with the protocol of the request
  return { protocol, data: authorizationResponse }
}
// end-section-1

// start-section-2
export async function createIsoMdocResponse(
  agent: WalletAgent,
  { data }: IsoMdocProtocolRequest,
  origin: string
): Promise<IsoMdocResponseOptions> {
  const resolved = await agent.mdoc.resolveDcApiRequest({ request: data, origin })
  if (!resolved.success || resolved.docRequestsAsAlternatives) throw new Error('No matching mdoc')

  const { response } = await agent.mdoc.createDcApiResponse({
    resolvedRequest: resolved,
    credentials: resolved.docRequests.map(({ docRequestIndex, validCredentials }) => ({
      docRequestIndex,
      record: validCredentials[0].record,
    })),
  })

  return { protocol: 'org-iso-mdoc', data: { response } }
}
// end-section-2
