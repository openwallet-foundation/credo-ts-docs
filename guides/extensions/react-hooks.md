# React Hooks

The React Hooks package exposes useful React hooks that allow you to easily interact with AFJ from a React client application.

These hooks provide a simple way to query agent data in a client application, allowing you to focus on the user interface.

:::note

This document is for version **`0.5.x`** of the `@aries-framework/react-hooks` package, that works with `@aries-framework/core` version **`0.4.x`**. Extension packages (such as React Hooks) are versioned separately from the core packages.

:::

## Installation

To add the React Hooks package to your existing project simply run:

<!--tabs-->

## npm

```sh
npm i @aries-framework/react-hooks@^0.5
```

## Yarn

```sh
yarn add @aries-framework/react-hooks@^0.5
```

<!--/tabs-->

## Usage

This package exposes useful React hooks that allow you to easily interact with AFJ.

Everything exported from Hooks:

```ts
import AgentProvider, {
  useAgent,
  useConnections,
  useConnectionById,
  useCredentials,
  useCredentialById,
  useCredentialByState,
  useProofs,
  useProofById,
  useProofByState,
} from '@aries-framework/react-hooks'
```

First step is to wrap your entire app in our `<AgentProvider/>`. The provider takes an initialized agent. The base of your app should look something like this:

```tsx
import AgentProvider from '@aries-framework/react-hooks'

const App = () => {
  const [agent, setAgent] = useState(undefined)

  const initializeAgent = async () => {
    const appAgent = new Agent({
      /* agent options */
    })
    await appAgent.initialize()
    setAgent(appAgent)
  }

  useEffect(() => {
    initializeAgent()
  }, [])

  if (!agent) return <LoadingComponent />

  return <AgentProvider agent={agent}>/* Your app here */</AgentProvider>
}
```

And that's it! Your app should be set up to receive all the necessary data your app will need! Now let's see how we actually get that data to our components.

The `useAgent` hook returns `{ agent, loading }` so anytime you need access to any of the methods tied to the agent, you can `useAgent()` anywhere.

The following is an example of how you could use the `useConnections` hook to render a full list of all a user's connections.

```ts
import { useConnections } from '@aries-framework/react-hooks'

const MyConnectionsComponent = () => {
  // all base hooks return an array of objects and a loading boolean
  const { connections, loading } = useConnections()

  return <FlatList data={connections} renderItem={({ item }) => <MyListItem connection={item} />} />
}
```

The three base hooks: `useConnections`, `useCredentials`, and `useProofs` work just like the above! Just call the hook, destructure the data, and pass it through!

Each base hook has a `ById` version that returns a singular record. For example if I wanted only a specific connectionRecord, I'd do this.

```ts
const connection = useConnectionById(id)
```

More commonly, you'll want to get a filtered list of records based off of their state. Well, Hooray! We have a `ByState` version as well. For example, you can do this:

```ts
const credentials = useCredentialByState(CredentialState.OfferReceived)
```
