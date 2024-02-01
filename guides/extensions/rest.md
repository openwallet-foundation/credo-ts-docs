# REST API

The Credo REST API provides simple RESTful endpoints for Credo methods, to allow you stand up an agent for communication over the internet instantly. You simply provide your agent configuration. The REST endpoints allow you to interact with your agent over HTTP and WebSockets.

The Credo REST API is the most convenient way for self-sovereign identity (SSI) developers to interact with SSI agents.

- ⭐ **Endpoints** to create connections, issue credentials, and request proofs.
- 💻 **CLI** that makes it super easy to start an instance of the REST API.
- 🌐 **Interoperable** with all major Aries implementations.

:::danger

The `@credo-ts/rest` package has not been updated to work with the latest version (**`0.4.x`**) of `@credo-ts/core`. The documentation in this section is for version **`0.9.x`** of the `@credo-ts/rest` package, that works with `@credo-ts/core` version **`0.2.x`**. Extension packages (such as REST API) are versioned separately from the core packages.

:::

## Quick Setup

:::info

This guide assumes you have followed the install guides for the framework (See [Getting Started](../../getting-started/index.md) section) for your platform and a valid [Node.js](https://nodejs.org) project setup.

:::

Using the CLI is the easiest way to get started with REST API.

You can do this directly on your machine.

### Directly on computer

After installing and confirming that Libindy is installed, simply run:

```sh
npx -p @credo-ts/rest afj-rest start \
  --label "Credo Rest" \
  --wallet-id "walletId" \
  --wallet-key "walletKey" \
  --endpoint http://localhost:5000 \
  --admin-port 3000 \
  --outbound-transport http \
  --inbound-transport http 5000
```

The REST API provides an OpenAPI schema that can easily be viewed using the SwaggerUI that is provided with the server. The endpoint documentation can be viewed at the `/docs` endpoint (e.g. <http://localhost:3000/docs>).

### Configuration

To find out all available configuration options from the CLI, you can run the CLI command with `--help`. This will print a full list of all available options.

```sh
npx -p @credo-ts/rest afj-rest start --help
```
