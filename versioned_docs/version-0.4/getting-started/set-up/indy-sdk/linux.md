# Linux

To install [Indy SDK](https://github.com/hyperledger/indy-sdk) on Linux, a couple of dependencies are required. This guide covers the installation for the more popular Linux distributions.

### Libsodium

[Libsodium](https://github.com/jedisct1/libsodium) is used by the Indy SDK for encryption, decryption, hashing and signing.

<!--tabs-->

#### Arch Linux

```
pacman -S libsodium
```

#### Debian

```
apt-get install libsodium-dev
```

#### Red Hat

```
yum install libsodium libsodium-devel
```

<!--/tabs-->

### Libzmq

[Libzmq](https://github.com/zeromq/libzmq) is a lightweight messaging queue used by the Indy SDK.

<!--tabs-->

#### Arch Linux

```
pacman -S zeromq
```

#### Debian

```
apt-get install libzmq3-dev
```

#### Red Hat

```
yum install libsodium zeromq-devel
```

<!--/tabs-->

### Indy SDK

All the steps mentioned here are distribution independent. As the Indy SDK doesn't provide binaries for many releases, we will build it from source. This does mean that some additional requirements are necessary, like
[Rust](https://www.rust-lang.org).

Downloading [Rust](https://www.rust-lang.org) is as easy as executing the
following command:

```console
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

This will install [Rustup](https://rustup.rs) which is the installer for
[Rust](https://rust-lang.org).

With [Rust](https://rust-lang.org), we can now build the
Indy SDK from source.

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

### Confirm installation

To see whether the Indy SDK is correctly installed on your system, run the following command and it should not error.

```console
npx -p @aries-framework/node@^0.3 is-indy-installed
```
