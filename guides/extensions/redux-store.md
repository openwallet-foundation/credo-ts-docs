---
title: Redux store
description: Keep the state of a Credo 0.5 agent in a Redux Toolkit store with @credo-ts/redux-store.
---

:::warning

`@credo-ts/redux-store` 0.5.1, the latest release, requires Credo 0.5 (`@credo-ts/core@^0.5.0`) and hasn't been updated for later versions of Credo.

:::

`@credo-ts/redux-store` keeps the DIDComm state of a Credo agent in a [Redux Toolkit](https://redux-toolkit.js.org/) store, so the UI of a React or React Native app stays in sync with the agent. It has slices, thunks and selectors for connections, credentials, proofs and mediation. `initializeStore(agent)` creates the store, and `startRecordListeners` keeps it in sync with the agent's records.

## Install

```bash
npm install @credo-ts/redux-store@0.5.1
```
