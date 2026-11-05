# Credo documentation

> Build issuers, verifiers, wallets and mediators for verifiable credentials with Credo, an open source TypeScript framework.

Credo is an open source TypeScript framework for verifiable credentials. You use it to build issuers, verifiers, wallets and mediators that exchange SD-JWT VC, mdoc, W3C and AnonCreds credentials over OpenID4VC and DIDComm, on Node.js and React Native.

## Start here

[Choose your setup](https://credo.js.org/guides/getting-started.md#choose-your-setup) recommends a platform, protocol, credential format and storage to start with.

- [Installation](https://credo.js.org/guides/getting-started/installation.md): Set up a Node.js or React Native project and install Credo.
- [Your first agent](https://credo.js.org/guides/getting-started/first-agent.md): Configure storage and keys, initialize an agent and create a DID.
- [Verifiable credentials](https://credo.js.org/guides/concepts/verifiable-credentials.md): Issuers, holders and verifiers, and how protocols and formats fit together.
- [Example setups](https://credo.js.org/guides/getting-started/example-setups.md): Complete agent configurations for a mobile wallet, an issuer and verifier service, a multi-tenant service, a mediator and tests.

## Build by role

- [Issue credentials](https://credo.js.org/guides/protocols/openid4vc/issuer.md): Run an OpenID4VCI issuer and offer credentials to any compliant wallet.
- [Build a wallet](https://credo.js.org/guides/protocols/openid4vc/receive.md): Receive, store and present credentials from a mobile or cloud wallet.
- [Verify credentials](https://credo.js.org/guides/protocols/openid4vc/verifier.md): Request claims with DCQL and verify presentations with OpenID4VP.
- [Run a mediator](https://credo.js.org/guides/protocols/didcomm/mediation.md): Relay DIDComm messages for mobile wallets that can't receive them directly.

## Explore the docs

- [Agent setup](https://credo.js.org/guides/agent-setup.md): Storage, key management, caching, multi-tenancy and logging.
- [Protocols](https://credo.js.org/guides/protocols.md): OpenID4VC and DIDComm, role by role, and how to use each credential format with them.
- [Credential formats](https://credo.js.org/guides/credential-formats.md): SD-JWT VC, mdoc, W3C Verifiable Credentials, AnonCreds and status lists.
- [DIDs and trust](https://credo.js.org/guides/dids-and-trust.md): DID methods, X.509 certificates and deciding which issuers to trust.

## Use with AI coding agents

Point your coding agent at [llms.txt](https://credo.js.org/llms.txt), an index of these docs as Markdown. Every page is also available as Markdown by adding `.md` to its URL. See [AI coding agents](https://credo.js.org/guides/getting-started/ai-agents.md).

## Get help

Ask questions in the [#credo channel on Discord](https://discord.com/channels/1022962884864643214/1179453305856991263), open an issue on [GitHub](https://github.com/openwallet-foundation/credo-ts/issues), or join the [working group calls](https://github.com/openwallet-foundation/credo-ts/wiki/Meeting-Information).
