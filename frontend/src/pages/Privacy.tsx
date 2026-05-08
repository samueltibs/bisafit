/**
 * Privacy Policy Page
 * Public route - no authentication required
 */

import { useLegalDocument } from '@/hooks/useLegalDocuments';
import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage';
import type { LegalDocument } from '@/types/legal';

/**
 * Health & Fitness Data Section
 *
 * Data we collect:
 * - Workout history (exercises, sets, reps, duration)
 * - Body measurements (weight, BMI, body fat percentage if entered)
 * - Activity data from Apple Health or Google Fit (steps, heart rate, active calories) — only with your explicit permission
 * - Self-reported nutrition and meal logs
 *
 * Health data is stored on Bisa Group LLC's encrypted Supabase infrastructure.
 * We never sell health data, never share it with insurers or employers, and never
 * use it for advertising. You can export or delete all health data anytime via
 * Settings → Privacy. EU users (GDPR) and California users (CCPA) have additional
 * rights to access, rectify, delete, and restrict processing of their data.
 */
export const HEALTH_FITNESS_DATA_SECTION = {
  title: 'Health & Fitness Data',
  dataCollected: [
    'Workout history (exercises, sets, reps, duration)',
    'Body measurements (weight, BMI, body fat percentage if entered)',
    'Activity data from Apple Health or Google Fit (steps, heart rate, active calories) — only with your explicit permission',
    'Self-reported nutrition and meal logs',
  ],
  storagePolicy:
    "Health data is stored on Bisa Group LLC's encrypted Supabase infrastructure. We never sell health data, never share it with insurers or employers, and never use it for advertising. You can export or delete all health data anytime via Settings &#8594; Privacy. EU users (GDPR) and California users (CCPA) have additional rights to access, rectify, delete, and restrict processing of their data.",
};

// Fallback Privacy Policy content when database document is unavailable
const FALLBACK_PRIVACY_POLICY: LegalDocument = {
  id: 'fallback-privacy',
  doc_type: 'privacy',
  version: '1.1',
  title: 'Privacy Policy',
  content_markdown: `# Privacy Policy

**Last Updated: May 8, 2026**
**Version: 1.1**

## 1. Introduction

Bisa Group LLC ("we," "us," or "our") operates the BisaFit mobile application and website. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.

## 2. Information We Collect

### Personal Information
- Name, email address, and account credentials
- Age, gender, and fitness goals (for personalization)
- Payment information (processed securely via Stripe)

### Health & Fitness Data
- Workout history (exercises, sets, reps, duration)
- Body measurements (weight, BMI, body fat percentage if entered)
- Activity data from Apple Health or Google Fit (with your permission)
- Self-reported nutrition and meal logs

### Usage Data
- App usage patterns and feature interactions
- Device information and IP addresses

## 3. How We Use Your Information

- Provide personalized workout and nutrition recommendations
- Process subscription payments
- Improve our services and user experience
- Send important service notifications
- Comply with legal obligations

## 4. Data Security

Your data is stored on encrypted Supabase infrastructure. We implement industry-standard security measures to protect your information.

## 5. Your Rights

You have the right to:
- Access your personal data
- Request data deletion
- Export your data
- Opt-out of marketing communications

## 6. Contact Us

**Bisa Group LLC**
1111 S Hamilton St
Dalton, GA 30720
United States

**Email:** support@bisagroup.org
**Phone:** +1 (918) 248-6269

---

*Your privacy is important to us. Thank you for trusting BisaFit with your fitness journey.*`,
  is_active: true,
  published_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function Privacy() {
  const { document, loading, error } = useLegalDocument('privacy');

  // Use fallback content if no document in database
  const displayDocument = document || (!loading && !error ? FALLBACK_PRIVACY_POLICY : null);

  return (
    <LegalDocumentPage
      document={displayDocument}
      loading={loading}
      error={error}
      fallbackTitle="Privacy Policy"
    />
  );
}
