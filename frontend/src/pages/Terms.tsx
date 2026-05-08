/**
 * Terms of Service Page
 * Public route - no authentication required
 */

import { useLegalDocument } from '@/hooks/useLegalDocuments';
import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage';
import type { LegalDocument } from '@/types/legal';

// Fallback Terms of Service content when database document is unavailable
const FALLBACK_TERMS: LegalDocument = {
  id: 'fallback-terms',
  doc_type: 'terms',
  version: '1.1',
  title: 'Terms of Service',
  content_markdown: `# Terms of Service

**Last Updated: May 8, 2026**
**Version: 1.1**

Welcome to BisaFit! These Terms of Service ("Terms") govern your use of the BisaFit mobile application and website (collectively, the "Service"), operated by Bisa Group LLC ("we," "us," or "our").

## 1. About BisaFit

BisaFit is an AI-powered fitness application that provides personalized workout plans, nutrition guidance, and progress tracking tools.

## 2. Eligibility

You must be at least 18 years old to use BisaFit. By using the Service, you represent that you meet this age requirement.

## 3. Account Registration

To access certain features, you must create an account. You agree to:
- Provide accurate and complete information
- Maintain the security of your account credentials
- Accept responsibility for all activities under your account

## 4. Subscription and Payments

### 4.1 Subscription Plans
BisaFit offers subscription plans that provide access to premium features.

### 4.2 Billing
Subscriptions are billed in advance on a recurring basis (monthly or annually). You authorize us to charge your payment method.

### 4.3 Cancellation
You may cancel your subscription at any time through the app settings or by contacting support.

## 5. Health Disclaimer

**BisaFit is not a medical service.** The workout plans and nutrition suggestions provided are for general fitness purposes only. Always consult with a healthcare professional before starting any new fitness program.

## 6. Intellectual Property

All content, features, and functionality of BisaFit are owned by Bisa Group LLC and protected by intellectual property laws.

## 7. Limitation of Liability

BisaFit is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages.

## 8. Contact Us

**Bisa Group LLC**
1111 S Hamilton St
Dalton, GA 30720
United States

**Email:** support@bisagroup.org
**Phone:** +1 (918) 248-6269

---

*By using BisaFit, you acknowledge that you have read, understood, and agree to these Terms of Service.*`,
  is_active: true,
  published_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function Terms() {
  const { document, loading, error } = useLegalDocument('terms');

  // Use fallback content if no document in database
  const displayDocument = document || (!loading && !error ? FALLBACK_TERMS : null);

  return (
    <LegalDocumentPage
      document={displayDocument}
      loading={loading}
      error={error}
      fallbackTitle="Terms of Service"
    />
  );
}
