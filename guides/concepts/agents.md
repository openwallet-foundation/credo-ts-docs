# Agents

When working with any Credo implementation, you will interact with an Credo
agent. This will be either directly or via a REST API, like [the Credo
framework REST
API](https://github.com/openwallet-foundation/credo-ts-ext/tree/main/packages/rest).

### Characteristics

An Credo agent has three essential characteristics:

1. It acts as a fiduciary on behalf of a single identity owner (or, for agents
   of things like IoT devices, pets, and similar things, a single controller).
1. It holds cryptographic keys that uniquely embody its delegated
   authorization.
1. It interacts using interoperable DIDComm protocols, more on that later.

What this means is that an Credo agent will act your behalf to issue create
connections, issue credentials, send messages etc. It also have a cryptographic
toolkit with which it can uniquely, securely and verifiably operate. And lastly
it interacts with other entities, this could be another agent, via [DIDComm
protocols](https://identity.foundation/didcomm-messaging/spec/) later on. The
Credo agent in the context of the Credo ecosystem is your entry-point
to all of the functionality.

### Categories

There are many categories of Credo agents and we will group them into two
categories; a mobile agent and a cloud agent. These agents are grouped based on
their "location", e.g. a mobile wallet or server. Some other categories are a
static, thin, thick and rich Credo agents. These agents are grouped based on
their complexity instead of their "location". The Credo ecosystem
allows you to create a mobile agent and a cloud agent. It also allows any of
the complexity categorized agents.

### Examples

Some examples of things that are Credo agent-like (since the definition can be
bit loose, these examples might help to get a clearer picture):

**A mobile wallet**

A mobile wallet, like
[aries-mobile-agent-react-native](https://github.com/hyperledger/aries-mobile-agent-react-native)
, can be used to create connections, send basic messages, hold credentials,
etc. In the real world this could be an application that contains data like an
official drivers license.

**An Identity hub**

An [Identity Hub](https://didproject.azurewebsites.net/docs/hub-overview.html)
is a personal data store that gives complete control to their owner. It allows
for secure sensitive data storage and sharing. Since everyone has multiple
devices these can be used as a more central point for your data.

### Useful resources

- [Hyperledger Aries RFC - 004:
  Agents](https://github.com/hyperledger/aries-rfcs/blob/main/concepts/0004-agents/README.md)
