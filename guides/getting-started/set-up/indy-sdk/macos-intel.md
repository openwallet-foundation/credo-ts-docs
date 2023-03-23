# macOS (Intel)

To install [Indy SDK](https://github.com/hyperledger/indy-sdk) on macOS a couple of dependencies are required. This guide covers the installation of the Indy SDK for macs with an Intel processor. For installing the Indy SDK on ARM based macs, please refer to the [Indy SDK macOS (ARM)](./macos-arm) guide.

:::info

This installation assumes that you have [brew](https://brew.sh) installed. If not, please install it via this command:

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

:::

### Indy SDK

The Indy SDK has not been distributed properly for macOS. We have made a [brew tap](https://docs.brew.sh/Taps) for `libindy` and it will also install all of the required dependencies.

```console
brew install blu3beri/libindy/libindy
```

### Confirm installation

To see whether the Indy SDK is correctly installed on your system, run the following command and it should not error.

```console
npx -p @aries-framework/node@^0.3 is-indy-installed
```
