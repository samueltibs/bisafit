/**
 * Contact Page Component
 * Displays official company contact information for BisaFit / Bisa Group LLC
 */

import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Building2,
  MessageSquare,
  Briefcase,
  CreditCard,
  Users,
  Dumbbell
} from 'lucide-react';
import { 
  APP_NAME, 
  COMPANY_NAME, 
  COMPANY_ADDRESS,
  COMPANY_PHONE,
  EMAIL_SUPPORT,
  EMAIL_INFO,
  EMAIL_PARTNERS,
  EMAIL_BILLING
} from '@/lib/branding';

const CONTACT_METHODS = [
  {
    icon: MessageSquare,
    title: 'Customer Support',
    description: 'General questions and help with your account',
    email: EMAIL_SUPPORT,
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: Briefcase,
    title: 'General Business Inquiries',
    description: 'Business-related questions and opportunities',
    email: EMAIL_INFO,
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    icon: Users,
    title: 'Partnerships',
    description: 'Collaboration and partnership opportunities',
    email: EMAIL_PARTNERS,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: CreditCard,
    title: 'Billing Questions',
    description: 'Subscription and payment inquiries',
    email: EMAIL_BILLING,
    gradient: 'from-orange-500 to-amber-600',
  },
];

export default function ContactPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="public-page min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-white">{APP_NAME}</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-2 mb-6">
            <Mail className="h-4 w-4 text-violet-400" />
            <span className="text-violet-300 text-sm font-medium">Get in Touch</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Have questions or need assistance? We're here to help you on your fitness journey.
          </p>
        </div>

        {/* Company Info Card */}
        <Card className="bg-slate-900/50 border-white/10 mb-12">
          <CardContent className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Dumbbell className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{APP_NAME}</h2>
                <p className="text-white/60">A product of {COMPANY_NAME}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Details */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-violet-400 mt-0.5" />
                  <div>
                    <p className="text-white/50 text-sm">Email</p>
                    <a 
                      href={`mailto:${EMAIL_SUPPORT}`} 
                      className="text-white hover:text-violet-400 transition-colors"
                    >
                      {EMAIL_SUPPORT}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-violet-400 mt-0.5" />
                  <div>
                    <p className="text-white/50 text-sm">Phone</p>
                    <a 
                      href={`tel:${COMPANY_PHONE.replace(/\D/g, '')}`}
                      className="text-white hover:text-violet-400 transition-colors"
                    >
                      {COMPANY_PHONE}
                    </a>
                  </div>
                </div>
              </div>

              {/* Mailing Address */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-violet-400 mt-0.5" />
                <div>
                  <p className="text-white/50 text-sm">Mailing Address</p>
                  <address className="text-white not-italic">
                    <p>{COMPANY_NAME}</p>
                    <p>{COMPANY_ADDRESS.street}</p>
                    <p>{COMPANY_ADDRESS.suite}</p>
                    <p>{COMPANY_ADDRESS.city}, {COMPANY_ADDRESS.state} {COMPANY_ADDRESS.zip}</p>
                    <p>{COMPANY_ADDRESS.country}</p>
                  </address>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Methods Grid */}
        <h3 className="text-2xl font-bold text-white mb-6">How Can We Help?</h3>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {CONTACT_METHODS.map((method, index) => (
            <Card 
              key={index} 
              className="bg-slate-900/50 border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${method.gradient} flex items-center justify-center mb-4`}>
                  <method.icon className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{method.title}</h4>
                <p className="text-white/60 text-sm mb-4">{method.description}</p>
                <a 
                  href={`mailto:${method.email}`}
                  className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {method.email}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Legal Links */}
        <div className="text-center border-t border-white/10 pt-8">
          <div className="flex items-center justify-center gap-4 text-sm text-white/50">
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <span>|</span>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
          <p className="mt-4 text-sm text-white/40">
            © {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
