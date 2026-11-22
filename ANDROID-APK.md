# MR RICH CONNECT Android APK

This repository now includes a Capacitor Android wrapper for the existing live Next.js application.

## App identity

- App name: MR RICH CONNECT
- Android application ID: `com.mrrich.connect`
- Live web application: `https://mrrich-connect.onrender.com`
- Android app icon and splash artwork: `assets/`

## Build an installable test APK

The GitHub Actions workflow at `.github/workflows/android-apk.yml` builds a debug APK. It creates the Android project during the workflow, so the Android Gradle project does not need to be checked into this repository.

1. Push these changes to the repository's `main` branch, or open **Actions → Build MR RICH CONNECT Android APK → Run workflow** on GitHub.
2. Open the completed workflow run.
3. Under **Artifacts**, download `MR-RICH-CONNECT-Android-APK`.
4. Extract the ZIP and install `app-debug.apk` on an Android phone. Android may ask you to allow installation from that download source.

The debug APK is for testing and direct evaluation. Before broad public distribution, create a private Android signing keystore and configure a signed release build. Never commit the keystore or its passwords to the repository.

## Important architecture note

The Android wrapper loads the existing HTTPS Render deployment rather than exporting Next.js as static files. This preserves the existing server-side API routes and backend integrations. An internet connection is required. The website remains the source of truth, so deployed website changes are reflected in the app without reinstalling it.

The APK is a WebView-based Android shell around the live site; it is not yet a fully offline app. Native push-notification delivery, deep links, camera/file upload behavior, and payment-provider return flows should be tested on physical Android devices before release.
