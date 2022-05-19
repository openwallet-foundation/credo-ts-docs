# Linux

In this section, we will discuss the specific installation of the dependencies
for the more popular Linux distributions.

### NodeJS

NodeJS is the most popular JavaScript runtime environment excluding
browsers. It can run on your desktop or even a server.

```console title="Arch Linux"
pacman -S nodejs npm
```

```console title="Debian"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
```

```console title="Red Hat"
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
yum install nodejs
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

```console title="Arch Linux"
pacman -S libsodium
```

```console title="Debian"
apt-get install libsodium-dev
```

```console title="Red Hat"
yum install libsodium libsodium-devel
```

### Libzmq

[Libzmq](https://github.com/zeromq/libzmq) is a lightweight messaging queue
used by the [indy-sdk](https://github.com/hyperledger/indy-sdk).

```console title="Arch Linux"
pacman -S zeromq
```

```console title="Debian"
apt-get install libzmq3-dev
```

```console title="Red Hat"
yum install libsodium zeromq-devel
```

### Indy-sdk

> All the steps mentioned below are distrobution independent.

The [indy-sdk](https://github.com/hyperledger/indy-sdk) is used by [Aries
Framework
JavaScript](https://github.com/hyperledger/aries-framework-javascript) for all
of its lower level functionality, like cryptography, ledger interaction and
much more.

The [indy-sdk](https://github.com/hyperledger/indy-sdk) has not been
properly for many distributions so here we will build it from source. This does
mean that some additional requirements are necessary, like
[Rust](https://www.rust-lang.org).

Downloading [Rust](https://www.rust-lang.org) is as easy as executing the
following command:

```console
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

This will install [Rustup](https://rustup.rs) which is the installer for
[Rust](https://rust-lang.org).

With [Rust](https://rust-lang.org), we can now build the
[indy-sdk](https://github.com/hyperledger/indy-sdk) from source.

First, clone the repository in a temporary directory:

```console
git clone https://github.com/hyperledger/indy-sdk
```

Secondly, go to the correct directory

```console
cd indy-sdk/libindy
```

Third, build the library

```console
cargo build --release
```

Lastly, move the library to the correct location

```console
sudo mv target/release/libindy.so /usr/lib/libindy.so
```
