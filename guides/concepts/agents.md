---
title: Agents and modules
description: What a Credo agent is, how modules add functionality to it, and how agent contexts and tenants keep data apart.
---

Everything you do with Credo goes through an agent. This page explains what an agent holds, how modules extend it, and what agent contexts and tenants are.

## The agent

An agent is an instance of `Agent` from `@credo-ts/core`. It holds the configuration, the storage, the keys and the modules for one party, such as an issuer, a verifier, a wallet or a mediator. These roles all use the same `Agent` class. What an agent can do depends on the modules you register.

You pass three things to the constructor:

- `dependencies`: platform-specific dependencies, such as file system access and `fetch`. Import `agentDependencies` from `@credo-ts/node` or `@credo-ts/react-native`. See [Platforms](./platform-and-environment.md).
- `modules`: the modules to register, by key. A storage module is required.
- `config`: optional agent-wide settings, such as the logger.

```ts
const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({ askar: NativeAskar, store: { id: 'my-agent', key: 'my-agent-key' } }),
    openid4vc: new OpenId4VcModule(),
  },
})

await agent.initialize()
```

[Your first agent](../getting-started/first-agent.mdx) walks through this setup step by step.

## Modules

A module adds functionality to the agent: an API, services, storage records, and sometimes HTTP endpoints or message handlers. Credo is split into packages that each provide one or more modules, so you install only what you use.

- Default modules are always registered: among others DIDs, W3C credentials, SD-JWT VC, mdoc, X.509 and key management. You use them through properties such as `agent.dids`, `agent.sdJwtVc` and `agent.kms`. Register a module under the same key to configure it, for example `dids: new DidsModule({ ... })`.
- Other modules you register yourself, such as `AskarModule` for storage, `DidCommModule`, `OpenId4VcModule`, `AnonCredsModule` and `TenantsModule`. Their APIs are available under `agent.modules.<key>`.
- `DidCommModule` and `OpenId4VcModule` are also available as `agent.didcomm` and `agent.openid4vc`, but only when you register them under the keys `didcomm` and `openid4vc`.

The agent's type follows from the modules you pass, so TypeScript knows which APIs exist. [Agent configuration](../agent-setup/index.mdx) covers storage, key management, caching and logging.

## Agent context

Credo keeps the data of one wallet apart from others through an agent context. The context links storage, keys and configuration to an identifier, the `contextCorrelationId`. An agent has one root context. Credo passes the context along for you, so you only see it in callbacks, such as `getTrustedIssuersForVerification(agentContext, ...)`, and when you write your own modules.

## Tenants

With `@credo-ts/tenants`, one agent can host many tenants. Each tenant gets its own agent context, so its own storage and keys, while all tenants share the modules, configuration and transports of the root agent. This uses fewer resources than running an agent per tenant, which matters for hosted issuers, verifiers and cloud wallets. See [Multi-tenancy](../agent-setup/multi-tenancy.mdx).
