# FEG ContextFlow Counter

A small React Native counter app for iOS and Android. The shared UI lives in
`App.tsx`; the `ios/` and `android/` directories contain the native projects.

On iOS 16.2 or later, tap **Start Live Activity** to mirror the counter on the
Lock Screen and in the Dynamic Island. Increasing, decreasing, or resetting the
counter updates the Live Activity automatically; tap **End Live Activity** to
dismiss it.

The iOS app also includes a synchronized Home Screen widget and local
notifications. Tap **Send Notification** to request notification permission
and show the current count. To add the widget, long-press the iPhone Home
Screen, choose **Edit > Add Widget**, search for **FEG Counter**, and select a
size. The widget refreshes whenever the count changes in the app.

While the Live Activity is running, tap **Start Voice Input** and speak. The
counter increases by the number of recognized words as the transcript changes.
After granting Microphone and Speech Recognition permissions once in the app,
use the **Speak** button on the Home Screen widget or Lock Screen Live Activity
without opening the app. Long-press the Dynamic Island to expand it and reveal
the same Start/Stop voice control. This background system-surface control
requires iOS 18 or later.

## Install dependencies

```sh
npm install
```

For iOS, install CocoaPods dependencies after Xcode is installed:

```sh
bundle install
cd ios
bundle exec pod install
cd ..
```

## Run the app

Start Metro in one terminal:

```sh
npm start
```

Then launch a platform build in another terminal:

```sh
npm run ios
npm run android
```

The iOS script explicitly uses `/Applications/Xcode.app`, so it works even if
macOS still has Command Line Tools selected globally. To switch the global
developer directory later, run the following yourself and enter your Mac
administrator password when prompted:

```sh
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

Xcode builds iOS `.app`/`.ipa` packages. An `.apk` is an Android package and is
built with the Android toolchain.

## Build an Android APK

Install Android Studio/JDK, configure an Android SDK, then run:

```sh
cd android
./gradlew assembleRelease
```

The APK is written to:

```text
android/app/build/outputs/apk/release/app-release.apk
```

Before distributing a release, configure a private release signing key in the
Android Gradle configuration. Debug builds can be created with:

```sh
cd android
./gradlew assembleDebug
```

## Quality checks

```sh
npm test -- --runInBand
npm run lint
```
