<p align="center">
  <br />
  <img
    alt="Hyperledger Aries logo"
    src="https://raw.githubusercontent.com/openwallet-foundation/credo-ts/aa31131825e3331dc93694bc58414d955dcb1129/images/aries-logo.png"
    height="250px"
  />
</p>
<h1 align="center"><b>Credo Documentation</b></h1>
<p align="center">
  <a
    href="https://raw.githubusercontent.com/openwallet-foundation/credo-ts/main/LICENSE"
    ><img
      alt="License"
      src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"
  /></a>
</p>
<br />
<p align="center">
  <a href="#getting-started">Getting started</a> &nbsp;|&nbsp;
  <a href="#contributing">Contributing</a> &nbsp;|&nbsp;
  <a href="#license">License</a>
</p>

[Credo](https://github.com/openwallet-foundation/credo-ts) is a modular ecosystem of self-sovereign identity development tools written in TypeScript. This documentation site serves to make it as easy as possible for developers of any level to get started with building self-sovereign identity solutions.

# Getting Started

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

### Installation

```
yarn
```

### Local Development

```
yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```
USE_SSH=true yarn deploy
```

Not using SSH:

```
GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

## Contributing

The docs are a work in progress, contributions are incredibly appreciated! If you're looking to contribute check out the [contribution guideline](https://github.com/openwallet-foundation/credo-ts-docs/blob/main/CONTRIBUTING.md).

Issues are also welcomed as it gives us a good idea of the work still needing to be done.

## Licence

Credo Documentation is licensed under the [Apache License Version 2.0 (Apache-2.0)](/LICENSE).
