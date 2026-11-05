---
title: React hooks
description: Read the connections, credentials and proofs of a Credo 0.5 agent in React with @credo-ts/react-hooks.
---

:::warning

`@credo-ts/react-hooks` 0.6.1, the latest release, requires Credo 0.5 (`@credo-ts/core@^0.5.0`) and hasn't been updated for later versions of Credo.

:::

`@credo-ts/react-hooks` exposes the DIDComm records of a Credo agent, such as connections, credential exchanges and proof exchanges, as React hooks that update when the records change.

## Install

```bash
npm install @credo-ts/react-hooks@0.6.1 @credo-ts/question-answer@^0.5
```

`@credo-ts/question-answer` is a peer dependency.

## Use the hooks

Wrap your app in `AgentProvider` and pass it an initialized agent:

```tsx
import type { Agent } from '@credo-ts/core'
import AgentProvider from '@credo-ts/react-hooks'

export function App({ agent }: { agent: Agent }) {
  return <AgentProvider agent={agent}>{/* your app */}</AgentProvider>
}
```

Inside the provider, `useAgent()` returns `{ agent, loading }`, and the record hooks return the records and a `loading` flag:

```tsx
import { useConnections } from '@credo-ts/react-hooks'

function ConnectionList() {
  const { records: connections, loading } = useConnections()

  return <FlatList data={connections} renderItem={({ item }) => <ConnectionItem connection={item} />} />
}
```

`useConnections`, `useCredentials`, `useProofs` and `useBasicMessages` each have variants that select records, such as `useConnectionById(id)`, `useCredentialByState(state)` and `useProofsByConnectionId(connectionId)`. See the [package source](https://github.com/openwallet-foundation/credo-ts-ext/blob/main/packages/react-hooks/src/index.ts) for the full list.
