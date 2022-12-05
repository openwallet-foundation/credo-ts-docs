# Setup

> This guide assumes you have followed the install guides for the framework
> (See `Getting Started` section above) for your platform and a valid [Node.js](https://nodejs.org) project setup.

## Quick Setup

Using the CLI is the easiest way to get started with REST API.

You can do this directly on your machine.

<!--tabs-->

## Directly on computer

After installing and confirming that Libindy is installed, simply run:

```sh
npx -p @aries-framework/rest afj-rest start \
  --label "AFJ Rest" \
  --wallet-id "walletId" \
  --wallet-key "walletKey" \
  --endpoint http://localhost:5000 \
  --admin-port 3000 \
  --outbound-transport http \
  --inbound-transport http 5000
```

<!--/tabs-->
