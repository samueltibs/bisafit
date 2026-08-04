# BisaFit iOS Production Build Guide

## Prerequisites

1. **macOS** with Xcode 15+ installed
2. **Apple Developer Account** (with App Store Connect access)
3. **Node.js 18+** and **Yarn** installed
4. **CocoaPods** installed (`sudo gem install cocoapods`)

## Build Steps

### 1. Clone/Pull Latest Code

```bash
git pull origin main
cd frontend
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Verify Environment Configuration

Check that `.env` contains the production backend URL:

```
VITE_REACT_APP_BACKEND_URL=https://bisafit.com
```

> **IMPORTANT:** This URL is embedded into the app at build time. The TestFlight blank screen / 402 error was caused by this pointing to the preview environment.

### 4. Build the Web App

```bash
yarn build
```

This creates the `build/` directory with production-optimized files.

### 5. Sync with Capacitor

```bash
npx cap sync ios
```

This copies the built web files into the iOS project and installs native dependencies.

### 6. Open in Xcode

```bash
npx cap open ios
```

### 7. Configure Signing in Xcode

1. Select the **App** target in the left sidebar
2. Go to **Signing & Capabilities** tab
3. Select your **Team** (your Apple Developer account)
4. Ensure **Bundle Identifier** is `com.bisagroup.bisafit`
5. Xcode will automatically manage provisioning profiles

### 8. Archive and Upload to TestFlight

1. In Xcode, select **Any iOS Device** as the build target (not a simulator)
2. Go to **Product → Archive**
3. Wait for the archive to complete
4. In the Organizer window, click **Distribute App**
5. Select **App Store Connect** → **Upload**
6. Follow the prompts to upload to TestFlight

### 9. TestFlight Distribution

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Navigate to your app → TestFlight
3. Wait for build processing (can take 15-30 minutes)
4. Add internal/external testers
5. Submit for external testing review if needed

## Troubleshooting

### Blank Screen / 402 Error
- **Cause:** App is pointing to wrong backend URL
- **Fix:** Ensure `VITE_REACT_APP_BACKEND_URL=https://bisafit.com` in `.env`, then rebuild

### Build Fails with Capacitor Plugin Errors
- Run `npx cap sync ios` again
- In the `ios/App` directory, run `pod install`

### Signing Issues
- Ensure your Apple Developer account has an active membership
- The bundle ID `com.bisagroup.bisafit` must match App Store Connect

### HealthKit Not Working
- HealthKit only works on real devices, not simulators
- Ensure HealthKit capability is enabled in Xcode

## Environment Variables

The following environment variables are baked into the iOS build:

| Variable | Production Value |
|----------|------------------|
| VITE_REACT_APP_BACKEND_URL | https://bisafit.com |
| VITE_SUPABASE_URL | https://qteefcujottugvwnhvix.supabase.co |
| VITE_STRIPE_PUBLISHABLE_KEY | pk_live_... |

## Quick Reference Commands

```bash
# Full production build sequence
yarn install
yarn build
npx cap sync ios
npx cap open ios
```

---
Last Updated: August 4, 2026
