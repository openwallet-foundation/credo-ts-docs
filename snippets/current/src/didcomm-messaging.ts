import { actionMenuBundle } from '@credo-ts/drizzle-storage/action-menu'
import { didcommBundle } from '@credo-ts/drizzle-storage/didcomm'
import { drpcBundle } from '@credo-ts/drizzle-storage/drpc'
import { questionAnswerBundle } from '@credo-ts/drizzle-storage/question-answer'
import { exampleStorageWithAskarKeys } from './example-storage.js'

type ExampleStorage = Awaited<ReturnType<typeof exampleStorageWithAskarKeys>>

// start-section-1
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
// end-section-1

function waitFor<Event extends BaseEvent>(
  agent: ReturnType<typeof createAgent>,
  type: Event['type'],
  matches: (event: Event) => boolean
) {
  return new Promise<Event>((resolve) => {
    const listener = (event: Event) => {
      if (!matches(event)) return
      agent.events.off<Event>(type, listener)
      resolve(event)
    }
    agent.events.on<Event>(type, listener)
  })
}

const bundles = [didcommBundle, actionMenuBundle, questionAnswerBundle, drpcBundle]
const acme = createAgent(4040, await exampleStorageWithAskarKeys(bundles))
const bob = createAgent(4041, await exampleStorageWithAskarKeys(bundles))
await acme.initialize()
await bob.initialize()

const outOfBandRecord = await acme.didcomm.oob.createInvitation({ label: 'Acme' })
const { connectionRecord } = await bob.didcomm.oob.receiveInvitation(outOfBandRecord.outOfBandInvitation, {
  label: 'Bob',
})
if (!connectionRecord) throw new Error('The invitation has no handshake protocols')
const bobToAcme = await bob.didcomm.connections.returnWhenIsConnected(connectionRecord.id)
const [acmeToBobRecord] = await acme.didcomm.connections.findAllByOutOfBandId(outOfBandRecord.id)
const acmeToBob = await acme.didcomm.connections.returnWhenIsConnected(acmeToBobRecord.id)

// start-section-2
bob.events.on<DidCommBasicMessageStateChangedEvent>(
  DidCommBasicMessageEventTypes.DidCommBasicMessageStateChanged,
  ({ payload: { basicMessageRecord } }) => {
    // The event fires for sent and received messages
    if (basicMessageRecord.role !== DidCommBasicMessageRole.Receiver) return

    console.log(`Bob received: ${basicMessageRecord.content}`)
  }
)
// end-section-2
const bobReceivedMessage = waitFor<DidCommBasicMessageStateChangedEvent>(
  bob,
  DidCommBasicMessageEventTypes.DidCommBasicMessageStateChanged,
  ({ payload }) => payload.basicMessageRecord.role === DidCommBasicMessageRole.Receiver
)

// start-section-3
await acme.didcomm.basicMessages.sendMessage(acmeToBob.id, 'Your order has shipped')
// end-section-3
await bobReceivedMessage

// start-section-4
const history = await bob.didcomm.basicMessages.findAllByQuery({ connectionId: bobToAcme.id })
// end-section-4
console.log(`Bob has ${history.length} message(s) with Acme`)

// start-section-5
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
// end-section-5
const acmeReceivedAnswer = waitFor<QuestionAnswerStateChangedEvent>(
  acme,
  QuestionAnswerEventTypes.QuestionAnswerStateChanged,
  ({ payload }) => payload.questionAnswerRecord.state === QuestionAnswerState.AnswerReceived
)

// start-section-6
await acme.modules.questionAnswer.sendQuestion(acmeToBob.id, {
  question: 'Do you want to receive your membership credential?',
  detail: 'We will issue it right after you answer.',
  validResponses: [{ text: 'Yes' }, { text: 'No' }],
})
// end-section-6
await acmeReceivedAnswer

// start-section-7
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
// end-section-7
const acmeReceivedSelection = waitFor<ActionMenuStateChangedEvent>(
  acme,
  ActionMenuEventTypes.ActionMenuStateChanged,
  ({ payload }) => payload.actionMenuRecord.state === ActionMenuState.Done
)

// start-section-8
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
// end-section-8
await acmeReceivedSelection

// start-section-9
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
// end-section-9

// start-section-10
const waitForResponse = await bob.modules.drpc.sendRequest(bobToAcme.id, {
  jsonrpc: '2.0',
  method: 'getOrderStatus',
  params: { orderId: '1234' },
  id: 1,
})

// Resolves to undefined if no response arrives within 5000 ms
const response = await waitForResponse(5000)
// end-section-10
await handledRequest
console.log('Bob received the DRPC response:', JSON.stringify(response))

await acme.shutdown()
await bob.shutdown()
