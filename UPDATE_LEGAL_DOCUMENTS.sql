-- =====================================================
-- UPDATE BISAFIT LEGAL DOCUMENTS
-- Run this in Supabase SQL Editor to update with 
-- official Bisa Group LLC company information
-- =====================================================

-- Update Terms of Service (version 1.1)
UPDATE public.legal_documents 
SET 
    content_markdown = '# Terms of Service

**Last Updated: March 9, 2026**
**Version: 1.1**

Welcome to BisaFit! These Terms of Service ("Terms") govern your use of the BisaFit mobile application and website (collectively, the "Service"), operated by Bisa Group LLC ("we," "us," or "our").

By accessing or using BisaFit, you agree to be bound by these Terms. If you do not agree, please do not use the Service.

---

## 1. About BisaFit

BisaFit is an AI-powered fitness application that provides personalized workout plans, nutrition guidance, and progress tracking tools to help you achieve your health and fitness goals.

---

## 2. Eligibility

You must be at least 18 years old to use BisaFit. By using the Service, you represent that you meet this age requirement and have the legal capacity to enter into these Terms.

---

## 3. Account Registration

To access certain features, you must create an account. You agree to:
- Provide accurate and complete information during registration
- Maintain the security of your account credentials
- Promptly update any changes to your information
- Accept responsibility for all activities under your account

We reserve the right to suspend or terminate accounts that violate these Terms.

---

## 4. Subscription and Payments

### 4.1 Subscription Plans
BisaFit offers subscription plans that provide access to premium features. Pricing and features are displayed at the time of purchase.

### 4.2 Billing
- Subscriptions are billed in advance on a recurring basis (monthly or annually)
- Your payment method will be charged automatically at the start of each billing period
- All fees are non-refundable except as required by law or stated in our refund policy

### 4.3 Cancellation
You may cancel your subscription at any time through your account settings or by contacting us. Cancellation takes effect at the end of the current billing period.

---

## 5. User Conduct

You agree not to:
- Use the Service for any illegal purpose
- Share your account credentials with others
- Attempt to gain unauthorized access to our systems
- Interfere with or disrupt the Service
- Upload malicious content or harmful code
- Harass, abuse, or harm other users
- Violate any applicable laws or regulations

---

## 6. Health Disclaimer

**BisaFit is not a medical service.** The workout plans, nutrition information, and other content provided through the Service are for informational and educational purposes only.

- Always consult a qualified healthcare provider before starting any fitness or nutrition program
- The Service does not provide medical advice, diagnosis, or treatment
- We are not responsible for any injuries or health issues resulting from your use of the Service
- Listen to your body and stop any activity that causes pain or discomfort

---

## 7. Intellectual Property

### 7.1 Our Content
All content, features, and functionality of the Service (including text, graphics, logos, and software) are owned by Bisa Group LLC and protected by intellectual property laws.

### 7.2 Your Content
You retain ownership of any content you submit to the Service. By submitting content, you grant us a license to use, modify, and display it in connection with providing the Service.

---

## 8. Third-Party Services

BisaFit may integrate with third-party services (such as Apple Health, Google Fit, Fitbit, and Strava). Your use of these services is subject to their respective terms and privacy policies. We are not responsible for third-party services.

---

## 9. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, BISA GROUP LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.

Our total liability shall not exceed the amount you paid to us in the twelve (12) months preceding the claim.

---

## 10. Indemnification

You agree to indemnify and hold harmless Bisa Group LLC and its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.

---

## 11. Modifications

We may modify these Terms at any time. We will notify you of material changes by:
- Posting the updated Terms on the Service
- Sending you an email notification
- Displaying a notice within the app

Your continued use of the Service after changes take effect constitutes acceptance of the modified Terms.

---

## 12. Termination

We may terminate or suspend your access to the Service immediately, without prior notice, for conduct that we believe:
- Violates these Terms
- Is harmful to other users or the Service
- Exposes us to legal liability

---

## 13. Governing Law

These Terms shall be governed by and construed in accordance with the laws of the State of Oklahoma, United States, without regard to its conflict of law provisions.

---

## 14. Dispute Resolution

Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration in Tulsa, Oklahoma, in accordance with the rules of the American Arbitration Association.

---

## 15. Contact Us

If you have questions about these Terms, please contact us:

**Bisa Group LLC**
3171 S 129th E Ave
Ste A #5254
Tulsa, OK 74134
United States

**Email:** support@bisagroup.org
**Phone:** +1 (918) 248-6269

---

## 16. Entire Agreement

These Terms, together with our Privacy Policy, constitute the entire agreement between you and Bisa Group LLC regarding the Service and supersede all prior agreements.

---

*Thank you for using BisaFit. We''re committed to helping you achieve your fitness goals!*',
    version = '1.1',
    updated_at = NOW()
WHERE doc_type = 'terms' AND is_active = true;

-- Update Privacy Policy (version 1.1)
UPDATE public.legal_documents 
SET 
    content_markdown = '# Privacy Policy

**Last Updated: March 9, 2026**
**Version: 1.1**

Bisa Group LLC ("we," "us," or "our") operates the BisaFit application and website. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.

---

## Data Controller

**Bisa Group LLC**
3171 S 129th E Ave
Ste A #5254
Tulsa, OK 74134
United States

**Contact Email:** support@bisagroup.org
**Phone:** +1 (918) 248-6269

---

## 1. Information We Collect

### 1.1 Information You Provide
- **Account Information:** Name, email address, password
- **Profile Information:** Age, gender, height, weight, fitness goals
- **Fitness Data:** Workout logs, exercise preferences, progress photos
- **Payment Information:** Processed securely through our payment provider (Stripe)
- **Communications:** Messages you send us via email or support channels

### 1.2 Information Collected Automatically
- **Usage Data:** Features you use, pages visited, time spent in the app
- **Device Information:** Device type, operating system, unique device identifiers
- **Log Data:** IP address, browser type, access times

### 1.3 Information from Third Parties
If you connect health platforms (Apple Health, Google Fit, Fitbit, Strava), we may receive:
- Activity data (steps, workouts, calories)
- Health metrics (heart rate, sleep data)
- Exercise history

---

## 2. How We Use Your Information

We use your information to:
- Provide and improve the BisaFit service
- Generate personalized workout and nutrition plans
- Process payments and manage subscriptions
- Send transactional emails (account verification, billing, updates)
- Communicate about new features and promotions (with your consent)
- Analyze usage patterns to enhance user experience
- Ensure security and prevent fraud
- Comply with legal obligations

---

## 3. Sharing Your Information

We may share your information with:

### 3.1 Service Providers
Third parties that help us operate the Service:
- Cloud hosting providers (infrastructure)
- Payment processors (Stripe)
- Email service providers (Resend)
- Analytics providers

### 3.2 Legal Requirements
We may disclose your information if required by law or to:
- Comply with legal process
- Protect our rights and property
- Prevent fraud or security issues
- Protect user safety

### 3.3 Business Transfers
In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.

**We do not sell your personal information to third parties.**

---

## 4. Data Retention

We retain your information for as long as your account is active or as needed to provide the Service. After account deletion, we may retain certain information for:
- Legal compliance
- Dispute resolution
- Fraud prevention
- Enforcing our agreements

---

## 5. Your Rights and Choices

### 5.1 Account Settings
You can update your profile information through the app settings.

### 5.2 Communication Preferences
You can opt out of promotional emails by clicking "unsubscribe" in any email or adjusting your notification settings.

### 5.3 Data Access and Deletion
You may request access to, correction of, or deletion of your personal data by contacting us at support@bisagroup.org.

### 5.4 Health Platform Connections
You can disconnect third-party health platforms at any time through the app settings.

---

## 6. Data Security

We implement industry-standard security measures to protect your information:
- Encryption in transit (HTTPS/TLS)
- Secure password hashing
- Regular security assessments
- Access controls and authentication

However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.

---

## 7. Children''s Privacy

BisaFit is not intended for children under 18. We do not knowingly collect information from children. If we discover we have collected information from a child under 18, we will delete it promptly.

---

## 8. International Data Transfers

Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for international transfers.

---

## 9. Third-Party Links

The Service may contain links to third-party websites or services. We are not responsible for their privacy practices. Please review their privacy policies before providing any information.

---

## 10. Transactional Emails

BisaFit may send transactional emails related to:
- Account verification and security
- Password reset requests
- Billing and payment receipts
- Subscription status updates
- Legal document updates
- Product announcements (optional)

These emails are sent from: **BisaFit <bisafit@bisagroup.org>**
Reply to: **support@bisagroup.org**

---

## 11. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of material changes by:
- Posting the new policy on the Service
- Sending an email notification
- Displaying a notice in the app

Your continued use of the Service after changes take effect constitutes acceptance.

---

## 12. Contact Us

If you have questions about this Privacy Policy or our data practices, please contact us:

**Bisa Group LLC**
3171 S 129th E Ave
Ste A #5254
Tulsa, OK 74134
United States

**Email:** support@bisagroup.org
**Phone:** +1 (918) 248-6269

---

*Your privacy is important to us. Thank you for trusting BisaFit with your fitness journey.*',
    version = '1.1',
    updated_at = NOW()
WHERE doc_type = 'privacy' AND is_active = true;

-- If no active documents exist, insert them
INSERT INTO public.legal_documents (doc_type, version, title, content_markdown, is_active, published_at)
SELECT 'terms', '1.1', 'Terms of Service', 
'# Terms of Service

**Last Updated: March 9, 2026**
**Version: 1.1**

Welcome to BisaFit! These Terms of Service ("Terms") govern your use of the BisaFit mobile application and website (collectively, the "Service"), operated by Bisa Group LLC ("we," "us," or "our").

By accessing or using BisaFit, you agree to be bound by these Terms. If you do not agree, please do not use the Service.

---

## 1. About BisaFit

BisaFit is an AI-powered fitness application that provides personalized workout plans, nutrition guidance, and progress tracking tools to help you achieve your health and fitness goals.

---

## 2. Eligibility

You must be at least 18 years old to use BisaFit. By using the Service, you represent that you meet this age requirement and have the legal capacity to enter into these Terms.

---

## 3. Account Registration

To access certain features, you must create an account. You agree to:
- Provide accurate and complete information during registration
- Maintain the security of your account credentials
- Promptly update any changes to your information
- Accept responsibility for all activities under your account

We reserve the right to suspend or terminate accounts that violate these Terms.

---

## 4. Subscription and Payments

### 4.1 Subscription Plans
BisaFit offers subscription plans that provide access to premium features. Pricing and features are displayed at the time of purchase.

### 4.2 Billing
- Subscriptions are billed in advance on a recurring basis (monthly or annually)
- Your payment method will be charged automatically at the start of each billing period
- All fees are non-refundable except as required by law or stated in our refund policy

### 4.3 Cancellation
You may cancel your subscription at any time through your account settings or by contacting us. Cancellation takes effect at the end of the current billing period.

---

## 5. User Conduct

You agree not to:
- Use the Service for any illegal purpose
- Share your account credentials with others
- Attempt to gain unauthorized access to our systems
- Interfere with or disrupt the Service
- Upload malicious content or harmful code
- Harass, abuse, or harm other users
- Violate any applicable laws or regulations

---

## 6. Health Disclaimer

**BisaFit is not a medical service.** The workout plans, nutrition information, and other content provided through the Service are for informational and educational purposes only.

- Always consult a qualified healthcare provider before starting any fitness or nutrition program
- The Service does not provide medical advice, diagnosis, or treatment
- We are not responsible for any injuries or health issues resulting from your use of the Service
- Listen to your body and stop any activity that causes pain or discomfort

---

## 7. Intellectual Property

### 7.1 Our Content
All content, features, and functionality of the Service (including text, graphics, logos, and software) are owned by Bisa Group LLC and protected by intellectual property laws.

### 7.2 Your Content
You retain ownership of any content you submit to the Service. By submitting content, you grant us a license to use, modify, and display it in connection with providing the Service.

---

## 8. Third-Party Services

BisaFit may integrate with third-party services (such as Apple Health, Google Fit, Fitbit, and Strava). Your use of these services is subject to their respective terms and privacy policies. We are not responsible for third-party services.

---

## 9. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, BISA GROUP LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.

Our total liability shall not exceed the amount you paid to us in the twelve (12) months preceding the claim.

---

## 10. Indemnification

You agree to indemnify and hold harmless Bisa Group LLC and its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.

---

## 11. Modifications

We may modify these Terms at any time. We will notify you of material changes by:
- Posting the updated Terms on the Service
- Sending you an email notification
- Displaying a notice within the app

Your continued use of the Service after changes take effect constitutes acceptance of the modified Terms.

---

## 12. Termination

We may terminate or suspend your access to the Service immediately, without prior notice, for conduct that we believe:
- Violates these Terms
- Is harmful to other users or the Service
- Exposes us to legal liability

---

## 13. Governing Law

These Terms shall be governed by and construed in accordance with the laws of the State of Oklahoma, United States, without regard to its conflict of law provisions.

---

## 14. Dispute Resolution

Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration in Tulsa, Oklahoma, in accordance with the rules of the American Arbitration Association.

---

## 15. Contact Us

If you have questions about these Terms, please contact us:

**Bisa Group LLC**
3171 S 129th E Ave
Ste A #5254
Tulsa, OK 74134
United States

**Email:** support@bisagroup.org
**Phone:** +1 (918) 248-6269

---

## 16. Entire Agreement

These Terms, together with our Privacy Policy, constitute the entire agreement between you and Bisa Group LLC regarding the Service and supersede all prior agreements.

---

*Thank you for using BisaFit. We''re committed to helping you achieve your fitness goals!*',
true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.legal_documents WHERE doc_type = 'terms' AND is_active = true);

INSERT INTO public.legal_documents (doc_type, version, title, content_markdown, is_active, published_at)
SELECT 'privacy', '1.1', 'Privacy Policy',
'# Privacy Policy

**Last Updated: March 9, 2026**
**Version: 1.1**

Bisa Group LLC ("we," "us," or "our") operates the BisaFit application and website. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.

---

## Data Controller

**Bisa Group LLC**
3171 S 129th E Ave
Ste A #5254
Tulsa, OK 74134
United States

**Contact Email:** support@bisagroup.org
**Phone:** +1 (918) 248-6269

---

## 1. Information We Collect

### 1.1 Information You Provide
- **Account Information:** Name, email address, password
- **Profile Information:** Age, gender, height, weight, fitness goals
- **Fitness Data:** Workout logs, exercise preferences, progress photos
- **Payment Information:** Processed securely through our payment provider (Stripe)
- **Communications:** Messages you send us via email or support channels

### 1.2 Information Collected Automatically
- **Usage Data:** Features you use, pages visited, time spent in the app
- **Device Information:** Device type, operating system, unique device identifiers
- **Log Data:** IP address, browser type, access times

### 1.3 Information from Third Parties
If you connect health platforms (Apple Health, Google Fit, Fitbit, Strava), we may receive:
- Activity data (steps, workouts, calories)
- Health metrics (heart rate, sleep data)
- Exercise history

---

## 2. How We Use Your Information

We use your information to:
- Provide and improve the BisaFit service
- Generate personalized workout and nutrition plans
- Process payments and manage subscriptions
- Send transactional emails (account verification, billing, updates)
- Communicate about new features and promotions (with your consent)
- Analyze usage patterns to enhance user experience
- Ensure security and prevent fraud
- Comply with legal obligations

---

## 3. Sharing Your Information

We may share your information with:

### 3.1 Service Providers
Third parties that help us operate the Service:
- Cloud hosting providers (infrastructure)
- Payment processors (Stripe)
- Email service providers (Resend)
- Analytics providers

### 3.2 Legal Requirements
We may disclose your information if required by law or to:
- Comply with legal process
- Protect our rights and property
- Prevent fraud or security issues
- Protect user safety

### 3.3 Business Transfers
In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.

**We do not sell your personal information to third parties.**

---

## 4. Data Retention

We retain your information for as long as your account is active or as needed to provide the Service. After account deletion, we may retain certain information for:
- Legal compliance
- Dispute resolution
- Fraud prevention
- Enforcing our agreements

---

## 5. Your Rights and Choices

### 5.1 Account Settings
You can update your profile information through the app settings.

### 5.2 Communication Preferences
You can opt out of promotional emails by clicking "unsubscribe" in any email or adjusting your notification settings.

### 5.3 Data Access and Deletion
You may request access to, correction of, or deletion of your personal data by contacting us at support@bisagroup.org.

### 5.4 Health Platform Connections
You can disconnect third-party health platforms at any time through the app settings.

---

## 6. Data Security

We implement industry-standard security measures to protect your information:
- Encryption in transit (HTTPS/TLS)
- Secure password hashing
- Regular security assessments
- Access controls and authentication

However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.

---

## 7. Children''s Privacy

BisaFit is not intended for children under 18. We do not knowingly collect information from children. If we discover we have collected information from a child under 18, we will delete it promptly.

---

## 8. International Data Transfers

Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for international transfers.

---

## 9. Third-Party Links

The Service may contain links to third-party websites or services. We are not responsible for their privacy practices. Please review their privacy policies before providing any information.

---

## 10. Transactional Emails

BisaFit may send transactional emails related to:
- Account verification and security
- Password reset requests
- Billing and payment receipts
- Subscription status updates
- Legal document updates
- Product announcements (optional)

These emails are sent from: **BisaFit <bisafit@bisagroup.org>**
Reply to: **support@bisagroup.org**

---

## 11. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of material changes by:
- Posting the new policy on the Service
- Sending an email notification
- Displaying a notice in the app

Your continued use of the Service after changes take effect constitutes acceptance.

---

## 12. Contact Us

If you have questions about this Privacy Policy or our data practices, please contact us:

**Bisa Group LLC**
3171 S 129th E Ave
Ste A #5254
Tulsa, OK 74134
United States

**Email:** support@bisagroup.org
**Phone:** +1 (918) 248-6269

---

*Your privacy is important to us. Thank you for trusting BisaFit with your fitness journey.*',
true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.legal_documents WHERE doc_type = 'privacy' AND is_active = true);

-- Verify the updates
SELECT doc_type, version, title, is_active, updated_at 
FROM public.legal_documents 
WHERE is_active = true;
