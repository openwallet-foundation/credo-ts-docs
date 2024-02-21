# Verifiable Credentials

One of the main features of Credo is the issuance and verification of Verifiable Credentials.

## W3C Verifiable Credentials

[W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) are probably the most widely known credential format, and defined the World Wide Web Consortium (W3C).

Credo currently supports the issuance and verification of W3C Verifiable Credentials according to the **Data Model v1.1**, and support both the **Linked Data Proof** and **Json Web Token (JWT)** proof formats.

**Issuance of W3C JWT credentials is not supported over DIDComm**, while verification **is supported**

## SD-JWT VC

Selective Disclosure JWT Verifiable Credentials are a special type of JWT Verifiable Credentials, that allow for selective disclosure of the claims in the credential.

Credo currently supports [SD-JWT-based Verifiable Credentials (SD-JWT VC) - Draft 01](https://www.ietf.org/archive/id/draft-ietf-oauth-sd-jwt-vc-01.html).

**Issuance of SD-JWT credentials is not supported over DIDComm**, while verification **is supported**.

## AnonCreds

Credo supports the issuance and verification of [AnonCreds](https://hyperledger.github.io/anoncreds-spec/) credentials. AnonCreds credentials are a bit 'heavier' to implement and support than other credential formats, but allow for the best unlinkability.

Issuance and verification of AnonCreds credentials is **only available over DIDComm**.
