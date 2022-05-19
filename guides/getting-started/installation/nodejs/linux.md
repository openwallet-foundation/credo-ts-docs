# Linux

In this section we will discuss the specific installation of the dependencies
for the more popular Linux distrobutions.

### NodeJS

NodeJS is the most popular JavaScript runtime environment outside of the
browser. It can run on your desktop or even a server.

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

The Node Package Manager comes prebundles with the NodeJS installation from
above.

### yarn

> Only required when not using npm

For every platform the installation of yarn is the same.

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

The [indy-sdk](https://github.com/hyperledger/indy-sdk) is used by [Aries
Framework
JavaScript](https://github.com/hyperledger/aries-framework-javascript) for all
of its lower level functionality, like cryptography, ledger interaction and
much more.
