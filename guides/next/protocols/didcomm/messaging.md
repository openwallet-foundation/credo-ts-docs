# Messaging and other protocols

> Send basic messages over a DIDComm connection, and add the action menu, question answer and DIDComm RPC protocols to a Credo agent.

Besides credentials and proofs, two connected agents can exchange plain text messages, menus, questions and remote procedure calls. Basic messages are built into `@credo-ts/didcomm`. The other three protocols come in separate packages. All examples on this page assume an Acme and a Bob agent with a [connection](https://credo.js.org/guides/next/protocols/didcomm/connections.md) between them.

## Basic messages

[Basic Message](https://github.com/hyperledger/aries-rfcs/tree/main/features/0095-basic-message) sends a text message over a connection, like a chat. The protocol is on by default.

```ts
await acme.didcomm.basicMessages.sendMessage(acmeToBob.id, 'Your order has shipped')
```

The receiving agent stores the message and emits an event:

```ts
bob.events.on<DidCommBasicMessageStateChangedEvent>(
  DidCommBasicMessageEventTypes.DidCommBasicMessageStateChanged,
  ({ payload: { basicMessageRecord } }) => {
    // The event fires for sent and received messages
    if (basicMessageRecord.role !== DidCommBasicMessageRole.Receiver) return

    console.log(`Bob received: ${basicMessageRecord.content}`)
  }
)
```

Every message, sent or received, is stored as a `DidCommBasicMessageRecord` with `content`, `sentTime`, `role` and `connectionId`. To load the history of a connection:

```ts
const history = await bob.didcomm.basicMessages.findAllByQuery({ connectionId: bobToAcme.id })
```

`sendMessage()` takes a thread id as third argument, to link the message to another thread with `~thread.pthid`. To turn the protocol off, pass `basicMessages: false` to the `DidCommModule`.

## Optional protocol packages

| Package | Protocol | Use it for |
| --- | --- | --- |
| `@credo-ts/question-answer` | [Question Answer 1.0](https://github.com/hyperledger/aries-rfcs/tree/main/features/0113-question-answer) | Asking a question with a fixed set of answers. |
| `@credo-ts/action-menu` | [Action Menu 1.0](https://github.com/hyperledger/aries-rfcs/tree/main/features/0509-action-menu) | Offering a menu of actions that the other agent can choose from. |
| `@credo-ts/drpc` | [DIDComm RPC 1.0](https://github.com/hyperledger/aries-rfcs/tree/main/features/0804-didcomm-rpc) | Sending JSON-RPC 2.0 requests and responses. |

Install the packages you need:

```bash
npm install @credo-ts/question-answer@alpha @credo-ts/action-menu@alpha @credo-ts/drpc@alpha
```

Register each one as an agent module next to the `DidCommModule`. Both agents in a conversation need the module. Its API is available under the key you register it with, for example `agent.modules.questionAnswer`.

```ts
import {
  ActionMenu,
  ActionMenuEventTypes,
  ActionMenuModule,
  ActionMenuRole,
  ActionMenuState,
  type ActionMenuStateChangedEvent,
} from '@credo-ts/action-menu'
import type { BaseEvent } from '@credo-ts/core'
import { Agent } from '@credo-ts/core'
import {
  DidCommBasicMessageEventTypes,
  DidCommBasicMessageRole,
  type DidCommBasicMessageStateChangedEvent,
  DidCommHttpOutboundTransport,
  DidCommModule,
} from '@credo-ts/didcomm'
import { DrpcModule } from '@credo-ts/drpc'
import { agentDependencies, DidCommHttpInboundTransport } from '@credo-ts/node'
import {
  QuestionAnswerEventTypes,
  QuestionAnswerModule,
  QuestionAnswerState,
  type QuestionAnswerStateChangedEvent,
} from '@credo-ts/question-answer'

function createAgent(port: number, storage: ExampleStorage) {
  return new Agent({
    dependencies: agentDependencies,
    modules: {
      ...storage, // Storage and key management, see Agent setup
      didcomm: new DidCommModule({
        endpoints: [`http://localhost:${port}`],
        transports: {
          inbound: [new DidCommHttpInboundTransport({ port })],
          outbound: [new DidCommHttpOutboundTransport()],
        },
        connections: { autoAcceptConnections: true },
      }),
      // Each package adds its API under the key you choose: agent.modules.actionMenu, ...
      actionMenu: new ActionMenuModule(),
      questionAnswer: new QuestionAnswerModule(),
      drpc: new DrpcModule(),
    },
  })
}
```

### Question answer

The questioner sends a question with the answers it accepts. The responder picks one of them.

```ts
await acme.modules.questionAnswer.sendQuestion(acmeToBob.id, {
  question: 'Do you want to receive your membership credential?',
  detail: 'We will issue it right after you answer.',
  validResponses: [{ text: 'Yes' }, { text: 'No' }],
})
```

The responder answers when the question arrives, and the questioner reads the answer from the record:

```ts
bob.events.on<QuestionAnswerStateChangedEvent>(
  QuestionAnswerEventTypes.QuestionAnswerStateChanged,
  async ({ payload: { questionAnswerRecord } }) => {
    if (questionAnswerRecord.state !== QuestionAnswerState.QuestionReceived) return

    console.log(`Acme asks: ${questionAnswerRecord.questionText}`)
    await bob.modules.questionAnswer.sendAnswer(questionAnswerRecord.id, 'Yes')
  }
)

acme.events.on<QuestionAnswerStateChangedEvent>(
  QuestionAnswerEventTypes.QuestionAnswerStateChanged,
  ({ payload: { questionAnswerRecord } }) => {
    if (questionAnswerRecord.state !== QuestionAnswerState.AnswerReceived) return

    console.log(`Bob answered: ${questionAnswerRecord.response}`)
  }
)
```

`sendAnswer()` throws if the response isn't one of the `validResponses`.

### Action menu

The responder sends a menu, the requester chooses an option, and the responder acts on the choice, for example by offering a credential. The requester can also ask for the menu with `requestMenu({ connectionId })`.

```ts
await acme.modules.actionMenu.sendMenu({
  connectionId: acmeToBob.id,
  menu: new ActionMenu({
    title: 'Acme services',
    description: 'What would you like to do?',
    options: [
      { name: 'get-membership', title: 'Get a membership credential', description: 'Issue a new credential' },
      { name: 'contact', title: 'Contact support', description: 'Start a chat with Acme' },
    ],
  }),
})
```

The requester shows the menu and performs the chosen action. The responder receives the selection in `performedAction`:

```ts
bob.events.on<ActionMenuStateChangedEvent>(
  ActionMenuEventTypes.ActionMenuStateChanged,
  async ({ payload: { actionMenuRecord } }) => {
    if (actionMenuRecord.state !== ActionMenuState.PreparingSelection || !actionMenuRecord.menu) return

    // A wallet would show the menu and let the user pick an option
    const [firstOption] = actionMenuRecord.menu.options
    await bob.modules.actionMenu.performAction({
      connectionId: actionMenuRecord.connectionId,
      performedAction: { name: firstOption.name },
    })
  }
)

acme.events.on<ActionMenuStateChangedEvent>(
  ActionMenuEventTypes.ActionMenuStateChanged,
  ({ payload: { actionMenuRecord } }) => {
    if (actionMenuRecord.role !== ActionMenuRole.Responder || actionMenuRecord.state !== ActionMenuState.Done) return

    console.log(`Bob selected: ${actionMenuRecord.performedAction?.name}`)
  }
)
```

An option can include a `form` with parameters. The requester then sends the values as `params` in the selection. `findActiveMenu({ connectionId, role })` returns the current menu of a connection, and `clearActiveMenu({ connectionId, role })` removes it. By default the module checks the state of the menu before each step. Pass `new ActionMenuModule({ strictStateChecking: false })` to skip that check.

### DIDComm RPC

DIDComm RPC carries [JSON-RPC 2.0](https://www.jsonrpc.org/specification) requests and responses over a connection. The server waits for a request and answers it:

```ts
async function handleNextRequest() {
  const incoming = await acme.modules.drpc.recvRequest()
  // Batch requests arrive as an array
  if (!incoming || Array.isArray(incoming.request)) return

  const { request, sendResponse } = incoming
  if (request.method === 'getOrderStatus') {
    await sendResponse({ jsonrpc: '2.0', id: request.id, result: { status: 'shipped' } })
  } else {
    await sendResponse({ jsonrpc: '2.0', id: request.id, error: { code: -32601, message: 'Method not found' } })
  }
}

// Start listening before the request can arrive
const handledRequest = handleNextRequest()
```

The client sends a request and gets a function that waits for the response:

```ts
const waitForResponse = await bob.modules.drpc.sendRequest(bobToAcme.id, {
  jsonrpc: '2.0',
  method: 'getOrderStatus',
  params: { orderId: '1234' },
  id: 1,
})

// Resolves to undefined if no response arrives within 5000 ms
const response = await waitForResponse(5000)
```

`recvRequest()` only returns the next request that arrives after you call it, from any connection. Call it again for every request you want to handle. Both `recvRequest()` and the function returned by `sendRequest()` take an optional timeout in milliseconds and resolve to `undefined` when it expires.
