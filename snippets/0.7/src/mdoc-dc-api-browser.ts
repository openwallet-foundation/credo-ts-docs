// Runs in the browser, on the verifier's web page. Talks to the routes in mdoc-dc-api.ts.

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

export async function requestMdl() {
  const { verificationSessionId, request } = await postJson('/mdoc/request')

  const options: DigitalCredentialRequestOptions = {
    mediation: 'required',
    digital: { requests: [{ protocol: 'org-iso-mdoc', data: request }] },
  }

  // The browser and the operating system let the user pick a wallet and an mdoc
  const credential = await navigator.credentials.get(options)
  if (!credential || !('data' in credential)) throw new Error('No digital credential returned')

  return postJson('/mdoc/response', { verificationSessionId, data: credential.data })
}
// end-section-1
