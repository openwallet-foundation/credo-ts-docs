# Getting started

> What you need to build with Credo, and the order to read the getting started pages in.

Credo is a TypeScript framework for issuing, holding and verifying verifiable credentials. It supports OpenID4VC and DIDComm, and formats such as SD-JWT VC, mdoc, W3C Verifiable Credentials and AnonCreds. This section takes you from an empty project to a running agent.

## Prerequisites

- Node.js 22 or later (Credo is tested on Node.js 22, 24 and 26), or React Native. These pages use Expo for React Native.
- A TypeScript project that uses ES modules. Credo is published as ES modules only.

Browsers aren't supported, and Bun and Deno aren't tested. See [Platforms](https://credo.js.org/guides/next/concepts/platform-and-environment.md).

## Choose your setup

Four choices come up before you write any code. If you're not sure, start with the default. You can add a protocol or format later, and an agent can use several at once.

| Choice | Default | Pick the other option when | Details |
| --- | --- | --- | --- |
| Platform | Node.js, for issuers, verifiers, mediators and cloud wallets | You build a mobile wallet: use React Native with Expo | [Platforms](https://credo.js.org/guides/next/concepts/platform-and-environment.md) |
| Protocol | OpenID4VC | Use DIDComm if you need a lasting connection with messaging between agents, or AnonCreds, or your ecosystem is built on Aries. A wallet can support both | [Protocols](https://credo.js.org/guides/next/protocols.md) |
| Credential format | SD-JWT VC | Your ecosystem asks for another one: mdoc for mobile driving licences, W3C VCs for Open Badges or EBSI, AnonCreds (DIDComm only) for predicates and unlinkable presentations. The EUDI Wallet uses SD-JWT VC and mdoc | [Credential formats](https://credo.js.org/guides/next/credential-formats.md) |
| Storage | On a server, Drizzle on PostgreSQL for the records, as SQL tables that scale to many tenants and instances, and Askar for the keys. In a mobile wallet, Askar for both | Use SQLite instead of PostgreSQL for a single server instance or local development. A mobile wallet can also use Drizzle on `expo-sqlite` | [Storage](https://credo.js.org/guides/next/agent-setup/storage.md) |

The getting started pages use Drizzle on SQLite with Askar for the keys on Node.js, and Askar on React Native. They work for any protocol and format.

## Read in this order

- [1. Installation](https://credo.js.org/guides/next/getting-started/installation.md): Set up a Node.js or Expo project and install Credo and its storage.
- [2. Your first agent](https://credo.js.org/guides/next/getting-started/first-agent.md): Create an agent, initialize it, create a DID and shut it down.
- [3. Example setups](https://credo.js.org/guides/next/getting-started/example-setups.md): Complete configurations for wallets, issuers, verifiers, mediators and tests.

## Where to go next

Once your agent runs, pick the guide for what you're building:

- [Issue credentials](https://credo.js.org/guides/next/protocols/openid4vc/issuer.md): Run an OpenID4VCI issuer that wallets receive credentials from.
- [Verify credentials](https://credo.js.org/guides/next/protocols/openid4vc/verifier.md): Request and verify presentations with OpenID4VP.
- [Build a wallet](https://credo.js.org/guides/next/protocols/openid4vc/receive.md): Receive, store and present credentials in a mobile or server wallet.
- [Use DIDComm](https://credo.js.org/guides/next/protocols/didcomm.md): Connect to other agents and exchange messages and credentials over DIDComm.

If you're new to verifiable credentials, start with [Concepts](https://credo.js.org/guides/next/concepts.md). If you use an AI coding assistant, see [AI coding agents](https://credo.js.org/guides/next/getting-started/ai-agents.md).
