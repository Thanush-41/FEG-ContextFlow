# FEG ContextFlow

> This working counter is the protected native-interaction skeleton for the
> broader FEG ContextFlow product. Sprint foundation documents live in
> [`docs/sprint-1`](docs/sprint-1/README.md). The baseline is preserved by the
> Git tag `voice-native-skeleton-v1`.

A full-stack TypeScript monorepo with a bare React Native app in `apps/mobile`.
The implemented sports-offer shell follows the compact blue and charcoal
psk.hr mobile hierarchy from the supplied recording, using FEG branding and
demo data. The original counter is preserved as the word-count engine for the
voice agent, widget and Dynamic Island.

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
cd apps/mobile
BUNDLE_PATH=vendor/bundle bundle install
BUNDLE_PATH=vendor/bundle bundle exec pod install --project-directory=ios
cd ../../..
```

## Run the app

Start Metro in one terminal:

```sh
npm run mobile
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
cd apps/mobile/android
./gradlew assembleRelease
```

The APK is written to:

```text
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

Before distributing a release, configure a private release signing key in the
Android Gradle configuration. Debug builds can be created with:

```sh
cd apps/mobile/android
./gradlew assembleDebug
```

## Quality checks

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

See [`docs/sprint-2`](docs/sprint-2/README.md) for the API, MongoDB replica-set,
workspace, and local-development commands.
