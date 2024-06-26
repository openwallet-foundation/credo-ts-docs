# Prerequisites

To work with [Credo](https://github.com/openwallet-foundation/credo-ts) we need to install some dependencies and set-up our Node.js environment. Even when creating a mobile app in React Native, we need Node.js installed. We will go over the specific installation process for each platform. Go ahead and pick your system of choice to get started!

The specific items that we set-up:

- [Node.js](https://nodejs.org) - v16 or v18
- [yarn](https://classic.yarnpkg.com/lang/en/docs/install) or [npm](https://www.npmjs.com/)
- Node.js or React Native project.

### Node.js

NodeJS is the most popular JavaScript runtime environment excluding browsers. It can run on your desktop or even a server.

<!--tabs-->

#### Windows

You can download it from the [Node.js Website](https://nodejs.org/en/download/)

#### macOS

Make sure you have [Homebrew](https://brew.sh/) installed. If not you can install it with the following command:

```console
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Then install Node.js with the following command:

```console
brew install nodejs
```

Alternatively, you can download it from the [Node.js Website](https://nodejs.org/en/download/)

#### Linux

Either follow one of the specific steps for installing Node.js on linux below, or you can download it directly from the [Node.js Website](https://nodejs.org/en/download/)

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

Finally, you need to make sure you have a project set-up using Node.js or React Native. If you're not familiar with setting up a project, we suggest following the [Introduction to Node.js](https://nodejs.dev/en/learn/) or [React Native Quickstart](https://reactnative.dev/docs/environment-setup) guides.
