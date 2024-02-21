# Decentralized Identifiers

[Decentralized identifiers](https://www.w3.org/TR/did-core/) are a core components of Credo, and used everywhere in the framework.

The base DID implementation allows all components within the framework (whether it be credential signing, sending messages over DIDComm, or verifying a SIOPv2 ID Token) to leverage DIDs. The pluggable DID Resolver and DID Registrar interfaces allow for easy extension of the supported DID methods.

In addition, any DID can be imported into the framework, meaning it can be used for signing of credentials and DIDComm, without needing a DID Registrar to register the DID.

## Supported DID Methods

Currently the following DID methods are supported by Credo:

| Method      | Note                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| `did:key`   |                                                                                                              |
| `did:jwk`   |                                                                                                              |
| `did:peer`  | Not supported for OpenID4VC                                                                                  |
| `did:web`   | No registrar available, but you can use the `DidDocumentBuilder` to build and later import the DID Document. |
| `did:cheqd` | Available through the `@credo-ts/cheqd` package.                                                             |
| `did:indy`  | Available through the `@credo-ts/indy-vdr` package.                                                          |
| `did:sov`   | Available through the `@credo-ts/indy-vdr` package.                                                          |
