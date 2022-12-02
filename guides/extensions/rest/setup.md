# Setup

> This guide assumes you have followed the install guides for the framework
> (See `Getting Started` section above) for your platform and a valid [Node.js](https://nodejs.org) project setup.

## Quick Setup

Using the CLI is the easiest way to get started with REST API.

You can do this using the Docker image the package provisons, or directly on your machine.

<!--tabs-->

## With Docker (easiest)

Make sure you have [Docker](https://docs.docker.com/get-docker/) installed. To get a minimal version of the agent running, the following command is sufficient:

```sh
docker run -p 5000:5000 -p 3000:3000 ghcr.io/hyperledger/afj-rest \
  --label "AFJ Rest" \
  --wallet-id "walletId" \
  --wallet-key "walletKey" \
  --endpoint http://localhost:5000 \
  --admin-port 3000 \
  --outbound-transport http \
  --inbound-transport http 5000
```

See the [docker-compose.yml](https://github.com/hyperledger/aries-framework-javascript-ext/tree/main/docker-compose.yml) file for an example of using the afj-rest image with Docker Compose.

> ⚠️ The Docker image is not optimized for ARM architectures and won't work on Apple Silicon macs. See the **Directly on Computer** tab above on how to run it directly on your computer without Docker.

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
