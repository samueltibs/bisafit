/**
 * Paywall Page
 * 
 * Full-screen paywall for subscription signup.
 */

import { Paywall } from '@/components/subscription/Paywall';
import { useLocation } from 'react-router-dom';

export default function PaywallPage() {
  const location = useLocation();
  const from = location.state?.from || '/home';

  return <Paywall redirectAfterTrial={from} />;
}
