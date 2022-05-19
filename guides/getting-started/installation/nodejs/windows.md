# Windows

### NodeJS

NodeJS is the most popular JavaScript runtime environment excluding
browsers. It can run on your desktop or even a server.

You can download it from [here](https://nodejs.org/en/download/)

### npm

The Node Package Manager comes pre-bundles with the NodeJS installation from
above.

### yarn

> Only required when not using npm

For every platform, the installation of yarn is the same.

```console
npm install --global yarn
```

### Indy-sdk

The [indy-sdk](https://github.com/hyperledger/indy-sdk) is used by [Aries
Framework
JavaScript](https://github.com/hyperledger/aries-framework-javascript) for all
of its lower level functionality, like cryptography, ledger interaction and
much more.

You can download the prebuilt library
[here](https://repo.sovrin.org/windows/libindy/master/1.16.0-1636/libindy_1.16.0.zip)
and afterwards extract them to a permanent location.

Next, go to `environment variables` on your system and click on `new` at
`System Variables`. The name MUST be `LD_LIBRARY_PATH` and the value MUST be
the path to the extracted libraries.

### Confirm installation

To see whether the [indy-sdk](https://github.com/hyperledger/indy-sdk) is
properly installed, run the following command and it should not error.

```console
npx -p @aries-framework/node is-indy-installed
```
