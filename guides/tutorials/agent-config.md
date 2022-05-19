# Agent Config

temp file to keep the config, but not have it inside the `agent-setup` (we can
move this somewhere else, I just did not know where right now)

The Aries agent provided by [Aries Framework
JavaScript](https://github.com/hyperledger/aries-framework-javascript) is very
extensible. These are all the configuration options with a short description
(**bold** is required):

- **`label`**: The label as seen by other users when creating a connection
- `walletConfig`: configuration for the setup of the wallet. Including this
  makes sure the wallet is initialized when initializing the agent.
  - **`id`**: identifier string
  - **`key`**: TODO
  - `keyDerivationMethod`: What method to use for wallet key derivation
    - `KeyDerivationMethod.Argon2IMod`: Uses the argon2i modular
    - `KeyDerivationMethod.Argon2Int`: Uses argon2i int, less secure but faster
    - `KeyDerivationMethod.Raw`: Skip the derivation
  - `storage`: TODO
    - `type`: storage type
    - TODO: what is [key: string]: unknown here
- `endpoint`: The endpoint (schema + host + port) used for invitations
- `publicDidSeed`: The seed used for initializing the public DID of the agent.
  This does not register the DID on the ledger.
- `indyLedgers`: An array of indy ledgers to connect to. The list can contain
  the following object (it must include either the `genesisPath` or
  `genesisTransaction`):
  - **`id`**: identifier of the ledger
  - **`isProduction`**: Whether the ledger is a production ledger
  - `genesisPath`: filesystem path of the genesis transaction
  - `genesisTransaction`: stringified JSON object of the transaction
- `logger`: A logger instance that implements the `Logger` interface
- `didCommMimeType`: The mime-type used for sending and receiving messages
  - `DidCommMimeType.v0`: "application/ssi-agent-wire"
  - `DidCommMimeType.v1`: "application/didcomm-envelope-enc"
- `autoAcceptMediationRequests`: As a mediator, whether to automatically accept
  mediation requests. If disabled, the request should be manually accepted via
  the `mediatorModule`
- `mediationConnectionsInvitation`: Connection invitation used for the default
  mediator. If specified, the agent will; create a connection, request
  mediation and store the mediator as the default for all connections.
- `defaultMediatorId`: The mediator id used as the default mediator. This will
  override the default mediator.
- `clearDefaultMediator`: Whether to clear the default mediator
- `autoAcceptConnections`: Whether to auto accept connections
- `autoAcceptCredentials`: Whether to accept the incoming credentials
  - `AutoAcceptCredential.always`: Always auto accept the credential no matter
    the changes during the entire flow
  - `AutoAcceptCredential.contentApproved`: If no content changes one manual
    step is required, the rest is automated
  - `AutoAcceptCredential.Never`: Never auto accept a credential
- `autoAcceptProofs`: Whether to auto accept all incoming proof requests:
  - `AutoAcceptProof.always`: Always auto accept the proof requqest or proposal
    no matter the changes during the entire flow
  - `AutoAcceptProof.contentApproved`: If no content changes one manual step is
    required, the rest is automated
  - `AutoAcceptProof.Never`: Never auto accept a proof request of proposal

This can be quite daunting at first, but for most of these options, the default
what you want.
