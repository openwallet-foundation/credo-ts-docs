# Apple (Intel)

In this section, we will discuss the specific installation of the dependencies
for Apple computers with an Intel processor.

> This installation assumes that you have [brew](https://brew.sh) installed. If
> not, please install it via this command:

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

# NodeJS

NodeJS is the most popular JavaScript runtime environment excluding
browsers. It can run on your desktop or even a server.

```console
brew install nodejs
```

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

The [indy-sdk](https://github.com/hyperledger/indy-sdk) has not been
distributed properly for macOS. We have made a [brew
tap](https://docs.brew.sh/Taps) for libindy and it will also install all of the
required dependencies.

```console
brew install blu3beri/libindy/libindy
```

### Confirm installation

To see whether the [indy-sdk](https://github.com/hyperledger/indy-sdk) is
properly installed, run the following command and it should not error.

```console
npx -p @aries-framework/node is-indy-installed
```
