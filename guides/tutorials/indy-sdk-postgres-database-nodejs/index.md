# Using PostgreSQL as Database for Indy SDK in Node.js

By default the Indy SDK will use an SQLite database for storage. In mobile environments this is sufficient and allows us to keep storage local to the device, but in server environments we oftentimes want a more scalable storage solution. By leveraging the PostgreSQL plugin for Indy SDK we can use PostgreSQL as a storage solution instead of SQLite.

This document describes the installation process of the Postgres plugin for IndySDK and how you need to configure AFJ to use it.

## Installation of the Postgres Plugin

For installation of the Postgres plugin, please refer to the platform specific guides:

- [macOS](./macos.md)
- [Linux](./linux.md)
- [Windows](./windows.md)

## Using the Postgres Plugin in AFJ

```typescript showLineNumbers set-up-indy-sdk-postgres.ts section-1

```
