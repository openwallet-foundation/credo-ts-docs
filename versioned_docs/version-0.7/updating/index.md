---
title: Updating Credo
sidebar_label: Updating
description: How Credo versions work, the steps to update an agent to a new version, and the migration guide for each version.
---

This section explains how to update Credo to a newer version: what the version numbers mean, the steps to take, and a migration guide for each minor version.

## Versioning

Credo follows [semantic versioning](https://semver.org/), shifted one place to the right because it hasn't reached 1.0:

- A minor release (0.**6**.0 to 0.**7**.0) can contain breaking changes. Read its migration guide before you update.
- A patch release (0.7.**1** to 0.7.**2**) contains fixes and new features, and you can usually update without changes. Fixes for security issues or spec compliance can still change behavior, so check the changelog.

All `@credo-ts/*` packages are released together with the same version, and they depend on exact versions of each other. Always update them together, to the same version.

## How to update

1. Back up your storage. Credo doesn't create backups for you. With Askar, export the store with `exportStore` on the Askar API, or back up the PostgreSQL database.
2. Read the migration guide of every minor version you're moving past, in order. If you skip from 0.5 to 0.7, follow the 0.5 to 0.6 guide and then the 0.6 to 0.7 guide.
3. Update every `@credo-ts/*` package to the new version, together with the native dependencies the guide lists, and make the code changes from the guide.
4. Update the storage if the guide says the storage format changed. See below.

The [release notes](https://github.com/openwallet-foundation/credo-ts/releases) and package changelogs list every change, including new features the migration guides don't cover.

:::info

If you run into a breaking change that a migration guide doesn't mention, open an issue in the [Credo docs repository](https://github.com/openwallet-foundation/credo-ts-docs/issues).

:::

## Updating storage

Some versions change the format of stored records. Credo then needs to migrate the existing records before the agent can use them. When you call `agent.initialize()` and the storage is out of date, the agent throws an error instead of starting, so it can't corrupt your data.

You have two options:

- Set `autoUpdateStorageOnStartup: true` in the agent config. The agent updates the storage during `initialize()`. With `@credo-ts/tenants`, each tenant's storage is updated when a session for that tenant is opened.
- Run the [update assistant](./update-assistant.md) yourself, for example in a separate step before you start the new version.

Each migration guide says whether that version changes the storage. If you use [Drizzle](../agent-setup/storage/drizzle.mdx), new versions can also add SQL migrations, which you apply with the Drizzle migration tooling, separately from the update assistant.

## Migration guides

- [Updating from 0.6 to 0.7](./versions/0.6-to-0.7.mdx)
- [Updating from 0.5 to 0.6](./versions/0.5-to-0.6.md)
- [Updating from 0.4 to 0.5](./versions/0.4-to-0.5.md)
- [Updating from 0.3 to 0.4](./versions/0.3-to-0.4.md)
- [Updating from 0.2 to 0.3](./versions/0.2-to-0.3.md)
- [Updating from 0.1 to 0.2](./versions/0.1-to-0.2.md)
- [Updating from an Indy SDK wallet to Askar](./update-indy-sdk-to-askar.md)
