# Building a verifier

> Request credentials from a website with the W3C Digital Credentials API. A Credo backend creates OpenID4VP and ISO 18013-7 Annex C requests and verifies the response, and the web page calls the API in the browser.

A verifier for the Digital Credentials API has two parts: a Node.js backend with a Credo agent, which creates the requests and verifies the responses, and a web page that passes them through the browser. This page builds both. The example asks for the given name and age over 18 from an mDL, with OpenID4VP and with ISO 18013-7 Annex C (`org-iso-mdoc`) in one call, so wallets on Android and iOS can answer. [Digital Credentials API](https://credo.js.org/guides/protocols/dc-api.md) explains the flow and the choices.

## Set up the backend

```bash
npm install @credo-ts/core@^0.7.2 @credo-ts/node@^0.7.2 @credo-ts/openid4vc@^0.7.2 express
```

The agent also needs storage, see [Storage](https://credo.js.org/guides/agent-setup/storage.md). The backend creates the requests, verifies the responses, and serves the web page:

```ts
import { readFileSync } from 'node:fs'
import { Agent, ClaimFormat, X509Module } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
import express from 'express'

// The origin of the web page that calls the Digital Credentials API. This server serves the page.
const origin = 'http://localhost:4037'

const app = express()
// The web page, with the code from dc-api-verifier-browser.ts
app.use(express.static('public'))

const verifier = new Agent({
  config: {
    // Allows the http://localhost URLs of this example. Never enable this in production.
    allowInsecureHttpUrls: true,
  },
  dependencies: agentDependencies,
  modules: {
    ...storage, // Storage and key management, see Agent setup
    // Certificates (or root CAs) of the issuers you accept, as PEM or base64. For an mDL, the IACA certificates.
    x509: new X509Module({ trustedCertificates: [readFileSync('issuer-certificate.pem', 'utf8')] }),
    // Only needed for OpenID4VP. ISO 18013-7 Annex C uses `agent.mdoc`, which every agent has.
    openid4vc: new OpenId4VcModule({ app, verifier: { baseUrl: `${origin}/oid4vp` } }),
  },
})

await verifier.initialize()
const { verifierId } = await verifier.openid4vc.verifier.createVerifier()
```

- `origin` is the origin of the page that calls the API. Here the backend serves the page, so it's the backend's own origin.
- The verifier accepts credentials from the issuers in its trust configuration. See [Trusted issuers](https://credo.js.org/guides/dids-and-trust/trust.md).
- Only OpenID4VP needs `OpenId4VcModule`. If you only use `org-iso-mdoc`, leave it out.

## Create the requests

Create a request for each protocol you offer. Both ask for the same data elements:

**OpenID4VP**

```ts
async function createOpenId4VpRequest() {
  const { verificationSession, authorizationRequestObject } =
    await verifier.openid4vc.verifier.createAuthorizationRequest({
      verifierId,
      // Unsigned: the wallet identifies the verifier by the origin the browser passes on
      requestSigner: { method: 'none' },
      // Encrypt the response to the verifier
      responseMode: 'dc_api.jwt',
      dcql: {
        query: {
          credentials: [
            {
              id: 'mdl',
              format: 'mso_mdoc',
              meta: { doctype_value: 'org.iso.18013.5.1.mDL' },
              claims: [{ path: ['org.iso.18013.5.1', 'given_name'] }, { path: ['org.iso.18013.5.1', 'age_over_18'] }],
            },
          ],
        },
      },
    })

  // The page passes `request` to navigator.credentials.get()
  return { verificationSessionId: verificationSession.id, request: authorizationRequestObject }
}
```

- `responseMode` is `dc_api.jwt`, which encrypts the response to the verifier, or `dc_api`, which doesn't.
- An unsigned request (`method: 'none'`) has no client id. The wallet identifies the verifier as `origin:<origin>`.
- Return `authorizationRequestObject` to the page, not the `openid4vp://` URI in `authorizationRequest`. `authorizationResponseRedirectUri` can't be used, as the response goes back to the page.
- To request an SD-JWT VC instead, change the DCQL query (see [SD-JWT VC with OpenID4VC](https://credo.js.org/guides/protocols/openid4vc/sd-jwt-vc.md)) and pass only this request. Annex C only carries mdocs.

**ISO 18013-7 Annex C**

```ts
async function createIsoMdocRequest() {
  const { verificationSession, request } = await verifier.mdoc.createDcApiVerificationSession({
    docRequests: [
      {
        docType: 'org.iso.18013.5.1.mDL',
        // Element identifier mapped to intent to retain
        nameSpaces: { 'org.iso.18013.5.1': { given_name: false, age_over_18: false } },
      },
    ],
  })

  // The page passes `request` to navigator.credentials.get()
  return { verificationSessionId: verificationSession.id, request }
}
```

- `nameSpaces` maps each data element to its intent to retain. Pass `{ intentToRetain, optional, source }` instead of a boolean to accept a response without the element (`optional: true`), or with the element signed by the device instead of the issuer (`source: 'deviceSigned'` or `'any'`).
- By default the response must contain every requested element, issuer signed. With several `docRequests`, set `treatAmbiguousMultipleDocRequestsAsAlternatives` if one of them is enough. The flag isn't sent, so a wallet may still answer all of them.
- Each session has its own encryption key in the KMS, and expires after 5 minutes (`expiresInSeconds`).

The page gets both requests from one route:

```ts
// The page passes both requests in one call, and the wallet answers one of them
app.post('/dc-api/request', async (_request, response) => {
  response.json({ openid4vp: await createOpenId4VpRequest(), isoMdoc: await createIsoMdocRequest() })
})
```

### Sign the requests

Unsigned requests identify the verifier by its origin. To let wallets verify who you are beyond that, sign the request with a certificate whose key is in the verifier's KMS:

**OpenID4VP**

```ts
requestSigner: { method: 'x5c', x5c: [verifierCertificate], clientIdPrefix: 'x509_hash' },
expectedOrigins: [origin],
```

The wallet rejects a signed request when `expectedOrigins` doesn't include the origin the browser passed. On the page, use protocol `openid4vp-v1-signed`. [Verifying credentials](https://credo.js.org/guides/protocols/openid4vc/verifier.md#client-identifiers) explains the client identifier prefixes.

**ISO 18013-7 Annex C**

```ts
readerAuth: { certificate: readerCertificate, origin },
```

The signature covers one origin, so create a session per origin.

The wallet only accepts a signed request when it trusts your certificate or its CA.

## Verify the response

The page posts the response to the backend, which verifies it for the protocol the wallet answered:

**OpenID4VP**

```ts
async function verifyOpenId4VpResponse(verificationSessionId: string, data: Record<string, unknown>) {
  const { dcql } = await verifier.openid4vc.verifier.verifyAuthorizationResponse({
    verificationSessionId,
    authorizationResponse: data,
    origin,
  })

  const [mdl] = dcql?.presentations.mdl ?? []
  if (mdl?.claimFormat !== ClaimFormat.MsoMdoc) throw new Error('Expected an mdoc presentation')

  return mdl.issuerClaims['org.iso.18013.5.1.mDL']
}
```

With the `dc_api` response modes, Credo doesn't receive the response at its endpoint, so you pass it to `verifyAuthorizationResponse`. The result is the same as for other response modes, see [mdoc with OpenID4VC](https://credo.js.org/guides/protocols/openid4vc/mdoc.md) for reading mdoc claims.

**ISO 18013-7 Annex C**

```ts
async function verifyIsoMdocResponse(verificationSessionId: string, data: { response: string }) {
  const { deviceResponse } = await verifier.mdoc.verifyDcApiResponse({ verificationSessionId, response: data, origin })

  return deviceResponse.issuerClaims['org.iso.18013.5.1.mDL']
}
```

- Credo decrypts the response, verifies each mdoc (issuer signature and certificate chain, element digests, device signature, validity and status), and checks the response against the request. When an element is missing or isn't signed as required, it throws `MdocDeviceRequestNotSatisfiedError`, with the details in `deviceRequestMatch`.
- A response for an expired session throws `MdocVerificationSessionExpiredError`. Create a new request.
- `issuerClaims` has the disclosed elements per document type and namespace, `deviceClaims` the device-signed ones.

The route picks the protocol from the response:

```ts
app.post('/dc-api/response', express.json(), async (request, response) => {
  const { protocol, data, openid4vpSessionId, isoMdocSessionId } = request.body
  if (typeof openid4vpSessionId !== 'string' || typeof isoMdocSessionId !== 'string') {
    return response.status(400).end()
  }

  // Some browsers return the response as a JSON string
  const responseData = typeof data === 'string' ? JSON.parse(data) : data

  try {
    const claims =
      protocol === 'org-iso-mdoc'
        ? await verifyIsoMdocResponse(isoMdocSessionId, responseData)
        : await verifyOpenId4VpResponse(openid4vpSessionId, responseData)

    response.json(claims)
  } finally {
    // Also deletes the encryption key of the session, whichever request the wallet answered
    await verifier.mdoc.deleteVerificationSessionById(isoMdocSessionId)
  }
})

app.listen(4037)
```

- `origin` is the origin of your page. Use the value you know, never one from the request: verification fails for any other origin, which is what stops a relayed response.
- Credo doesn't delete mdoc verification sessions or their keys by itself. Delete each session with `deleteVerificationSessionById`, also when the wallet answered the OpenID4VP request or verification failed.

## Call the API from the browser

The web page gets the requests from the backend, passes them to `navigator.credentials.get()`, and posts the response back:

```ts
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
```

- The wallet answers one of the requests, and `credential.protocol` says which. Post `credential.data` to your backend as it is.
- TypeScript's DOM types don't have the `digital` option yet. The full example declares it.
- The call throws a `NotAllowedError` when the user cancels or no wallet has a matching credential. The browser doesn't say which, so a website can't find out what a wallet holds without the user's consent.

Call it when the user clicks a button:

```ts
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
```

The browser only opens the wallet shortly after a user action. A single request to your backend before the call is quick enough. For slower work, get the requests before the click. The API only exists in a secure context (`https`, or `http://localhost`) and in browsers that support it. Elsewhere, fall back to a QR code or a link, see [Verifying credentials](https://credo.js.org/guides/protocols/openid4vc/verifier.md).

## Full example

The backend serves the page from `public/`. Put the certificate of the issuer you trust in `issuer-certificate.pem`, then start it with `npx tsx dc-api-verifier.ts` and open `http://localhost:4037`.

**Backend**

```ts
// The verifier backend. It creates the requests that the web page in dc-api-verifier-browser.ts passes
// to the Digital Credentials API, and verifies the response the page posts back.

import { openid4vcBundle } from '@credo-ts/drizzle-storage/openid4vc'
import { exampleStorage } from './example-storage.js'

const storage = await exampleStorage([openid4vcBundle])

import { readFileSync } from 'node:fs'
import { Agent, ClaimFormat, X509Module } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { OpenId4VcModule } from '@credo-ts/openid4vc'
import express from 'express'

// The origin of the web page that calls the Digital Credentials API. This server serves the page.
const origin = 'http://localhost:4037'

const app = express()
// The web page, with the code from dc-api-verifier-browser.ts
app.use(express.static('public'))

const verifier = new Agent({
  config: {
    // Allows the http://localhost URLs of this example. Never enable this in production.
    allowInsecureHttpUrls: true,
  },
  dependencies: agentDependencies,
  modules: {
    ...storage, // Storage and key management, see Agent setup
    // Certificates (or root CAs) of the issuers you accept, as PEM or base64. For an mDL, the IACA certificates.
    x509: new X509Module({ trustedCertificates: [readFileSync('issuer-certificate.pem', 'utf8')] }),
    // Only needed for OpenID4VP. ISO 18013-7 Annex C uses `agent.mdoc`, which every agent has.
    openid4vc: new OpenId4VcModule({ app, verifier: { baseUrl: `${origin}/oid4vp` } }),
  },
})

await verifier.initialize()
const { verifierId } = await verifier.openid4vc.verifier.createVerifier()

async function createOpenId4VpRequest() {
  const { verificationSession, authorizationRequestObject } =
    await verifier.openid4vc.verifier.createAuthorizationRequest({
      verifierId,
      // Unsigned: the wallet identifies the verifier by the origin the browser passes on
      requestSigner: { method: 'none' },
      // Encrypt the response to the verifier
      responseMode: 'dc_api.jwt',
      dcql: {
        query: {
          credentials: [
            {
              id: 'mdl',
              format: 'mso_mdoc',
              meta: { doctype_value: 'org.iso.18013.5.1.mDL' },
              claims: [{ path: ['org.iso.18013.5.1', 'given_name'] }, { path: ['org.iso.18013.5.1', 'age_over_18'] }],
            },
          ],
        },
      },
    })

  // The page passes `request` to navigator.credentials.get()
  return { verificationSessionId: verificationSession.id, request: authorizationRequestObject }
}

async function createIsoMdocRequest() {
  const { verificationSession, request } = await verifier.mdoc.createDcApiVerificationSession({
    docRequests: [
      {
        docType: 'org.iso.18013.5.1.mDL',
        // Element identifier mapped to intent to retain
        nameSpaces: { 'org.iso.18013.5.1': { given_name: false, age_over_18: false } },
      },
    ],
  })

  // The page passes `request` to navigator.credentials.get()
  return { verificationSessionId: verificationSession.id, request }
}

// The page passes both requests in one call, and the wallet answers one of them
app.post('/dc-api/request', async (_request, response) => {
  response.json({ openid4vp: await createOpenId4VpRequest(), isoMdoc: await createIsoMdocRequest() })
})

async function verifyOpenId4VpResponse(verificationSessionId: string, data: Record<string, unknown>) {
  const { dcql } = await verifier.openid4vc.verifier.verifyAuthorizationResponse({
    verificationSessionId,
    authorizationResponse: data,
    origin,
  })

  const [mdl] = dcql?.presentations.mdl ?? []
  if (mdl?.claimFormat !== ClaimFormat.MsoMdoc) throw new Error('Expected an mdoc presentation')

  return mdl.issuerClaims['org.iso.18013.5.1.mDL']
}

async function verifyIsoMdocResponse(verificationSessionId: string, data: { response: string }) {
  const { deviceResponse } = await verifier.mdoc.verifyDcApiResponse({ verificationSessionId, response: data, origin })

  return deviceResponse.issuerClaims['org.iso.18013.5.1.mDL']
}

app.post('/dc-api/response', express.json(), async (request, response) => {
  const { protocol, data, openid4vpSessionId, isoMdocSessionId } = request.body
  if (typeof openid4vpSessionId !== 'string' || typeof isoMdocSessionId !== 'string') {
    return response.status(400).end()
  }

  // Some browsers return the response as a JSON string
  const responseData = typeof data === 'string' ? JSON.parse(data) : data

  try {
    const claims =
      protocol === 'org-iso-mdoc'
        ? await verifyIsoMdocResponse(isoMdocSessionId, responseData)
        : await verifyOpenId4VpResponse(openid4vpSessionId, responseData)

    response.json(claims)
  } finally {
    // Also deletes the encryption key of the session, whichever request the wallet answered
    await verifier.mdoc.deleteVerificationSessionById(isoMdocSessionId)
  }
})

app.listen(4037)
```

**Web page**

Compile the script into `public/`, for example with `npx esbuild dc-api-verifier-browser.ts --outdir=public`.

```html
<button>Verify with your wallet</button>
<script type="module" src="dc-api-verifier-browser.js"></script>
```

```ts
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
```

## Next steps

- [Building a wallet](https://credo.js.org/guides/protocols/dc-api/wallet.md): the other side of the flow.
- [Verifying credentials](https://credo.js.org/guides/protocols/openid4vc/verifier.md): OpenID4VP requests, client identifiers and verification sessions.
- [mdoc with OpenID4VC](https://credo.js.org/guides/protocols/openid4vc/mdoc.md) and [SD-JWT VC with OpenID4VC](https://credo.js.org/guides/protocols/openid4vc/sd-jwt-vc.md): request and read each format.
- [Trusted issuers](https://credo.js.org/guides/dids-and-trust/trust.md): decide which issuers you trust.
