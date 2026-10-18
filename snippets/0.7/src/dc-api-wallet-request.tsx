// The request UI of the wallet: the `entry` file of the config plugin. The operating system shows it
// when the user picks a credential of this wallet for a website. It's bundled separately from the app,
// and on iOS runs in its own process, so it opens the wallet itself.

import { type DcApiRequest, registerDcApiScreen } from '@animo-id/expo-digital-credentials-api/request-handler'
import { useState } from 'react'
import { Button, Text, View } from 'react-native'
import { initializeWalletAgent } from './dc-api-wallet-agent.js'
import { createIsoMdocResponse, createOpenId4VpResponse } from './dc-api-wallet-response.js'

function DcApiScreen({ request }: { request: DcApiRequest }) {
  const [error, setError] = useState<string>()

  // start-section-1
  async function share() {
    // Always use the origin from the operating system. On Android it's undefined when an app asks
    // for itself instead of a website.
    const { origin } = request
    if (!origin) return request.decline('No website origin')

    const agent = await initializeWalletAgent()
    try {
      if (request.platform === 'ios') {
        // iOS only hands over the request once the user approved, and only as org-iso-mdoc
        const [isoMdocRequest] = await request.approve()
        return await request.respond(await createIsoMdocResponse(agent, isoMdocRequest, origin))
      }

      // On Android, the request that the credentials picked in the system picker were matched against
      const { requests, selection } = request
      const protocolRequest = requests[selection?.requestIndex ?? selection?.candidateRequestIndexes[0] ?? 0]
      if (!protocolRequest) return request.decline('No supported protocol')

      await request.respond(
        protocolRequest.protocol === 'org-iso-mdoc'
          ? await createIsoMdocResponse(agent, protocolRequest, origin)
          : await createOpenId4VpResponse(agent, protocolRequest, origin)
      )
    } catch (shareError) {
      // The request stays open, so the user can try again or decline
      setError(shareError instanceof Error ? shareError.message : String(shareError))
    } finally {
      await agent.shutdown()
    }
  }
  // end-section-1

  return (
    <View style={{ flex: 1, gap: 16, padding: 24, backgroundColor: 'white' }}>
      <Text>{request.origin ?? 'An app'} asks for:</Text>
      {/* On Android the system picker already showed the credential. iOS has no picker, so show
          what the operating system parsed from the request. */}
      {request.platform === 'ios' &&
        request.presentmentRequests
          .flatMap(({ documentRequestSets }) => documentRequestSets.flatMap((set) => set.documentRequests))
          .map(({ doctype, namespaces }) => (
            <Text key={doctype}>
              {doctype}: {Object.values(namespaces).flatMap(Object.keys).join(', ')}
            </Text>
          ))}
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <Button title="Share" onPress={share} />
      <Button title="Decline" onPress={() => request.decline()} />
    </View>
  )
}

// start-section-2
// The entry file registers the screen
export default registerDcApiScreen(DcApiScreen)
// end-section-2
