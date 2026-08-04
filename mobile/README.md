# BisaFit Mobile App (React Native / Expo)

Native React Native app built with Expo, replacing the Capacitor-wrapped web app.

## Tech Stack

- **Expo SDK 52** with Expo Router v4
- **React Native 0.76+**
- **Supabase** (same backend as web app)
- **NativeWind** (Tailwind CSS for React Native)
- **React Query** for data fetching

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your iOS/Android device (for development)
- Xcode (for iOS builds)
- Android Studio (for Android builds)

### Install Dependencies

```bash
cd mobile
yarn install
```

### Run Development Server

```bash
# Start Expo dev server
npx expo start

# Run on iOS Simulator
npx expo start --ios

# Run on Android Emulator  
npx expo start --android
```

### Environment Configuration

The app connects to:
- **Supabase**: `https://qteefcujottugvwnhvix.supabase.co`
- **Backend API**: `https://bisafit.com`

These are configured in `src/lib/config.ts`.

## Project Structure

```
mobile/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Auth screens (login, signup, forgot-password)
│   ├── (app)/             # Main app screens (tabs)
│   │   ├── home.tsx       # Dashboard
│   │   ├── plan.tsx       # Weekly workout plan
│   │   ├── nutrition.tsx  # Nutrition tracking
│   │   ├── progress.tsx   # Progress charts
│   │   ├── settings.tsx   # Settings & profile
│   │   ├── onboarding.tsx # User onboarding flow
│   │   ├── paywall.tsx    # Subscription screen
│   │   └── workout/[id].tsx # Workout detail/player
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point (auth redirect)
├── src/
│   ├── contexts/          # React contexts (Auth)
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utils, config, Supabase client
│   ├── components/        # Reusable components
│   └── types/             # TypeScript types
├── app.json               # Expo configuration
├── babel.config.js        # Babel config (nativewind)
├── tailwind.config.js     # Tailwind config
└── tsconfig.json          # TypeScript config
```

## Features Implemented

### Auth Module
- [x] Email/password login
- [x] Email/password signup
- [x] Password reset
- [x] Session persistence (AsyncStorage)
- [x] **Apple Sign In** (iOS native)
- [x] **Google Sign In** (native)

### Home Dashboard
- [x] Daily greeting
- [x] Today's workout card
- [x] Quick stats (streak, weekly workouts)
- [x] Goal display
- [x] No-plan CTA

### Workout Plans
- [x] Weekly calendar view
- [x] Week navigation (prev/next)
- [x] Workout cards with completion status
- [x] Generate plan CTA

### Workout Player
- [x] Exercise list with checkboxes
- [x] Progress tracking
- [x] Complete workout button
- [x] Session logging to Supabase

### Nutrition
- [x] Daily calorie/macro tracking
- [x] Progress bars
- [x] Meal logging modal
- [x] Today's meals list

### Progress
- [x] Weight/waist logging
- [x] Simple bar chart
- [x] Stats cards (current weight, change)
- [x] Entry history

### Settings
- [x] Account info display
- [x] Subscription management link
- [x] Profile edit link
- [x] **Health platform connections** (Apple Health / Health Connect)
- [x] Support links
- [x] Sign out

### Health Integrations
- [x] **Apple HealthKit** (iOS)
  - Read: Steps, heart rate, active calories, workouts
  - Write: Workouts from BisaFit
- [x] **Health Connect** (Android)
  - Read: Steps, heart rate, exercise sessions
  - Write: Exercise sessions from BisaFit
- [x] Unified health service that works on both platforms
- [x] Auto-sync completed workouts to health platform

### Subscription (Paywall)
- [x] Plan selection UI
- [x] Stripe checkout (opens in browser)

## Building for Production

### iOS (TestFlight)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure EAS Build
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android (Play Store)

```bash
# Build for Android
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

## Bundle ID

- **iOS**: `com.bisagroup.bisafit`
- **Android**: `com.bisagroup.bisafit`

Same bundle IDs as the Capacitor app to maintain App Store/Play Store listings.

## Codemagic CI/CD

The existing Codemagic pipeline should work with minimal changes:
1. Update build commands to use `eas build`
2. Ensure Expo account credentials are configured
3. Update artifact paths

## Notes

- The web app at `bisafit.com` continues to work independently
- This app connects to the same Supabase database
- Stripe subscriptions use web checkout (redirects to browser)
- Apple Health integration will require native code (`expo-health`)
