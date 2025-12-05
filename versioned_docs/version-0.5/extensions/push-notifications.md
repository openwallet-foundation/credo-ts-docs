# Push Notifications

The Push Notifications plugin package provides a way for you to register your APNs and Firebase push notification token at an agent, allowing you to use push notifications directly from Credo.

:::note

This document is for version **`0.5.x`** of the `@credo-ts/push-notifications` package, that works with `@credo-ts/core` version **`0.4.x`**. Extension packages (such as Push Notifications) are versioned separately from the core packages.

:::

## Installation

To add the Push Notifications plugin package to your existing project simply run:

<!--tabs-->

## npm

```sh
npm i @credo-ts/push-notifications
```

## Yarn

```sh
yarn add @credo-ts/push-notifications
```

<!--tabs-->

## Usage

```ts
import { PushNotificationsApnsModule, PushNotificationsFcmModule } from '@credo-ts/push-notifications'
import {  } from '@credo-ts/core'

const agent = new Agent({
    /** agent config... */,
    // Register the modules
    modules: {
        pushNotificationsApns: new PushNotificationsApnsModule(),
        pushNotificationsFcm: new PushNotificationsFcmModule(),
    },
    }
})

await agent.initialize()

/* -- iOS -- */

// To send apns device info to another agent you have to acquire the device token and send it.
await agent.modules.pushNotificationsApns.sendDeviceInfo(
  'a-valid-connection-id'
  { deviceToken: '123' },
)

// To get the device info and the used service back from the other agent
await agent.modules.pushNotificationsApns.getDeviceInfo('a-valid-connection')

/* -- fcm / Android -- */

// To send fcm, primarily Android, device info to another agent you have to acquire the device token and send it.
await agent.modules.pushNotificationsFcm.sendDeviceInfo(
  'a-valid-connection-id'
  { deviceToken: '123' },
)

// To get the device info and the used service back from the other agent
await agent.modules.pushNotificationsFcm.getDeviceInfo('a-valid-connection')

```
