---
title: REST API
description: Run a Credo 0.5 agent behind a REST API with the @credo-ts/rest CLI.
---

:::warning

`@credo-ts/rest` 0.10.0, the latest release, runs Credo 0.5 (`@credo-ts/core@^0.5.1`) and hasn't been updated for later versions of Credo.

:::

`@credo-ts/rest` runs a Credo agent behind HTTP endpoints, so you can create connections, issue credentials and request proofs from any language. It includes a CLI to start the server, a WebSocket or webhook feed of agent events, and optional multi-tenancy.

## Start the server

```bash
npx -p @credo-ts/rest@0.10.0 credo-rest start \
  --label "Credo Rest" \
  --wallet-id "walletId" \
  --wallet-key "walletKey" \
  --endpoint http://localhost:5000 \
  --admin-port 3000 \
  --outbound-transport http \
  --inbound-transport http 5000
```

The admin API listens on `--admin-port`, and DIDComm messages arrive on the inbound transport. The OpenAPI documentation is served with Swagger UI at `/docs` on the admin port, for example `http://localhost:3000/docs`.

Run `npx -p @credo-ts/rest@0.10.0 credo-rest start --help` to list all options, such as PostgreSQL storage, ledgers, auto-accept settings and webhooks.
