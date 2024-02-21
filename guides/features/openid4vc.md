# OpenID for Verifiable Credentials

Since Credo 0.4, support was added to receive credentials using OpenID for Verifiable Credential Issuance, and since 0.5 support was added for all the other OpenID for Verifiable Credential flows.

This means Credo has support for [OpenID for Verifiable Credential Issuance](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html), [OpenID for Verifiable Presentations](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html), and [Self-Issued OpenID Provider v2](https://openid.net/specs/openid-connect-self-issued-v2-1_0.html).

:::caution

Support for OpenID for Verifiable Credentials in Credo is still in an experimental phase, and thus is subject to breaking changes. Also, due to the early stages of these specifications, supported draft versions and flows may change and evolve. As early adopters it’s important to align with the evolving specs, and we are doing out best to keep up-to-date without breaking existing deployments.

Currently, work is ongoing to update the supported versions for OpenID4VC to the latest available Draft versions:

- OpenID for Verifiable Credential Issuance - Draft 12
- OpenID for Verifiable Presentations - Draft 20
- Self-Issued OpenID Provider - Draft 13

:::

## OpenID for Verifiable Credential Issuance

[OpenID for Verifiable Credential Issuance - Draft 11](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0-11.html) is supported, but only the immediate issuance using the Pre-Authorized Code flow. The deferred endpoint, batch endpoints and Authorized Code Flow are not supported at the moment.

## OpenID for Verifiable Presentations

[OpenID for Verifiable Presentations - Implementers Draft 1 (Draft 8)](https://openid.net/specs/openid-connect-4-verifiable-presentations-1_0-ID1.html) is supported for requesting and presenting verifiable presentations as part of an authorization request and response. OpenID for Verifiable Presentations is only supported in combination with Self-Issued OpenID Provider V2.

## Self-Issued OpenID Provider v2

[Self-Issued OpenID Provider V2 - Implementers Draft 1 (Draft 7)](https://openid.net/specs/openid-connect-self-issued-v2-1_0-ID1.html) is supported for allowing holders of credentials to act as their own OpenID Provider, and present credentials to a verifier without the need for a third party. Both SIOPv2 authentication requests and responses with verifiable presentations (using VP Token) or without (using ID Token for e.g. DID authentication) are supported.
