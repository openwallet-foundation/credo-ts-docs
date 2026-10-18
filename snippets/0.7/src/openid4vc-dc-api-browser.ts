// Runs in the browser, on the verifier's web page. Talks to the routes in openid4vc-dc-api.ts.

// TypeScript's DOM types don't include the Digital Credentials API yet
type DigitalCredentialRequestOptions = CredentialRequestOptions & {
  digital: { requests: Array<{ protocol: string; data: unknown }> }
}

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
export async function verifyWithWallet() {
  const { verificationSessionId, request } = await postJson('/dc-api/request')

  const options: DigitalCredentialRequestOptions = {
    mediation: 'required',
    digital: { requests: [{ protocol: 'openid4vp-v1-unsigned', data: request }] },
  }

  // The browser and the operating system let the user pick a wallet and a credential.
  // Throws a NotAllowedError when the user cancels or no wallet has a matching credential.
  const credential = await navigator.credentials.get(options)
  if (!credential || !('data' in credential)) throw new Error('No digital credential returned')

  return postJson('/dc-api/response', { verificationSessionId, data: credential.data })
}
// end-section-1

// start-section-2
const button = document.querySelector('button')

// The API needs a secure context (https or localhost) and a browser that supports it
if (!('DigitalCredential' in window)) {
  button?.replaceWith('Your browser does not support the Digital Credentials API')
}

// The browser only opens the wallet in response to a user action, such as a click
button?.addEventListener('click', async () => {
  const claims = await verifyWithWallet()
  console.log(claims)
})
// end-section-2
