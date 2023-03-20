# macOS (ARM)

To install [Indy SDK](https://github.com/hyperledger/indy-sdk) on macOS a couple of dependencies are required. This guide covers the installation of the Indy SDK for macs with an ARM processor. For installing the Indy SDK on Intel based macs, please refer to the [Indy SDK macOS (Intel)](./macos-intel) guide.

:::info

This installation assumes that you have [brew](https://brew.sh) installed. If not, please install it via this command:

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

:::

### Libsodium

[Libsodium](https://github.com/jedisct1/libsodium) is used by the Indy SDK for encryption, decryption, hashing and signing.

```console
brew install libsodium
```

### Libzmq

[Libzmq](https://github.com/zeromq/libzmq) is a lightweight messaging queue used by the Indy SDK.

```console
brew install zeromq
```

### Indy SDK

The Indy SDK does not been distributed properly for macOS. We have a pre-built library available that can
be downloaded. If you prefer to build from source, you can follow the instructions in the [Indy SDK repository](https://github.com/hyperledger/indy-sdk#how-to-build-indy-sdk-from-source)

First, download the pre-built library from [Google Drive](https://drive.google.com/file/d/1JaRqAEAyodjeh120YYZ0t42zfhN3wHiW/view).

After this, open `Finder`, `control+click` on the library and click on `open`.
This is something that has to be done as the library is not properly signed.

Lastly the library just has to be moved to the correct location.

:::caution

If you downloaded the file in another directory, please change the first part of this command

:::

```console
sudo mv ~/Downloads/libindy.dylib /usr/local/lib/
```

### Confirm installation

To see whether the Indy SDK is correctly installed on your system, run the following command and it should not error.

```console
npx -p @aries-framework/node@^0.3 is-indy-installed
```
