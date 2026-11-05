---
title: DIDs and DIDComm
description: What decentralized identifiers and DID documents are, and how DIDComm uses them for messaging between agents.
---

Credo uses DIDs to identify issuers, holders and the keys they sign with, and DIDComm to exchange messages between agents. This page explains the basics of both.

## DIDs

A [decentralized identifier](https://www.w3.org/TR/did-1.0/) (DID) is an identifier such as `did:web:issuer.example.com` that you can resolve to a DID document. You create DIDs yourself: no central party issues them.

The part after `did:` is the DID method. It defines where the document lives and how you create and update it:

- `did:key` and `did:jwk` encode a single public key in the DID itself. Nothing is published.
- `did:peer` is shared only with the other party of a DIDComm connection.
- `did:web` and `did:webvh` are published on a web server under your domain.
- `did:cheqd`, `did:indy` and `did:hedera` are anchored on a ledger.

[DIDs](../dids-and-trust/index.mdx) lists the methods Credo supports and shows how to create and resolve DIDs.

## DID documents

A DID document lists:

- Verification methods: the public keys of the DID.
- Verification relationships, which say what each key may be used for, for example `assertionMethod` to sign credentials, `authentication` to prove control of the DID, and `keyAgreement` to encrypt messages.
- Services, such as the endpoint where the DID controller receives DIDComm messages.

A verifier resolves the issuer's DID to get the key that signed a credential. Another agent resolves a DID to find out where and how to send it a message.

## DIDComm

[DIDComm](https://identity.foundation/didcomm-messaging/spec/) is a way for agents identified by DIDs to send each other messages. A message is encrypted for the recipient's `keyAgreement` key and sent to its service endpoint, over any transport, such as HTTP or WebSockets. Credo implements DIDComm Messaging v1, the version the Aries protocols use.

On top of this messaging layer, protocols define specific exchanges: setting up a connection with Out of Band and DID Exchange, issuing credentials, requesting proofs, mediation and basic messages. Credo also still includes the v1 versions of the Connection, Issue Credential and Present Proof protocols. They're deprecated and removed in 0.8, so use DID Exchange and the v2 protocols. A mobile wallet has no public endpoint, so it uses a mediator: an agent that receives and stores messages until the wallet picks them up.

You don't need DIDComm to use DIDs. OpenID4VC uses DIDs or X.509 certificates for keys, and HTTPS and OAuth 2.0 for transport. See [Verifiable credentials](./verifiable-credentials.mdx) for how the protocols compare, and [DIDComm](../protocols/didcomm/index.mdx) to set it up.
