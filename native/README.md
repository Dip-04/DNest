# DNest native lock-screen surfaces

The native companions use the existing Next.js/Supabase app as their private
backend. Each phone receives a revocable 256-bit key from **Settings →
Lock-screen widgets**. The key is stored as a SHA-256 hash in Supabase; the raw
key exists only in the browser response and on the connected phone.

## Android 16

The Android project is in `native/android` and targets SDK 36. It contains:

- a foreground location service that runs only after explicit permission;
- an Android 16 promoted ongoing Live Update for the Lock Screen;
- a resizable `Between Us` app widget for compatible widget hosts;
- the `dnest://connect` deep link used by the web Settings screen.

Open `native/android` in Android Studio, select the `app` configuration, and
run it on the phone. A debug APK is generated at
`native/android/app/build/outputs/apk/debug/app-debug.apk` after
`:app:assembleDebug`.

On the phone, sign in to the deployed web app, open Settings, choose **Connect
Android**, and tap **Open in DNest app**. Grant notification and precise
location permission. The foreground notification is the reliable Android 16
Lock Screen surface; third-party app-widget placement on the Lock Screen still
depends on the device's widget host.

## iPhone / iOS 18

The iOS sources are in `native/ios`. They contain:

- an accessory rectangular/inline WidgetKit Lock Screen widget;
- a richer Live Activity for the Lock Screen and Dynamic Island;
- a Home Screen `systemSmall` route card;
- an explicit background Core Location coordinator;
- the same `dnest://connect` setup flow and App Group storage.

The iOS project must be generated and signed on macOS:

1. Install Xcode 16 or newer and XcodeGen (`brew install xcodegen`).
2. Run `cd native/ios && xcodegen generate`.
3. Open `DNest.xcodeproj`.
4. Select an Apple Development team for both targets.
5. Register `com.dnest.app`, `com.dnest.app.widgets`, and the App Group
   `group.com.dnest.app` in the Apple Developer account, or change all three
   identifiers consistently before signing.
6. Enable the App Groups, Background Modes → Location updates, and Live
   Activities capabilities, then run on a physical iPhone.
7. In the web app choose **Connect iPhone**, open the DNest deep link, and grant
   **Always** location permission.

iOS decides when ordinary widget timelines refresh. The included Live Activity
updates on accepted background-location callbacks. Reliable updates caused only
by the remote partner moving require APNs ActivityKit push credentials; those
credentials cannot be created without the app owner's paid Apple Developer
account and are intentionally not stored in this repository.

## Backend deployment

Apply `supabase/migrations/202608230004_native_widget_access.sql`, deploy the
Next.js application, and ensure `SUPABASE_SERVICE_ROLE_KEY` is available only in
the server environment. Native requests use:

- `POST /api/native-widget/connect` from an authenticated web session;
- `GET /api/native-widget/state` with the native Bearer key;
- `POST /api/native-widget/state` with coordinates and the same key.

The state endpoint returns coordinates only when both partners have enabled
location sharing and always sends `Cache-Control: private, no-store`.

