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

### 5. Mobile App Preparation
- Capacitor configured for Android
- ANDROID_BUILD_GUIDE.md created for local builds

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

---
Last Updated: March 9, 2026
