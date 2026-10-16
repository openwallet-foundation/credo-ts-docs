// Runs the issuer, holder and verifier examples together:
// issue an SD-JWT VC with the pre-authorized code flow, then present it.
// start-section-1
import { holder, presentCredential, receiveCredential } from './openid4vc-holder.js'
import { createEmployeeBadgeOffer, issuer, issuerServer } from './openid4vc-issuer.js'
import { createEmployeeBadgeRequest, getEmployeeBadgeClaims, verifier, verifierServer } from './openid4vc-verifier.js'

// Issuer: create an offer for a known user
const { credentialOffer, txCode } = await createEmployeeBadgeOffer('employee-123')

// Holder: resolve the offer, enter the code, store the credential
await receiveCredential(credentialOffer, txCode)

// Verifier: request given_name and department
const { authorizationRequest, verificationSessionId } = await createEmployeeBadgeRequest()

// Holder: resolve the request and share the credential
await presentCredential(authorizationRequest)

// Verifier: read the verified claims
console.log(await getEmployeeBadgeClaims(verificationSessionId))
// end-section-1

await holder.shutdown()
await verifier.shutdown()
await issuer.shutdown()
verifierServer.close()
issuerServer.close()
