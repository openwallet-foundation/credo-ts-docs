---
title: Ecosystem
description: The Credo repositories, the libraries Credo builds on, and open source projects built with Credo.
---

Credo is a project of the [OpenWallet Foundation](https://openwallet.foundation). This page lists the repositories that make up Credo, the libraries it builds on, and projects built with it.

## Credo repositories

- [credo-ts](https://github.com/openwallet-foundation/credo-ts): the framework, published as the `@credo-ts/*` packages.
- [credo-ts-docs](https://github.com/openwallet-foundation/credo-ts-docs): this documentation.
- [credo-ts-ext](https://github.com/openwallet-foundation/credo-ts-ext): extension packages, such as a REST API, React hooks and push notifications. They haven't been updated for recent Credo versions. See [Extensions](../extensions/index.md).

## Libraries Credo builds on

Credo doesn't implement every standard itself. It uses these libraries:

| Library | Packages | Used for |
| --- | --- | --- |
| [Identity Common TS](https://github.com/openwallet-foundation-labs/identity-common-ts) | `@openid4vc/*` | OpenID4VCI, OpenID4VP and OAuth 2.0 |
| | `@sd-jwt/*` | SD-JWT and SD-JWT VC |
| | `@owf/mdoc`, `@owf/cose` | mdoc (ISO 18013-5) |
| | `@owf/token-status-list` | Token Status Lists |
| | `dcql` | Digital Credentials Query Language (DCQL) queries |
| [Askar](https://github.com/openwallet-foundation/askar) | `@openwallet-foundation/askar-*` ([wrapper](https://github.com/openwallet-foundation/askar-wrapper-javascript)) | Encrypted storage and key management |
| [AnonCreds](https://github.com/anoncreds/anoncreds-rs) | `@hyperledger/anoncreds-*` ([wrapper](https://github.com/anoncreds/anoncreds-wrapper-javascript)) | AnonCreds credentials |
| [Indy VDR](https://github.com/hyperledger-indy/indy-vdr) | `@hyperledger/indy-vdr-*` | Reading from and writing to Indy ledgers |

Askar, AnonCreds and Indy VDR are written in Rust. Their JavaScript wrappers have separate packages for Node.js and React Native.

## Built with Credo

- [Paradym](https://paradym.id): Animo's platform for issuing and verifying credentials, built on Credo.
- [Paradym Wallet](https://github.com/animo/paradym-wallet): an open source React Native wallet that uses Credo, made as a companion to Paradym.
- [Bifold](https://github.com/openwallet-foundation/bifold-wallet): an open source React Native wallet that uses Credo, which you can adapt to build your own wallet.
- [DIDComm Mediator Credo](https://github.com/openwallet-foundation/didcomm-mediator-credo): a DIDComm mediator built on Credo, with a Docker image you can deploy.

## Get involved

- Ask questions in the [Credo channel on Discord](https://discord.com/channels/1022962884864643214/1179453305856991263).
- Join the [Credo working group calls](https://github.com/openwallet-foundation/credo-ts/wiki/Meeting-Information).
- Read the [contributing guide](https://github.com/openwallet-foundation/credo-ts/blob/main/CONTRIBUTING.md) before you open a pull request.
