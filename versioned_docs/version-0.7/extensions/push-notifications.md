---
title: Push notifications
description: Share an APNs or Firebase push notification token with another agent over DIDComm, with @credo-ts/push-notifications for Credo 0.5.
---

:::warning

`@credo-ts/push-notifications` 0.7.1, the latest release, requires Credo 0.5 (`@credo-ts/core@^0.5.0`) and hasn't been updated for later versions of Credo.

:::

`@credo-ts/push-notifications` lets a mobile agent send its push notification token to another agent, usually its mediator, over a DIDComm connection. The other agent can then wake the app with a push notification when a message arrives. It implements [Aries RFC 0699](https://github.com/hyperledger/aries-rfcs/tree/main/features/0699-push-notifications-apns) for Apple Push Notification service (APNs) and [Aries RFC 0734](https://github.com/hyperledger/aries-rfcs/tree/main/features/0734-push-notifications-fcm) for Firebase Cloud Messaging (FCM).

## Install

```bash
npm install @credo-ts/push-notifications@0.7.1
```

## Send the device token

Register the module for each service you use:

```ts
import { Agent } from '@credo-ts/core'
import { PushNotificationsApnsModule, PushNotificationsFcmModule } from '@credo-ts/push-notifications'

const agent = new Agent({
  // ...config and dependencies
  modules: {
    pushNotificationsApns: new PushNotificationsApnsModule(),
    pushNotificationsFcm: new PushNotificationsFcmModule(),
  },
})

await agent.initialize()
```

Then send the token that you got from the operating system over a connection:

```ts
// iOS
await agent.modules.pushNotificationsApns.setDeviceInfo(connectionId, { deviceToken })

// Android, or iOS through Firebase
await agent.modules.pushNotificationsFcm.setDeviceInfo(connectionId, { deviceToken, devicePlatform: 'android' })
```

`getDeviceInfo(connectionId)` asks the other agent for the device info it has stored for the connection.
