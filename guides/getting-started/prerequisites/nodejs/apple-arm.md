# Apple (Arm)

In this section, we will discuss the specific installation of the dependencies
for Apple computers using their in-house sillicon, M1, M1 Pro and the M1 Max.

> This installation assumes that you have [brew](https://brew.sh) installed. If
> not, please install it via this command:

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### NodeJS

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

### Libsodium

[Libsodium](https://github.com/jedisct1/libsodium) is used by the
[indy-sdk](https://github.com/hyperledger/indy-sdk) for encryption, decryption,
hashing and signing.

```console
brew install libsodium
```

### Libzmq

[Libzmq](https://github.com/zeromq/libzmq) is a lightweight messaging queue
used by the [indy-sdk](https://github.com/hyperledger/indy-sdk).

```console
brew install zeromq
```

### Indy-sdk

The [indy-sdk](https://github.com/hyperledger/indy-sdk) is used by [Aries
Framework
JavaScript](https://github.com/hyperledger/aries-framework-javascript) for all
of its lower level functionality, like cryptography, ledger interaction and
much more.

The [indy-sdk](https://github.com/hyperledger/indy-sdk) has not been
distributed properly for macOS. We have a prebuilt library available that can
be downloaded. If you prefer to build from source, please follow the indy-sdk
steps for Linux [TODO: add link].

First, download the library from
[here](https://drive.google.com/file/d/1JaRqAEAyodjeh120YYZ0t42zfhN3wHiW/view).

After this, open `Finder`, `control+click` on the library and click on `open`.
This is something that has to be done as the library is not properly signed.

Lastly the library just has to be moved to the correct location.

> If you downloaded the file in another directory, please change the first part
> of this command

```console
sudo mv ~/Downloads/libindy.dylib /usr/local/lib/
```

### Confirm installation

To see whether the [indy-sdk](https://github.com/hyperledger/indy-sdk) is
properly installed, run the following command and it should not error.

```console
npx -p @aries-framework/node is-indy-installed
```
