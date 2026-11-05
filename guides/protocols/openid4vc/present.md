# Presenting credentials

> Present stored credentials to a verifier with OpenID4VP from a Credo wallet on Node.js or React Native, with DCQL or Presentation Exchange.

This page covers the holder side of OpenID4VP: resolving a verifier's authorization request, showing the user what it asks for, and sending the response. It uses the holder agent from [Receiving credentials](https://credo.js.org/guides/protocols/openid4vc/receive.md#set-up-the-holder), which also trusts the verifier's certificate, and the SD-JWT VC it received there. The verifier side is in [Verifying credentials](https://credo.js.org/guides/protocols/openid4vc/verifier.md).

## Resolve the authorization request

A verifier sends an authorization request as a QR code or link (`openid4vp://...`). `resolveOpenId4VpAuthorizationRequest` fetches the request, verifies its signature and finds the stored credentials that match its DCQL query:

```ts
const resolvedRequest = await holder.openid4vc.holder.resolveOpenId4VpAuthorizationRequest(authorizationRequest)

// Who is asking, e.g. prefix 'x509_san_dns' and client id 'x509_san_dns:localhost'
const { clientIdPrefix, effectiveClientId } = resolvedRequest.verifier

const queryResult = resolvedRequest.dcql?.queryResult
if (!queryResult?.can_be_satisfied) throw new Error('Your stored credentials do not match the request')

// For each credential query: the matching credentials and the claims they would disclose
for (const [queryId, match] of Object.entries(queryResult.credential_matches)) {
  if (!match.success) continue
  for (const { record, claims } of match.valid_credentials) {
    console.log(queryId, record.type, claims.valid_claim_sets[0].output)
  }
}
```

`resolvedRequest.verifier` tells you who is asking. With `x509_san_dns` or `x509_hash` the request was signed with a certificate that the holder trusts, and resolving throws if it doesn't. With `decentralized_identifier` it was signed with a DID. With `redirect_uri` the request isn't signed, so anyone could have created it: show the user that the verifier is unverified, or reject such requests.

`queryResult.can_be_satisfied` is `false` when the holder doesn't have the credentials the verifier asks for. Otherwise `credential_matches` lists, for each credential query, the matching credentials and the claims each would disclose. Use it to show the user what they're about to share.

## Submit the response

After the user agrees, select the credentials and send the response:

```ts
// Picks the first matching credential for each query. Ask the user for consent before you submit.
const credentials = holder.openid4vc.holder.selectCredentialsForDcqlRequest(queryResult)

const result = await holder.openid4vc.holder.acceptOpenId4VpAuthorizationRequest({
  authorizationRequestPayload: resolvedRequest.authorizationRequestPayload,
  dcql: { credentials },
})

if (!result.ok) throw new Error(`The verifier rejected the response: ${JSON.stringify(result.serverResponse.body)}`)
```

`selectCredentialsForDcqlRequest` picks the first matching credential for each query and discloses only the requested claims. For credentials received in a batch it uses an unused instance while there is one (`useMode`, default `NewOrFirst`).

Credo posts the response to the verifier's response endpoint. If the verifier rejects it, the call doesn't throw: `result.ok` is `false` and `result.serverResponse` holds the verifier's answer. `result.redirectUri` is set when the verifier wants the user to continue on its website or app. Open it in the browser.

Verifiers that use an OpenID4VP draft may send a DIF Presentation Exchange definition instead of a DCQL query. Then `resolvedRequest.presentationExchange` is set instead of `dcql`: select with `selectCredentialsForPresentationExchangeRequest` and pass `presentationExchange: { credentials }` when accepting. For requests that include transaction data, see [SD-JWT VC with OpenID4VC](https://credo.js.org/guides/protocols/openid4vc/sd-jwt-vc.md#sign-transaction-data). For requests from a website through the browser, see [Digital Credentials API](https://credo.js.org/guides/protocols/dc-api/wallet.md).

## Next steps

- [SD-JWT VC with OpenID4VC](https://credo.js.org/guides/protocols/openid4vc/sd-jwt-vc.md) and [mdoc with OpenID4VC](https://credo.js.org/guides/protocols/openid4vc/mdoc.md): format details, such as transaction data.
- [Digital Credentials API](https://credo.js.org/guides/protocols/dc-api/wallet.md): answer requests that a website sends through the browser.
- [Trusted issuers](https://credo.js.org/guides/dids-and-trust/trust.md): decide which verifiers your wallet accepts.
