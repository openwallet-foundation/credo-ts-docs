# DIDs and DIDComm

### DIDs

[DIDs](https://www.w3.org/TR/did-core/), short for Decentralized identifiers,
are a type of identifier that enables verifiable, decentrilized identity. A DID
can refer to any subject, a person, organization, etc. DIDs are decoupled from
centralized registries, identity providers and certificate authorities.

### DID Documents

A DID by itself does not contain a lot of information. So in order to get some
metadata we have to resolve the DID to get a [DID
Document](https://www.w3.org/TR/did-core/#dfn-did-documents). With this
document we can get data such as their public key, proof mechanisms and their
service endpoints. This means that we can check the validity, encrypt
one-to-one messages and send it to their service endpoint.

### DIDComm

In the previous section sending a message to their service endpoint is
mentioned. This is a nice feature, but is lacking a definition of how it should
work. [DIDComm](https://identity.foundation/didcomm-messaging/spec/), we will
only discuss V1 here, defines this. DIDComm is designed to be private, secure,
transport-agnostic, interoperable and much more. This means that you can
securely send a message from as Alice to Bob securely via bluetooth, HTTP,
WebSockets, etc.

When working with the tools available inside the Aries JavaScript ecosystem,
deep knowledge of DIDComm is not required.

### Useful Resources

- [DID spec](https://www.w3.org/TR/did-core/)
- [DIDComm spec](https://identity.foundation/didcomm-messaging/spec/)
