# Android Native Build Guide (Capacitor)

This guide explains how to configure, build, sign, and install the native Android APK for **TuitionPlatform** using Capacitor.

---

## 1. Prerequisites

Before building the Android app, ensure your environment has:
- **Node.js**: v18+ and `npm`
- **Java Development Kit (JDK)**: JDK 17 or higher (`java -version`)
- **Android SDK & Tools**: Installed via Android Studio or command-line tools
- **Capacitor CLI**: Bundled with the project dependencies (`npx cap`)

---

## 2. Firebase Configuration (`google-services.json`)

To enable native Push Notifications and Firebase services on Android:

1. Download `google-services.json` from your Firebase Console under **Project Settings > General > Your Android apps** (`com.dk.tuitionplatform`).
2. Place the file at:
   ```text
   android/app/google-services.json
   ```
3. **Security Note**: `google-services.json` is ignored by `.gitignore` and must **never** be committed to public Git repositories. In CI/CD pipelines, inject it from a secret before building.

---

## 3. Creating a Release Keystore

Generate a 2048-bit RSA signing key using Java `keytool`:

```bash
keytool -genkeypair -v \
  -keystore tuition-release-key.jks \
  -alias tuition-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Store `tuition-release-key.jks` in a secure location outside the repository (e.g., `~/.keystores/tuition-release-key.jks`).

---

## 4. Setting Environment Variables

The Gradle build script (`android/app/build.gradle`) automatically detects signing credentials from environment variables:

```bash
export KEYSTORE_PATH="/path/to/tuition-release-key.jks"
export KEYSTORE_PASSWORD="YourKeystorePassword"
export KEY_ALIAS="tuition-key-alias"
export KEY_PASSWORD="YourKeyPassword"
```

In GitHub Actions or CI/CD pipelines, add these as repository secrets.

---

## 5. Syncing Web Assets & Building the APK

### Step A: Sync Web Assets to Android Project
Compiles the web app and copies assets into the Android native project:
```bash
npm run android:sync
```

### Step B: Build Release APK
Runs the Gradle release build script:
```bash
npm run android:apk
```

Upon successful completion, the compiled APK will be generated at:
```text
android/app/build/outputs/apk/release/app-release.apk
```

---

## 6. Installing the APK on Android Devices

### Method A: Direct File Transfer (Sideloading)
1. Copy `app-release.apk` to your Android device via USB, cloud storage, or messaging.
2. Open the file on the Android device.
3. If prompted, enable **"Install unknown apps"** in Android Settings for your file manager or browser.
4. Tap **Install** and launch **Apex Academy**.

### Method B: ADB (Android Debug Bridge)
With USB debugging enabled on your connected device:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## 7. Useful Capacitor Commands

- **Open Android Studio**: `npx cap open android`
- **Update Capacitor Plugins**: `npx cap update android`
- **Run on Connected Device**: `npx cap run android`
