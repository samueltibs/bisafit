# BisaFit Android Build Guide

## Prerequisites

### 1. Install Android Studio
Download and install from: https://developer.android.com/studio

During installation, make sure to install:
- Android SDK
- Android SDK Platform-Tools
- Android SDK Build-Tools

### 2. Install Java JDK 17+
Android requires Java JDK 17 or higher.

**macOS:**
```bash
brew install openjdk@17
```

**Windows:**
Download from: https://adoptium.net/

### 3. Install Node.js 22+
```bash
nvm install 22
nvm use 22
```

---

## Building the Android App

### Step 1: Clone/Download the Project

Make sure you have the latest code from your Emergent project.

### Step 2: Install Dependencies

```bash
cd frontend
yarn install
```

### Step 3: Build the Web App

```bash
yarn build
```

### Step 4: Sync Capacitor

```bash
npx cap sync android
```

### Step 5: Open in Android Studio

```bash
npx cap open android
```

This will open Android Studio with the project.

### Step 6: Build the App Bundle (.aab)

In Android Studio:
1. Go to **Build** → **Generate Signed Bundle / APK**
2. Select **Android App Bundle**
3. Click **Next**
4. Create a new keystore or use existing:
   - **Keystore path:** Create new (e.g., `bisafit-release.keystore`)
   - **Keystore password:** Choose a strong password
   - **Key alias:** `bisafit`
   - **Key password:** Choose a strong password
   - **Validity:** 25+ years
   - **Certificate info:** Fill in your details
5. Click **Next**
6. Select **release** build variant
7. Click **Create**

The `.aab` file will be in: `android/app/release/app-release.aab`

---

## Uploading to Google Play Console

### Step 1: Create App in Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Create app**
3. Fill in details:
   - **App name:** BisaFit
   - **Default language:** English (US)
   - **App or game:** App
   - **Free or paid:** Your choice

### Step 2: Complete Store Listing

Go to **Main store listing** and fill in:

| Field | Value |
|-------|-------|
| **App name** | BisaFit |
| **Short description** | AI-powered fitness app for personalized workouts and nutrition |
| **Full description** | (see below) |

**Full Description:**
```
🏋️ BisaFit - Your Personal AI Fitness Coach

Transform your fitness journey with BisaFit, the intelligent workout companion that creates personalized plans just for you.

✨ KEY FEATURES:

🤖 AI-Powered Workouts
Get customized workout plans that adapt to your goals, schedule, and fitness level. Our AI learns your preferences and adjusts as you progress.

🥗 Smart Nutrition Guidance
Receive personalized meal suggestions and track your macros to fuel your fitness goals effectively.

📊 Progress Tracking
Watch your transformation with detailed stats, workout history, and performance insights.

🎯 Goal-Focused Training
Whether you're building muscle, losing weight, or improving endurance - BisaFit creates the perfect plan for YOUR goals.

⚡ Features Include:
• Personalized AI workout plans
• Exercise demonstrations with images
• Nutrition tracking and meal ideas
• Progress analytics and stats
• Flexible scheduling
• Works with any equipment level

Start your fitness journey today with BisaFit!

⚠️ BisaFit is not a medical service. Always consult a healthcare provider before beginning any fitness program.
```

### Step 3: Upload Screenshots

Required screenshots:
- **Phone:** At least 2 screenshots (1080x1920 or similar)
- **7-inch tablet:** Optional but recommended
- **10-inch tablet:** Optional but recommended

### Step 4: Add Graphics

| Asset | Size | Notes |
|-------|------|-------|
| **App icon** | 512x512 px | PNG, no transparency |
| **Feature graphic** | 1024x500 px | Promotional banner |

### Step 5: Set Up Content Rating

1. Go to **Policy** → **App content**
2. Complete the **Content rating** questionnaire
3. BisaFit should qualify for "Everyone" rating

### Step 6: Set Up Pricing & Distribution

1. Go to **Monetization** → **Pricing**
2. Choose Free or Paid
3. Select countries to distribute

### Step 7: Create Closed Testing Track

For initial testing:
1. Go to **Testing** → **Closed testing**
2. Create a new track (e.g., "Alpha testers")
3. Add testers by email
4. Upload your `.aab` file
5. Submit for review

### Step 8: Submit for Review

1. Complete all required sections (check the dashboard)
2. Click **Submit for review**
3. Wait for Google's review (usually 1-3 days for new apps)

---

## App Store Assets Checklist

### Required for Google Play:
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500)
- [ ] At least 2 phone screenshots
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Privacy policy URL: https://bisafit-legal.preview.emergentagent.com/privacy
- [ ] Content rating questionnaire completed

### Recommended:
- [ ] Promo video (YouTube link)
- [ ] Tablet screenshots
- [ ] Feature graphic with app preview

---

## Keystore Security

⚠️ **IMPORTANT:** Keep your keystore file and passwords safe!

- Store the `.keystore` file securely
- Never commit it to git
- Keep passwords in a password manager
- You'll need the same keystore for all future updates

---

## Troubleshooting

### Build fails with "SDK not found"
Make sure `ANDROID_HOME` environment variable is set:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$HOME/Android/Sdk          # Linux
```

### Gradle sync fails
Try:
```bash
cd android
./gradlew clean
./gradlew build
```

### Capacitor sync issues
```bash
npx cap sync --force android
```

---

## Next Steps After Closed Testing

1. Gather feedback from testers
2. Fix any issues
3. Move to **Open testing** or **Production**
4. Submit for full review
5. 🎉 Launch!
