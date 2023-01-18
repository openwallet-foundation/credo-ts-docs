# iOS

1. Add the following lines to the start of your Podfile (`ios/Podfile`).

If a custom `source` is defined we also need to define the default source (which is implicit if no source is specified), explicitly:

```
source 'https://github.com/hyperledger/indy-sdk-react-native'
source 'https://cdn.cocoapods.org'
```

2. Install the Latest CocoaPods dependencies:

```
cd ios
pod install
pod update Indy
```

3. Configure Bitcode to `no` in both the project and targets

4. Set `Build Libraries for Distribution` to `yes` in both the project and targets

> This is required due to mismatching Swift versions between the Indy SDK and the application, as described in this [Stackoverflow Answer](https://stackoverflow.com/questions/58654714/module-compiled-with-swift-5-1-cannot-be-imported-by-the-swift-5-1-2-compiler/63305234#63305234)

5. iOS Simulators are currently not supported and should be disabled

6. Hermes

Hermes is recommended on iOS for application performance improvements

#### React Native >= 0.70.0

Hermes is enabled by default

#### React Native 0.64.0 - 0.69.5

Add or adjust the following in the `ios/Podfile` to:

```   use_react_native!(
     :path => config[:reactNativePath],
     # to enable hermes on iOS, change `false` to `true` and then install pods
     # By default, Hermes is disabled on Old Architecture, and enabled on New Architecture.
     # You can enable/disable it manually by replacing `flags[:hermes_enabled]` with `true` or `false`.
-    :hermes_enabled => flags[:hermes_enabled],
+    :hermes_enabled => true
   )
```

#### React Native <= 0.64.0

Hermes is not required for older versions of React Native


