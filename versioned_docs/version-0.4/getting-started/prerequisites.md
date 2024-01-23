# Prerequisites

To work with [Aries Framework JavaScript](https://github.com/hyperledger/aries-framework-javascript) we need to install some dependencies and set-up our Node.JS environment. Even when creating a mobile app in React Native, we need Node.JS installed. We will go over the specific installation process for each platform. Go ahead and pick your system of choice to get started!

The specific items that we set-up:

- [Node.JS](https://nodejs.org) - v16 or v18
- [yarn](https://classic.yarnpkg.com/lang/en/docs/install) or [npm](https://www.npmjs.com/)
- Node.JS or React Native project.

### Node.JS

NodeJS is the most popular JavaScript runtime environment excluding browsers. It can run on your desktop or even a server.

<!--tabs-->

#### Windows

You can download it from the [Node.JS Website](https://nodejs.org/en/download/)

#### macOS

Make sure you have [Homebrew](https://brew.sh/) installed. If not you can install it with the following command:

```console
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Then install Node.JS with the following command:

```console
brew install nodejs
```

Alternatively, you can download it from the [Node.JS Website](https://nodejs.org/en/download/)

#### Linux

Either follow one of the specific steps for installing Node.JS on linux below, or you can download it directly from the [Node.JS Website](https://nodejs.org/en/download/)

##### Arch Linux

```
pacman -S nodejs npm
```

##### Debian

```
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
```

##### Red Hat

```
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
yum install nodejs
```

<!--/tabs-->

### NPM

The Node Package Manager comes pre-bundled with the NodeJS installation from above.

### Yarn

> Only required when not using npm

For every platform, the installation of yarn is the same.

```console
npm install --global yarn
```

### Project Setup

Finally, you need to make sure you have a project set-up using Node.JS or React Native. If you're not familiar with setting up a project, we suggest following the [Introduction to Node.JS](https://nodejs.dev/en/learn/) or [React Native Quickstart](https://reactnative.dev/docs/environment-setup) guides.
