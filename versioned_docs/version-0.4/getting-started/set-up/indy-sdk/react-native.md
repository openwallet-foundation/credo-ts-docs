# React Native

The setup of Indy SDK for React Native is rather different than Node.JS. We do not have to install dependencies on the host-platform, but for the build target. For React Native this would be the Indy SDK for Android & iOS. This guide covers both the Android and iOS setup, as in most React Native projects you will need both.

## Expo

If you're using [Expo](https://expo.dev), the recommended way to install the Indy SDK is by using the [Indy SDK Expo Plugin](https://github.com/animo/indy-sdk-expo-plugin). This will correclty set-up your project with the Indy SDK using an [Expo Config Plugin](https://docs.expo.dev/guides/config-plugins/) for both iOS and Android.

Refer to the [Indy SDK Expo Plugin](https://github.com/animo/indy-sdk-expo-plugin) repository for installation instructions.

## Without Expo

When not using Expo, you will need to set-up the Indy SDK for both Android and iOS using the `indy-sdk-react-native` package directly. Refer to the [Indy SDK React Native](https://github.com/hyperledger/indy-sdk-react-native) repository for installation instructions.
