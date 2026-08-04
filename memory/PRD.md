# BisaFit Product Requirements Document

## Overview
BisaFit is a full-stack AI-powered fitness application built with React/Vite (frontend) and FastAPI (backend), using Supabase for authentication and database.

## Company Information
- **Company Name:** Bisa Group LLC
- **Address:** 3171 S 129th E Ave, Ste A #5254, Tulsa, OK 74134, United States
- **Phone:** +1 (918) 248-6269
- **Support Email:** support@bisagroup.org
- **Product Email:** bisafit@bisagroup.org
- **Email Sending Domain:** bisagroup.org

## Core Features Implemented

### 1. Authentication & User Management
- Supabase Auth integration
- Email verification
- Password reset
- Legal document acceptance gating

### 2. Legal Documents System
- Public Terms of Service (/terms) - **Updated to v1.1 with Bisa Group LLC info**
- Public Privacy Policy (/privacy) - **Updated to v1.1 with Bisa Group LLC info**
- Versioned document management in Supabase
- User acceptance tracking

### 3. Subscription System (Stripe - LIVE MODE)
- Monthly and Annual plans
- Stripe Checkout Sessions
- Stripe Billing Portal
- Webhook handling for subscription events
- Admin bypass for `samuel.m.tibs@gmail.com`

### 4. Health Platform Integrations
- Apple Health (code ready, requires Capacitor plugin)
- Google Fit (code ready, requires Capacitor plugin)
- Fitbit OAuth (requires API keys)
- Strava OAuth (requires API keys)

### 5. Mobile App - React Native (Expo)
- **NEW:** Complete React Native app rebuilt using Expo SDK 52
- Replaces Capacitor-wrapped web app that had WebView issues
- Same bundle ID (`com.bisagroup.bisafit`) for App Store/Play Store continuity
- Features: Auth, Home, Plan, Nutrition, Progress, Settings, Workout Player
- Connects to same Supabase backend and bisafit.com API
- Location: `/app/mobile/`

### 6. Landing Page
- Professional multi-section design
- Features, Pricing, Testimonials, FAQ sections
- Updated footer with Bisa Group LLC branding

### 7. Contact Page (NEW - March 9, 2026)
- Created /contact page with full company information
- Contact methods for support, business, partnerships, billing

### 8. Email Infrastructure
- Transactional emails via Resend
- Sender: BisaFit <bisafit@bisagroup.org>
- Reply-to: support@bisagroup.org
- Standard footer on all emails with company address

## Email Templates Available
1. Welcome Email
2. Legal Document Update Notification
3. Store Waitlist Confirmation
4. Subscription Confirmation
5. Payment Receipt
6. Subscription Renewal Notice
7. Subscription Cancellation Confirmation
8. Trial Expiration Reminder
9. Billing Failure Notice
10. Product Notifications

## Tech Stack
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** FastAPI (Python)
- **Database:** Supabase (PostgreSQL), MongoDB
- **Payments:** Stripe (LIVE MODE)
- **Mobile:** Capacitor
- **Email:** Resend
- **AI:** OpenAI GPT-4o-mini, DALL-E (Emergent LLM Key)

## Blocked Tasks
- Fitbit/Strava integrations - waiting for user API keys
- Mobile app deployment - user needs to build locally

## Future Tasks
- Data synchronization for Fitbit/Strava post-authentication
- Enable App Store/Google Play download buttons after publishing
- iOS build guide creation

## Changelog

### March 13, 2026 - Code Review Fixes
- **Fixed deployment blocker:** Replaced 7 hardcoded URLs in email_service.py with APP_BASE_URL environment variable
- **Fixed scroll issue:** Landing page now scrolls properly (removed overflow-hidden, added public-page class)
- **Fixed React array keys:** Replaced array index keys with stable unique IDs in LandingPage.tsx (STATS, FEATURES, TESTIMONIALS, PRICING_PLANS, FAQS)

### March 9, 2026
- Updated all company contact information to Bisa Group LLC
- Created Contact Page (/contact)
- Updated branding.ts with all company details
- Updated email_service.py with new sender (bisafit@bisagroup.org) and reply-to
- Added 6 new transactional email templates
- Updated Terms of Service in Supabase to v1.1
- Updated Privacy Policy in Supabase to v1.1
- Updated Landing Page footer
- Updated Legal Document Page footer
- **DEPLOYMENT FIX:** Replaced all hardcoded URLs in email_service.py with APP_BASE_URL environment variable

### May 8, 2026 - Critical Bug Fixes
- **P0 FIX - Blank Screen:** Fixed Vite/Supabase connection error by updating `client.ts` to use correct env var `VITE_SUPABASE_PUBLISHABLE_KEY` instead of `VITE_SUPABASE_ANON_KEY`
- **P1 FIX - Workout Regeneration Bug:** Fixed issue where regenerated plans showed all rest days. Root cause: `selectedPlanId` was cached to old plan after regeneration. Added `setSelectedPlanId(null)` before refetch in `handleGeneratePlan` (Plan.tsx line 189)
- **P2 FIX - Supabase Schema Mismatch:** Fixed `column plans.block_number does not exist` error. Removed direct queries to non-existent `block_number` column. Now reads `block_number` from `plan_json` field instead. Updated:
  - `blockEngine.ts` - recomputeUserBlocks, getNextBlockNumber functions
  - `usePlan.ts` - plan summaries building
  - `useCalendarSync.ts` - plan fetching
  - `useWorkoutReschedule.ts` - calendar event creation
- **P3 FIX - Plan Page Crash:** Added missing `workouts` to destructured variables in Plan.tsx
- **P4 FIX - Stale Date Detection:** Plan page now detects if plan start_date is >8 weeks old and falls back to current calendar week
- **P5 FIX - Home Page "This Week" Calendar:** Fixed hardcoded dates to show actual current week dates (May 4-10)
- **P6 FIX - Timezone Support:** Plan generation now sends user's local Monday date to backend
- **P7 FIX - Program Start Date Sync:** Updates `program_start_date` in users_profile when regenerating plan
- **P8 FIX - Legal Pages Fallback:** Added fallback content for Terms and Privacy pages when Supabase data unavailable

### Testing Report (May 8, 2026)
- Backend API: 100% pass (16/16 tests)
- Frontend: All pages rendering correctly
- Test specs created: landing-page.spec.ts, auth-pages.spec.ts, core-flows.spec.ts, new-user-clean-slate.spec.ts, test_api.py

### May 8, 2026 - New User Clean Slate & iOS Fixes
- **P9 FIX - Mock Data Removed:** New users now see clean slate:
  - Home.tsx: todayStats show 0 for calories, water, steps (was 1450, 5, 6234)
  - Progress.tsx: weightData is empty array, measurements have null values
  - Daily progress shows 0% instead of fake 72%
- **P10 FIX - iOS Blank Screen:** 
  - Added ErrorBoundary component to catch JS errors and show fallback UI
  - Added Supabase config validation with helpful error messages for native builds
  - Ensures app shows error message instead of blank screen on crash
- **P11 FIX - OpenAI Integration:** Updated OPENAI_API_KEY and added AI-powered meal plan generation endpoint

## Known Stubbed/Mocked Features
- `att.ts` - App Tracking Transparency stubbed for web (only works on iOS native)
- `client.ts` - Secure storage simplified for web (only uses localStorage)

### August 4, 2026 - React Native (Expo) App Created
- **NEW APP:** Built complete React Native app using Expo SDK 52 + Expo Router v4
- **Why:** Capacitor WebView was causing blank screen on iOS TestFlight
- **Location:** `/app/mobile/`
- **Screens implemented:**
  - Auth: Login, Signup, Forgot Password
  - Home: Dashboard with today's workout, stats, goals
  - Plan: Weekly workout calendar with navigation
  - Nutrition: Calorie/macro tracking, meal logging
  - Progress: Weight tracking, simple charts, entry history
  - Settings: Profile, subscription, support links
  - Workout Player: Exercise list with checkboxes, completion tracking
  - Onboarding: 4-step flow (name, goal, experience, days)
  - Paywall: Subscription plans with Stripe web checkout
- **Connects to:** Same Supabase database and bisafit.com backend API
- **Bundle ID:** `com.bisagroup.bisafit` (unchanged for App Store continuity)

---
Last Updated: August 4, 2026
