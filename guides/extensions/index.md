---
title: Extensions
description: The Credo extension packages from credo-ts-ext, what each one does, and which Credo version they work with.
---

The [credo-ts-ext](https://github.com/openwallet-foundation/credo-ts-ext) repository hosts packages built on top of Credo that aren't part of the framework itself.

:::warning

All extension packages require Credo 0.5 (`@credo-ts/core@^0.5`) and don't work with the Credo version these docs describe. The pages in this section describe their 0.5 APIs.

:::

| Package | Latest release | Description |
| --- | --- | --- |
| [`@credo-ts/rest`](./rest.md) | 0.10.0 | A REST API and CLI around a Credo agent |
| [`@credo-ts/react-hooks`](./react-hooks.md) | 0.6.1 | React hooks for the records of a Credo agent |
| [`@credo-ts/redux-store`](./redux-store.md) | 0.5.1 | A Redux Toolkit store for the state of a Credo agent |
| [`@credo-ts/push-notifications`](./push-notifications.md) | 0.7.1 | DIDComm protocols to share an APNs or Firebase push notification token |
| [`@credo-ts/transport-ble`](https://github.com/openwallet-foundation/credo-ts-ext/tree/main/packages/transport-ble) | 0.3.0 | DIDComm over Bluetooth Low Energy for React Native |
