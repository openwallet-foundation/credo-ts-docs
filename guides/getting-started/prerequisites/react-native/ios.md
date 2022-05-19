# iOS

> It is presumed that you have a working [React
> Native](https://reactnative.dev) as explained
> [here](https://reactnative.dev/docs/environment-setup).

### Adding the Indy.Framework to a React Native application

> Your iOS target version has to be above 10.0 in order to work

In order for the Aries JavaScript Ecosystem to use the
[indy-sdk](https://github.com/hyperledger/indy-sdk) on iOS the `Indy.Framework`
has to be added.

Due to some issues with manually building this library we have decided to host
a most up-to-date pre-built version. this is located
[here](https://github.com/animo/Indy.Framework).

Adding this to your application is just three simple steps.

First, the [Indy.Framework](https://github.com/animo/Indy.Framework) has to be
cloned.

```console
git clone https://github.com/animo/Indy.Framework
cd Indy.Framework
```

Secondly, we have to add the framework to your React Native project.

```console
mv Indy.Framework <YOUR_PROJECT_DIRECTORY>/ios/Pods/Frameworks/Indy.Framework
```

Lastly, a command has to be ran, from the root of your project, to include the
framework.

```console
pod install --project-directory ios
```
