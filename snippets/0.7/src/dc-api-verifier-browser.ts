// Runs in the browser, on the verifier's web page. Talks to the routes in dc-api-verifier.ts.

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
  const { openid4vp, isoMdoc } = await postJson('/dc-api/request')

  const options: DigitalCredentialRequestOptions = {
    mediation: 'required',
    digital: {
      requests: [
        // Use 'openid4vp-v1-signed' for a signed request
        { protocol: 'openid4vp-v1-unsigned', data: openid4vp.request },
        { protocol: 'org-iso-mdoc', data: isoMdoc.request },
      ],
    },
  }

  // The browser and the operating system let the user pick a wallet and a credential.
  // Throws a NotAllowedError when the user cancels or no wallet has a matching credential.
  const credential = await navigator.credentials.get(options)
  if (!credential || !('data' in credential) || !('protocol' in credential)) {
    throw new Error('No digital credential returned')
  }

  return postJson('/dc-api/response', {
    // The protocol of the request the wallet answered
    protocol: credential.protocol,
    data: credential.data,
    openid4vpSessionId: openid4vp.verificationSessionId,
    isoMdocSessionId: isoMdoc.verificationSessionId,
  })
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
