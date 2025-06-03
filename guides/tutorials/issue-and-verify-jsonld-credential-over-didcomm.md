# Issue and Verify a JSON-LD Credential over DIDComm

In this tutorial, we’ll walk through issuing a JSON-LD Verifiable Credential, signed by a Decentralized Identifier (DID), using Credo. The process begins with the _Holder_ proposing a credential and follows the full issuance flow over DIDComm, concluding with credential verification. We'll start by setting up both the _Issuer_ and _Holder_ agents with the minimal configuration needed for this walkthrough.

We assume that a DIDComm connection is already established between the _Issuer_ and _Holder_, and that the _Issuer_ has a registered DID with appropriate verification methods. The credential lifecycle covered includes:
proposal → offer → request → issuance → acknowledgment → verification.

_Using [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) with JSON-LD format and the [Issue Credential V2 Protocol](https://github.com/hyperledger/aries-rfcs/blob/main/features/0453-issue-credential-v2/README.md) and [Present Proof V2 Protocol](https://github.com/hyperledger/aries-rfcs/blob/main/features/0454-present-proof-v2/README.md)._

:::info

This tutorial assumes that

1. You have [set-up your development environment](../getting-started).
2. You have basic knowledge of the required fields in the [Agent Config](./agent-config).
3. You have completed the [Create a Connection tutorial](./create-a-connection).
4. You have a registered DID with appropriate verification methods (e.g., `did:cheqd`, `did:key`, or `did:web`).

:::

## 1. Setting up the agents

First, for both agents, we must setup and initialize an agent to work with. Depending on your target, [React Native](../getting-started/installation/react-native) or [Node.js](../getting-started/installation/react-native), it might vary.

In this tutorial both _Holder_ and _Issuer_ will be in a [Node.js environment](../getting-started/installation/nodejs).

### Issuer

For the _Issuer_, the setup requires additional modules for W3C credentials and JSON-LD processing. The issuer needs a DID with appropriate verification methods for signing credentials. In this example, we'll use an Ed25519 key with Ed25519Signature2018 proof type.

It is important for the _Issuer_ to have a resolvable DID with verification methods that can be used for credential signing. For this demo, we'll create a `did:cheqd` DID, but you can use other DID methods like `did:key` or `did:web`.

In order to reach the _Issuer_ we have to add a list of [`endpoints`](./agent-config#endpoints) of the agent that exposes the `inboundTransport` to the public. In the example below we add an `inboundTransport` and use port `3002`. For development purposes it is recommended to use a tunneling service for this, like [Ngrok](https://ngrok.com).

:::issuer

```typescript showLineNumbers issue-jsonld-credential-didcomm.ts section-1

```

:::

### Holder

For the _Holder_ we need to setup a basic agent with the same JSON-LD credential modules to handle W3C credentials.

:::holder

```typescript showLineNumbers issue-jsonld-credential-didcomm.ts section-2

```

:::

## 2. Setting up event listeners

Both agents need to listen for credential and proof events to handle the protocol flows automatically. The snippet below shows the functions which is same for both _Issuer_ and _Holder_. You can make them separate since not all events will be raised for both _Issuer_ and _Holder_.

### Credential Listeners

```typescript showLineNumbers issue-jsonld-credential-didcomm.ts section-3

```

### Proof Listeners

```typescript showLineNumbers issue-jsonld-credential-didcomm.ts section-4

```

## 3. Step 1: Holder proposes a credential to Issuer

This credential flow starts with _Holder_ proposing a credential they wants to receive from _Issuer_.

> In this example we do not instantiate a connection and assume that there is one. Please refer to this guide [Create a connection](./create-a-connection) to get a connection and connectionId.

:::holder

```typescript showLineNumbers issue-jsonld-credential-didcomm.ts section-5

```

:::

## 4. Steps 2-9: Automatic credential exchange flow

Once _Holder_ sends the proposal, the event listeners we set up will automatically handle the rest of the credential exchange:

1. **Step 2**: _Issuer_ waits for credential proposal from _Holder_ ✅ (handled by _Issuer_'s event listener)
2. **Step 3**: _Issuer_ sends credential offer to _Holder_ ✅ (handled by _Issuer_'s event listener)
3. **Step 4**: _Holder_ waits for credential offer from _Issuer_ ✅ (handled by _Holder_'s event listener)
4. **Step 5**: _Issuer_ waits for credential request from _Holder_ ✅ (handled by _Issuer_'s event listener)
5. **Step 6**: _Issuer_ sends credential to _Holder_ ✅ (handled by _Issuer_'s event listener)
6. **Step 7**: _Holder_ waits for credential from _Issuer_ ✅ (handled by _Holder_'s event listener)
7. **Step 8**: _Holder_ sends credential acknowledgment to _Issuer_ ✅ (handled by _Holder_'s event listener)
8. **Step 9**: _Issuer_ waits for credential acknowledgment from _Holder_ ✅ (handled by _Issuer_'s event listener)

## 5. Step 10: Issuer requests verification from Holder

After the credential has been successfully issued and stored, _Issuer_ can request a proof presentation from _Holder_ to verify the credential.

:::issuer

```typescript showLineNumbers issue-jsonld-credential-didcomm.ts section-6

```

:::

## Key Differences from AnonCreds

When working with JSON-LD credentials compared to AnonCreds, note these important differences:

1. **Credential Format**: JSON-LD credentials use the W3C Verifiable Credential Data Model with JSON-LD context.
2. **Proof Types**: Uses cryptographic proof types like Ed25519Signature2018, BbsBlsSignature2020, etc.
3. **DID Requirements**: Requires resolvable DIDs with appropriate verification methods.
4. **Verification**: Uses Presentation Exchange for proof requests instead of AnonCreds predicates.
5. **Privacy**: Less privacy-preserving than AnonCreds by default (no zero-knowledge proofs in the core data model).

## Useful resources

- [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)
- [JSON-LD](https://json-ld.org/)
- [Presentation Exchange](https://identity.foundation/presentation-exchange/)
- [Issue Credential V2 Protocol](https://github.com/hyperledger/aries-rfcs/blob/main/features/0453-issue-credential-v2/README.md)
- [Present Proof V2 Protocol](https://github.com/hyperledger/aries-rfcs/blob/main/features/0454-present-proof-v2/README.md)
- [DID Specification](https://www.w3.org/TR/did-core/)
