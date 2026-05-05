/**
 * Privacy Policy Page
 * Public route - no authentication required
 */

import { useLegalDocument } from '@/hooks/useLegalDocuments';
import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage';

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

export default function Privacy() {
  const { document, loading, error } = useLegalDocument('privacy');

  return (
    <LegalDocumentPage
      document={document}
      loading={loading}
      error={error}
      fallbackTitle="Privacy Policy"
    />
  );
}
