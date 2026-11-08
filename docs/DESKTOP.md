# Windows Desktop App Guide (Electron)

This guide provides instructions for running, building, installing, and deploying the **Apex Academy (TuitionPlatform)** Windows Desktop App built with **Electron**.

---

## 1. Overview & Key Architecture Features

- **Custom Protocol (`app://tuition`)**: Serves web application assets securely under `app://tuition` rather than `file://`, ensuring full compatibility with Firebase Auth, IndexedDB, and web storage APIs.
- **Single Instance Lock**: Ensures only one application window runs at a time.
- **Window State Persistence**: Automatically saves and restores your window size and position (default 1280x800).
- **Clean Borderless Interface**: No default OS menu bar for a modern, focused experience.
- **External Link Handling**: Deep links (`upi://`), external web pages (YouTube, Google Drive), and video conferencing links open safely in the system default browser (`shell.openExternal`).
- **Content Security Policy (CSP)**: Restricts script, style, and media sources to app assets, Firebase, specified backend host, and Jitsi video calls.

---

## 2. Installation & Running on Windows

### Downloads
Download the latest executables from the GitHub Repository Releases page:
- **NSIS Setup Installer (`Apex Academy Setup 1.0.0.exe`)**: Standard installer with Start Menu and Desktop shortcuts.
- **Portable Version (`Apex Academy 1.0.0.exe`)**: Single standalone executable that runs without installation.

### Windows SmartScreen Note (Unsigned Executables)
Because community builds do not use a paid Code Signing Certificate ($300+/year), Windows SmartScreen may show a security notice when launching the application:

> **"Windows protected your PC"**  
> *Microsoft Defender SmartScreen prevented an unrecognized app from starting.*

**How to run:**
1. Click **"More info"** on the SmartScreen dialog.
2. Click **"Run anyway"** at the bottom of the window.
3. The app will launch normally.

---

## 3. Local Development & Building

### Prerequisites
- Node.js v18+ and `npm`
- Windows 10/11 or Linux/macOS with Wine (for cross-compilation)

### Development Mode
Runs the Vite web build and launches Electron with hot reload support:
```bash
npm run desktop:dev
```

### Production Build
Compiles the Electron main/preload TypeScript code, builds the web assets, and packages both the NSIS installer and portable executable into `dist-desktop/`:
```bash
npm run desktop:build
```

Outputs generated in `dist-desktop/`:
- `Apex Academy Setup 1.0.0.exe` (NSIS Installer)
- `Apex Academy 1.0.0.exe` (Portable Executable)

---

## 4. Automated Release Workflow

The project includes a GitHub Actions workflow (`.github/workflows/release.yml`). Tagging a release (e.g. `git tag v1.0.0 && git push origin v1.0.0`) triggers an automated build that attaches both Windows executables and the Android APK directly to the GitHub Release.
