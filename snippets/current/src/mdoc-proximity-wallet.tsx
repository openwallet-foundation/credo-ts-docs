// A screen of a React Native wallet that presents mdocs to a reader in person. expo-mdoc-data-transfer
// handles the engagement and the transport, Credo the device response (mdoc-proximity.ts).

import type { Agent, MdocDocumentRequest } from '@credo-ts/core'
import { mdocDataTransfer, useMdocDataTransferShutdownOnUnmount } from 'expo-mdoc-data-transfer'
import { useState } from 'react'
import { Button, PermissionsAndroid, Platform, Text, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { createDeviceResponse, decodeDeviceRequest } from './mdoc-proximity.js'

interface ReaderRequest {
  documentRequests: MdocDocumentRequest[]
  sessionTranscript: Uint8Array
}

export function PresentInPersonScreen({ agent }: { agent: Agent }) {
  const [qrCode, setQrCode] = useState<string>()
  const [readerRequest, setReaderRequest] = useState<ReaderRequest>()

  // Ends the session when the user leaves the screen
  useMdocDataTransferShutdownOnUnmount()

  // start-section-1
  async function start() {
    await requestBluetoothPermissions()

    const transfer = mdocDataTransfer.instance()
    setQrCode(await transfer.startQrEngagement())
    // Also lets the reader engage with an NFC tap. Android only.
    transfer.enableNfc()

    // Resolves when a reader has scanned the QR code, connected over BLE and sent its request.
    // The module decrypts the request and derives the session transcript.
    const { deviceRequest, sessionTranscript } = await transfer.waitForDeviceRequest()
    setReaderRequest({ documentRequests: decodeDeviceRequest(deviceRequest), sessionTranscript })
  }
  // end-section-1

  // start-section-2
  async function share(request: ReaderRequest) {
    const transfer = mdocDataTransfer.instance()
    // The module encrypts the response with the session keys and sends it
    await transfer.sendDeviceResponse(await createDeviceResponse(agent, request))
    stop()
  }

  function stop() {
    mdocDataTransfer.instance().shutdown()
    setQrCode(undefined)
    setReaderRequest(undefined)
  }
  // end-section-2

  if (readerRequest) {
    return (
      <View style={{ gap: 16, padding: 24 }}>
        <Text>The reader asks for:</Text>
        {readerRequest.documentRequests.map(({ docType, nameSpaces }) => (
          <Text key={docType}>
            {docType}: {Object.values(nameSpaces).flatMap(Object.keys).join(', ')}
          </Text>
        ))}
        <Button title="Share" onPress={() => share(readerRequest)} />
        <Button title="Decline" onPress={stop} />
      </View>
    )
  }

  return (
    <View style={{ alignItems: 'center', gap: 16, padding: 24 }}>
      {qrCode ? <QRCode value={qrCode} size={250} /> : <Button title="Show QR code" onPress={start} />}
    </View>
  )
}

// start-section-3
// Android 12 and later need the Bluetooth permissions, earlier versions the location permissions
async function requestBluetoothPermissions() {
  if (Platform.OS !== 'android') return

  const { PERMISSIONS } = PermissionsAndroid
  await PermissionsAndroid.requestMultiple(
    Platform.Version >= 31
      ? [PERMISSIONS.BLUETOOTH_ADVERTISE, PERMISSIONS.BLUETOOTH_CONNECT, PERMISSIONS.BLUETOOTH_SCAN]
      : [PERMISSIONS.ACCESS_FINE_LOCATION, PERMISSIONS.ACCESS_COARSE_LOCATION]
  )
}
// end-section-3
