# Extensions

> The cheqd, Hedera and Indy VDR ledger packages in credo-ts-ext, how they're versioned, and where the earlier extension packages moved.

The [credo-ts-ext](https://github.com/openwallet-foundation/credo-ts-ext) repository hosts packages built on top of Credo that aren't part of the framework itself. It holds the ledger integrations: DID methods and AnonCreds registries for public networks.

| Package | DID method | Description |
| --- | --- | --- |
| [`@credo-ts/cheqd`](https://credo.js.org/guides/next/extensions/cheqd.md) | `did:cheqd` | DIDs, DID-linked resources and an AnonCreds registry on cheqd |
| [`@credo-ts/hedera`](https://credo.js.org/guides/next/extensions/hedera.md) | `did:hedera` | DIDs and an AnonCreds registry on Hedera |
| [`@credo-ts/indy-vdr`](https://credo.js.org/guides/next/extensions/indy-vdr.md) | `did:indy` | DIDs, transaction endorsement and an AnonCreds registry on Hyperledger Indy networks |

The packages keep their `@credo-ts/*` names, but they're released from credo-ts-ext, so their versions don't follow Credo's. `@credo-ts/core` is a peer dependency: install a release whose peer dependency range includes your Credo version. Each package has an `/anoncreds` entry point for its AnonCreds registry, which needs `@credo-ts/anoncreds`, an optional peer dependency that you install yourself.

:::note

credo-ts-ext hasn't published releases for Credo 0.8 yet. Until it does, the `alpha` versions on npm are published from the Credo repository, and need the exact same alpha version of the other `@credo-ts/*` packages.

:::

## Moved and removed packages

credo-ts-ext used to host other packages, built for Credo 0.5. They moved to other repositories or were removed:

| Package | Now |
| --- | --- |
| `@credo-ts/push-notifications` | [`@credo-ts/didcomm-push-notifications`](https://github.com/openwallet-foundation/didcomm-mediator-credo/tree/main/packages/push-notifications) in DIDComm Mediator Credo |
| `@credo-ts/react-hooks` | [`@bifold/react-hooks`](https://github.com/openwallet-foundation/bifold-wallet/tree/main/packages/react-hooks) in Bifold |
| `@credo-ts/transport-ble` | [`@credo-ts/didcomm-transport-ble`](https://github.com/openwallet-foundation/credo-ts-didcomm-ext/tree/main/packages/transport-ble) in Credo DIDComm Extensions |
| `@credo-ts/rest` | Removed |
| `@credo-ts/redux-store` | Removed |

The [0.7 docs](/guides/extensions) describe their Credo 0.5 APIs.
