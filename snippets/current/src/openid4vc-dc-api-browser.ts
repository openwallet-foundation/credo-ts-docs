// Runs in the browser, on the verifier's web page. Talks to the routes in openid4vc-dc-api.ts.

async function postJson(path: string, body: unknown = {}) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`${path} failed with status ${response.status}`)
  return response.json()
}

// start-section-1
// TypeScript's DOM types don't include the Digital Credentials API yet
type DigitalCredentialRequestOptions = CredentialRequestOptions & {
  digital: { requests: Array<{ protocol: string; data: unknown }> }
}

async function getDigitalCredential(protocol: string, data: unknown) {
  const options: DigitalCredentialRequestOptions = {
    mediation: 'required',
    digital: { requests: [{ protocol, data }] },
  }

  // The browser and the operating system let the user pick a wallet and a credential
  const credential = await navigator.credentials.get(options)
  if (!credential || !('data' in credential)) throw new Error('No digital credential returned')

  return credential.data
}
// end-section-1

// start-section-2
export async function verifyWithOpenId4Vp() {
  const { verificationSessionId, request } = await postJson('/dc-api/request')
  const data = await getDigitalCredential('openid4vp-v1-unsigned', request)

  return postJson('/dc-api/response', { verificationSessionId, data })
}
// end-section-2
