# Android

Setting up React Native for Android can be a bit of a hassle, but following
these steps below it should be possible.

### Set the minimum SDK version

inside the `android/build.gradle` add the minimum SDK version of 21

```json title="android/build.gradle"
buildscript {
    ext {
        ...
        minSdkVersion = 21
        ...
    }
}
```

### Add the Sovrin maven repository

inside the `android/build.gradle` add the url for the Sovrin maven repository.

Note: ensure that the following is added to the correct maven braces as there are other near this location.

```json title="android/build.gradle"
allprojects {
    repositories {
        ...
        maven {
            url 'https://repo.sovrin.org/repository/maven-public'
        }
        ...
    }
}
```

### Adding the JNA library dependency

The [JNA](https://github.com/java-native-access/jna), Java Native Access,
library has to be added in order to communicate with the
[indy-sdk](https://github.com/hyperledger/indy-sdk)

```json title="android/app/build.gradle"
dependencies {
    ...
    implementation 'net.java.dev.jna:jna:5.2.0'
    ...
}
```

### Adding the Android indy-sdk libaries

The following steps will add the correct dependencies at the correct location
for everything to work properly

> This guide presumes that you execute every command from the root of your
> project

1. create a `jniLibs` directory

```console
mkdir android/app/src/main/jniLibs
```

2. create the architecture specific sub-directories

```console
mkdir android/app/src/main/jniLibs/arm64-v8a
mkdir android/app/src/main/jniLibs/armeabi-v7a
mkdir android/app/src/main/jniLibs/x86
mkdir android/app/src/main/jniLibs/x86_64
```

3. Downlaod the [indy-sdk](https://github.com/hyperledger/indy-sdk) libraries
   to the correct location

```console title="arm64-v8a"
curl https://repo.sovrin.org/android/libindy/stable/1.16.0/libindy_android_arm64_1.16.0.zip --output arm64.zip
unzip arm64.zip
mv libindy_arm64/lib/libindy.so android/app/src/main/jniLibs/arm64-v8a/libindy.so
rm arm64.zip
```

```console title="armeabi-v7a"
curl https://repo.sovrin.org/android/libindy/stable/1.16.0/libindy_android_armv7_1.16.0.zip --output armv7.zip
unzip armv7.zip
mv libindy_armv7/lib/libindy.so android/app/src/main/jniLibs/armeabi-v7a/libindy.so
rm armv7.zip
```

```console title="x86"
curl https://repo.sovrin.org/android/libindy/stable/1.16.0/libindy_android_x86_1.16.0.zip --output x86.zip
unzip x86.zip
mv libindy_x86/lib/libindy.so android/app/src/main/jniLibs/x86/libindy.so
rm x86.zip
```

```console title="x86_64"
curl https://repo.sovrin.org/android/libindy/stable/1.16.0/libindy_android_x86_64_1.16.0.zip --output x86_64.zip
unzip x86_64.zip
mv libindy_x86_64/lib/libindy.so android/app/src/main/jniLibs/x86_64/libindy.so
rm x86_64.zip
```

4. Download the JNA libraries

```console title="arm64-v8a"
curl -LO https://github.com/java-native-access/jna/raw/5.5.0/lib/native/android-aarch64.jar

jar xf android-aarch64.jar
mv libjnidispatch.so android/app/src/main/jniLibs/arm64-v8a/libjnidispatch.so
rm android-aarch64.jar libjnidispatch.so
```

```console title="armeabi-v7a"
curl -LO https://github.com/java-native-access/jna/raw/5.5.0/lib/native/android-armv7.jar

jar xf android-armv7.jar
mv libjnidispatch.so android/app/src/main/jniLibs/armeabi-v7a/libjnidispatch.so
rm android-armv7.jar libjnidispatch.so
```

```console title="x86"
curl -LO https://github.com/java-native-access/jna/raw/5.5.0/lib/native/android-x86.jar

jar xf android-x86.jar
mv libjnidispatch.so android/app/src/main/jniLibs/x86/libjnidispatch.so
rm android-x86.jar libjnidispatch.so
```

```console title="x86_64"
curl -LO https://github.com/java-native-access/jna/raw/5.5.0/lib/native/android-x86-64.jar

jar xf android-x86-64.jar
mv libjnidispatch.so android/app/src/main/jniLibs/x86_64/libjnidispatch.so
rm android-x86-64.jar libjnidispatch.so
```

5. Load the library inside the `MainActivity.java`

```java title="MainActivity.java"
...
import android.os.Bundle;
import android.system.ErrnoException;
import android.system.Os;
import java.io.File;
...

public class MainActivity extends ReactActivity {
  ...

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    try {
      Os.setenv("EXTERNAL_STORAGE", getExternalFilesDir(null).getAbsolutePath(), true);
      System.loadLibrary("indy");
    } catch (ErrnoException e) {
      e.printStackTrace();
    }
  }
}
```

6. Hermes

Hermes is required in order to perform ledger operations using the Indy SDK.

> For more info, see [this Indy-SDK issue](https://github.com/hyperledger/indy-sdk/issues/2346#issuecomment-841000640).

#### React Native >= 0.70.0

Hermes is enabled by default

#### React Native 0.62.0 - 0.69.5

Add or adjust the following in the `android/app/build.gradle` to:

```gradle
project.ext.react = [
    enableHermes: true,  // clean and rebuild if changing
]
```

#### React Native <= 0.61.5

Hermes is not required for older versions of React Native
