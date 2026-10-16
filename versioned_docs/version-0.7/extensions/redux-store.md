---
title: Redux Store
---

# Redux Store

:::caution

`@credo-ts/redux-store` 0.5.1, the latest release, requires Credo 0.5 (`@credo-ts/core@^0.5.0`) and hasn't been updated for later versions of Credo.

:::

The Redux Store is an implementation of state management that can be used to build React & React Native SSI clients using Credo.

The Redux Store allows you to integrate state management for the most important parts of using Credo in a client application (mediation, connections, credentials and proofs), allowing you to sync UI state with the state of the agent as it interacts with other agents through the framework.

:::note

This document is for version **`0.4.x`** of the `@credo-ts/redux-store` package, that works with `@credo-ts/core` version **`0.4.x`**. Extension packages (such as Redux Store) are versioned separately from the core packages.

:::

## Installation

To add the Redux Store package to your existing project simply run:

<Tabs>

<TabItem value="npm" label="npm">

```bash
npm i @credo-ts/redux-store
```

</TabItem>

<TabItem value="yarn" label="Yarn">

```bash
yarn add @credo-ts/redux-store
```

</TabItem>

</Tabs>
