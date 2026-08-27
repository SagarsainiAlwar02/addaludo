# Adda Ludo - Android App (WebView Wrapper)

A lightweight Android app that wraps the [addaludo.com](https://addaludo.com) website in a native WebView shell.

## How it works

- The app loads `https://addaludo.com` inside a fullscreen WebView
- All UI, login, contests, wallet — everything runs from the live website
- When you update the website, users see changes the next time they open the app
- No push notifications, no native features — just a clean app shell

## APK Files

| File | Size | Description |
|------|------|-------------|
| `AddaLudo-release.apk` | ~4.3 MB | **Use this** — Signed release APK, ready to distribute |
| `AddaLudo-debug.apk` | ~5.3 MB | Debug build (for testing only) |

## Distributing the APK

1. Upload `AddaLudo-release.apk` to your website (e.g., `/downloads/AddaLudo.apk`)
2. Add a "Download App" button on your website linking to the APK file
3. Users tap the link → download → install → done

**Note:** Users need to enable "Install from Unknown Sources" in their Android settings to install the APK.

## Features

- ✅ Fullscreen immersive (no browser address bar)
- ✅ Back button goes back in web history (not exits app)
- ✅ JavaScript + Cookies enabled (login sessions work)
- ✅ External links (WhatsApp, UPI) open in external apps
- ✅ No internet error screen with retry button
- ✅ Portrait mode only
- ✅ Dark status bar matching website theme
- ✅ Placeholder icon (replace with your logo later)

## Rebuilding the APK

If you need to rebuild (e.g., after changing the URL or icon):

```bash
export ANDROID_HOME=$HOME/android-sdk
export JAVA_HOME=$HOME/.sdkman/candidates/java/current
cd app-adda
./gradlew assembleRelease
```

The APK will be at: `app/build/outputs/apk/release/app-release.apk`

## Signing Key

The release APK is signed with:
- **Keystore:** `release-key.jks`
- **Alias:** `addaludo`
- **Store password:** `addaludo123`

⚠️ **For production:** Keep this keystore safe. If you lose it, you can't update the app on users' devices.

## Project Structure

```
app-adda/
├── AddaLudo-release.apk      # The APK to distribute
├── AddaLudo-debug.apk         # Debug build
├── release-key.jks            # Signing keystore
├── build.gradle               # Root build config
├── settings.gradle
├── gradle.properties
├── local.properties           # Android SDK path
└── app/
    ├── build.gradle           # App build config + signing
    └── src/main/
        ├── AndroidManifest.xml
        ├── java/com/addaludo/app/
        │   └── MainActivity.java   # WebView wrapper logic
        └── res/
            ├── layout/activity_main.xml
            ├── drawable/            # Icons + progress bar
            ├── mipmap-*/            # Launcher icons (placeholder)
            └── values/
                ├── strings.xml
                └── styles.xml
```
