---
title: Platforms
description: The platforms Credo supports, Node.js and React Native, how its packages are published, and which runtimes aren't supported.
---

Credo runs on Node.js and React Native. This page describes what each platform is used for, what you need to know about how Credo is packaged, and which runtimes don't work. [Installation](../getting-started/installation.mdx) has the setup steps.

## Node.js

Use `@credo-ts/node` for agents that run on a server, such as issuers, verifiers and mediators. Credo requires Node.js 20.19 or later. It's tested on Node.js 22 and 24, so use one of those.

Some parts of Credo only run on Node.js: the DIDComm inbound transports from `@credo-ts/node`, and the OpenID4VC issuer and verifier, which serve their endpoints with Express.

## React Native

Use `@credo-ts/react-native` for mobile wallets. It needs `react-native-get-random-values`, `expo-crypto`, and a file system package (`@dr.pogodin/react-native-fs` or `react-native-fs`).

Askar, AnonCreds and Indy VDR are native modules. With Expo, that means you need a development build: Expo Go can't load them.

## ESM only

All `@credo-ts/*` packages are published as ES modules only. Use `import` in your code. A CommonJS project can still load them with `require()` on Node.js versions that support `require(esm)`, but ESM is recommended.

In TypeScript, set `moduleResolution` to `nodenext`, `node16` or `bundler`. Other settings don't read the `exports` field of `package.json`, so subpath imports such as `@credo-ts/anoncreds/didcomm` don't resolve.

## Package versions

All `@credo-ts/*` packages are released together and depend on exact versions of each other. Install the same version of every Credo package you use.

## Other runtimes

- Browsers aren't supported. Credo has no storage, key management or platform dependencies for the browser, and the OpenID4VC issuer and verifier depend on Express.
- Bun, Deno and Electron aren't tested. Credo's CI only runs on Node.js. They may work through their Node.js compatibility, but there's no guarantee.
