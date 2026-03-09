/**
 * BisaFit Premium Landing Page
 * A vibrant, exciting marketing landing page for the fitness SaaS
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  Dumbbell, 
  Utensils, 
  TrendingUp, 
  Sparkles, 
  Check, 
  ChevronDown,
  ChevronUp,
  Apple,
  Play,
  ArrowRight,
  Star,
  Zap,
  Calendar,
  Target,
  Heart,
  Shield,
  Users,
  Award,
  Loader2,
  Flame,
  Activity,
  Timer,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Images from Unsplash
const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1540580015362-b650926ff6d7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwd29ya291dHxlbnwwfHx8Ymx1ZXwxNzcyNTEyNDMwfDA&ixlib=rb-4.1.0&q=85',
  feature1: 'https://images.unsplash.com/photo-1603077492340-e6e62b2a688b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwxfHxneW18ZW58MHx8fGJsdWV8MTc3MjUxMjQzOHww&ixlib=rb-4.1.0&q=85',
  feature2: 'https://images.unsplash.com/photo-1594269807754-7b7926246d65?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwzfHxneW18ZW58MHx8fGJsdWV8MTc3MjUxMjQzOHww&ixlib=rb-4.1.0&q=85',
  testimonials: 'https://images.unsplash.com/photo-1541694458248-5aa2101c77df?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwyfHxneW18ZW58MHx8fGJsdWV8MTc3MjUxMjQzOHww&ixlib=rb-4.1.0&q=85',
  yoga: 'https://images.unsplash.com/photo-1578882113036-761708189373?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHw0fHxmaXRuZXNzJTIwd29ya291dHxlbnwwfHx8Ymx1ZXwxNzcyNTEyNDMwfDA&ixlib=rb-4.1.0&q=85',
};

// Feature data with gradient colors
const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-Powered Workouts',
    description: 'Personalized plans that evolve with you, powered by cutting-edge AI technology.',
    gradient: 'from-violet-500 to-purple-600',
    bgGradient: 'from-violet-500/20 to-purple-600/20',
  },
  {
    icon: Utensils,
    title: 'Smart Nutrition',
    description: 'Custom meal plans and macro tracking to fuel your transformation journey.',
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-500/20 to-teal-600/20',
  },
  {
    icon: TrendingUp,
    title: 'Progress Analytics',
    description: 'Beautiful charts and insights that keep you motivated every step of the way.',
    gradient: 'from-blue-500 to-cyan-600',
    bgGradient: 'from-blue-500/20 to-cyan-600/20',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Flexible workout plans that adapt to your busy lifestyle automatically.',
    gradient: 'from-orange-500 to-amber-600',
    bgGradient: 'from-orange-500/20 to-amber-600/20',
  },
  {
    icon: Heart,
    title: 'Health Sync',
    description: 'Connect Apple Health, Google Fit, Fitbit, and Strava seamlessly.',
    gradient: 'from-rose-500 to-pink-600',
    bgGradient: 'from-rose-500/20 to-pink-600/20',
  },
  {
    icon: Trophy,
    title: 'Goal Tracking',
    description: 'Set ambitious goals and crush them with our intelligent milestone system.',
    gradient: 'from-yellow-500 to-orange-600',
    bgGradient: 'from-yellow-500/20 to-orange-600/20',
  },
];

// Stats
const STATS = [
  { value: '10K+', label: 'Active Users', icon: Users },
  { value: '500K+', label: 'Workouts Completed', icon: Flame },
  { value: '98%', label: 'Satisfaction Rate', icon: Star },
  { value: '24/7', label: 'AI Support', icon: Zap },
];

// Pricing plans
const PRICING_PLANS = [
  {
    name: 'Monthly',
    price: '$14.99',
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      'AI workout generation',
      'Nutrition guidance',
      'Progress tracking',
      'Exercise library',
      'Health app sync',
      'Cancel anytime',
    ],
    popular: false,
    gradient: 'from-slate-800 to-slate-900',
    buttonVariant: 'outline' as const,
  },
  {
    name: 'Annual',
    price: '$11.24',
    period: '/month',
    billedAs: 'Billed at $134.91/year',
    description: '3 months FREE! 🎉',
    features: [
      'Everything in Monthly',
      'Priority support',
      'Early feature access',
      'Exclusive content',
      'Advanced analytics',
      'Save $44.97/year',
    ],
    popular: true,
    gradient: 'from-violet-600 to-purple-700',
    buttonVariant: 'default' as const,
  },
];

// Testimonials
const TESTIMONIALS = [
  {
    name: 'Sarah Mitchell',
    role: 'Lost 30 lbs in 4 months',
    content: 'BisaFit transformed my relationship with fitness. The AI workouts are incredibly smart and the progress tracking keeps me motivated!',
    rating: 5,
    avatar: '👩‍💼',
  },
  {
    name: 'James Rodriguez',
    role: 'Gained 15 lbs of muscle',
    content: 'Finally an app that understands my goals. The personalized plans are exactly what I needed to break through my plateau.',
    rating: 5,
    avatar: '👨‍💻',
  },
  {
    name: 'Emily Chen',
    role: 'Marathon finisher',
    content: 'The Strava integration is seamless. BisaFit helped me balance strength training with my running schedule perfectly.',
    rating: 5,
    avatar: '👩‍🎨',
  },
];

// FAQ data
const FAQS = [
  {
    question: 'How does the AI workout generation work?',
    answer: 'Our AI analyzes your fitness goals, current level, available equipment, and schedule to create perfectly tailored workout plans. It learns from your feedback and progress to continuously optimize your training.',
  },
  {
    question: 'Can I use BisaFit without any equipment?',
    answer: 'Absolutely! BisaFit generates effective bodyweight workouts that require zero equipment. Just tell us during onboarding and we\'ll create a plan that works for you.',
  },
  {
    question: 'Which fitness trackers can I connect?',
    answer: 'BisaFit integrates with Apple Health, Google Fit, Fitbit, and Strava. Sync your data seamlessly and see all your fitness metrics in one beautiful dashboard.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes! Cancel anytime with no questions asked. You\'ll keep access until the end of your billing period.',
  },
  {
    question: 'Is BisaFit suitable for beginners?',
    answer: 'Definitely! Our AI creates appropriate workouts for all fitness levels, from complete beginners to advanced athletes. The app grows with you.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate('/home', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleGetStarted = () => {
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text">BisaFit</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-white/70 hover:text-white transition-colors font-medium">Features</a>
              <a href="#pricing" className="text-white/70 hover:text-white transition-colors font-medium">Pricing</a>
              <a href="#testimonials" className="text-white/70 hover:text-white transition-colors font-medium">Reviews</a>
              <a href="#faq" className="text-white/70 hover:text-white transition-colors font-medium">FAQ</a>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button 
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-0"
                onClick={handleGetStarted}
              >
                Get Started
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 md:pt-32 md:pb-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-violet-600/20 to-purple-600/20 border-violet-500/30 text-violet-300">
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                AI-Powered Fitness Revolution
              </Badge>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                  Transform Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Body & Mind
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white/60 mb-10 max-w-xl mx-auto lg:mx-0">
                Your personal AI fitness coach. Get customized workouts, smart nutrition plans, and real-time progress tracking.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Button 
                  size="lg" 
                  className="text-lg px-8 h-14 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-600/25"
                  onClick={handleGetStarted}
                >
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 h-14 border-white/20 text-white hover:bg-white/10"
                  asChild
                >
                  <a href="#features">
                    See Features
                    <ChevronDown className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {STATS.map((stat, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                      <stat.icon className="h-5 w-5 text-violet-400" />
                      <span className="text-2xl font-bold text-white">{stat.value}</span>
                    </div>
                    <span className="text-sm text-white/50">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/30 to-purple-600/30 rounded-3xl blur-3xl" />
              <div className="relative">
                <img 
                  src={IMAGES.hero}
                  alt="Fitness transformation"
                  className="rounded-3xl shadow-2xl shadow-violet-600/20 border border-white/10"
                />
                {/* Floating Cards */}
                <div className="absolute -left-8 top-1/4 bg-slate-900/90 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl animate-float">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <Flame className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Daily Streak</p>
                      <p className="text-emerald-400 text-sm font-bold">🔥 14 Days</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-8 bottom-1/4 bg-slate-900/90 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl animate-float animation-delay-1000">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Calories Burned</p>
                      <p className="text-violet-400 text-sm font-bold">+2,450 kcal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/30 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-2 bg-cyan-500/10 border-cyan-500/30 text-cyan-300">
              <Zap className="h-3.5 w-3.5 mr-2" />
              Powerful Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Cutting-edge technology meets proven fitness science for your best results ever.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, index) => (
              <Card 
                key={index} 
                className={cn(
                  "group bg-slate-900/50 border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden",
                )}
              >
                <CardContent className="p-8 relative">
                  <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br", feature.bgGradient)} />
                  <div className="relative">
                    <div className={cn("h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-lg", feature.gradient)}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                    <p className="text-white/60">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-3xl blur-3xl" />
              <img 
                src={IMAGES.feature2}
                alt="App preview"
                className="relative rounded-3xl shadow-2xl border border-white/10"
              />
            </div>
            <div className="order-1 lg:order-2">
              <Badge className="mb-6 px-4 py-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
                <Timer className="h-3.5 w-3.5 mr-2" />
                Quick Results
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                See Results in Weeks, Not Months
              </h2>
              <p className="text-xl text-white/60 mb-8">
                Our AI-powered system optimizes every workout for maximum efficiency. Get personalized plans that work with your schedule and deliver real results.
              </p>
              <ul className="space-y-4">
                {[
                  'Workouts adapt to your progress in real-time',
                  'Smart recovery recommendations',
                  'Nutrition plans that complement your training',
                  'Weekly progress reports with insights'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 md:py-32 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${IMAGES.testimonials})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-2 bg-pink-500/10 border-pink-500/30 text-pink-300">
              <Star className="h-3.5 w-3.5 mr-2" />
              Success Stories
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Loved by Fitness Enthusiasts
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Join thousands who have transformed their lives with BisaFit.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <Card key={index} className="bg-slate-900/50 border-white/10 hover:border-white/20 transition-all">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-white/70 mb-6 italic text-lg">"{testimonial.content}"</p>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{testimonial.avatar}</div>
                    <div>
                      <p className="font-semibold text-white">{testimonial.name}</p>
                      <p className="text-sm text-violet-400">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/20 to-transparent" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-2 bg-violet-500/10 border-violet-500/30 text-violet-300">
              <Award className="h-3.5 w-3.5 mr-2" />
              Simple Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Choose Your Plan
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Start your transformation today. Cancel anytime, no questions asked.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {PRICING_PLANS.map((plan, index) => (
              <Card 
                key={index} 
                className={cn(
                  "relative border-2 transition-all duration-300 overflow-hidden",
                  plan.popular 
                    ? "border-violet-500/50 shadow-xl shadow-violet-600/20 scale-105" 
                    : "border-white/10 bg-slate-900/50 hover:border-white/20"
                )}
              >
                {plan.popular && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-purple-600/20" />
                    <div className="absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
                  </>
                )}
                <CardContent className="p-8 relative">
                  {plan.popular && (
                    <Badge className="absolute top-4 right-4 bg-gradient-to-r from-violet-600 to-purple-600 border-0">
                      🎁 BEST VALUE
                    </Badge>
                  )}
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-violet-300">{plan.description}</p>
                  </div>
                  
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-white">{plan.price}</span>
                      <span className="text-white/60">{plan.period}</span>
                    </div>
                    {plan.billedAs && (
                      <p className="text-sm text-white/50 mt-2">{plan.billedAs}</p>
                    )}
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className={cn(
                          "h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0",
                          plan.popular ? "bg-gradient-to-br from-violet-500 to-purple-600" : "bg-white/20"
                        )}>
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-white/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={cn(
                      "w-full h-12 text-base",
                      plan.popular 
                        ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-600/25" 
                        : "bg-white/10 hover:bg-white/20 text-white"
                    )}
                    onClick={handleGetStarted}
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-2 bg-orange-500/10 border-orange-500/30 text-orange-300">
              <Shield className="h-3.5 w-3.5 mr-2" />
              FAQ
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Got Questions?
            </h2>
            <p className="text-xl text-white/60">
              We've got answers to help you get started.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => (
              <Card key={index} className="bg-slate-900/50 border-white/10 overflow-hidden">
                <button
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-white/5 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-semibold text-white pr-4">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 flex-shrink-0 text-violet-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 flex-shrink-0 text-white/50" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-white/60">{faq.answer}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-white/90 font-medium">Start your transformation today</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            Ready to Become Your
            <br />
            <span className="text-yellow-300">Best Self?</span>
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join thousands of users who have already transformed their lives with BisaFit. Your personalized fitness journey starts now.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 h-14 bg-white text-violet-600 hover:bg-white/90 shadow-xl"
              onClick={handleGetStarted}
            >
              Start Free Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <p className="mt-6 text-white/60 text-sm">
            No credit card required • Cancel anytime • 100% satisfaction guaranteed
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">BisaFit</span>
              </div>
              <p className="text-white/60 mb-4 max-w-md">
                Your personal AI fitness coach. Transform your body and mind with personalized workouts, smart nutrition, and real-time progress tracking.
              </p>
              <p className="text-white/50 text-sm mb-6">
                A product of Bisa Group LLC
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="border-white/20 text-white/70 hover:text-white hover:bg-white/10" disabled>
                  <Apple className="h-4 w-4 mr-2" />
                  App Store
                </Button>
                <Button variant="outline" size="sm" className="border-white/20 text-white/70 hover:text-white hover:bg-white/10" disabled>
                  <Play className="h-4 w-4 mr-2" />
                  Google Play
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-white/60 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-white/60 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#testimonials" className="text-white/60 hover:text-white transition-colors">Reviews</a></li>
                <li><a href="#faq" className="text-white/60 hover:text-white transition-colors">FAQ</a></li>
                <li><Link to="/auth" className="text-white/60 hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><Link to="/terms" className="text-white/60 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="text-white/60 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/contact" className="text-white/60 hover:text-white transition-colors">Contact Us</Link></li>
              </ul>

              <h4 className="font-semibold text-white mb-4 mt-8">Support</h4>
              <ul className="space-y-3">
                <li><a href="mailto:support@bisagroup.org" className="text-white/60 hover:text-white transition-colors">support@bisagroup.org</a></li>
                <li><span className="text-white/60">+1 (918) 248-6269</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/50">
              © 2026 Bisa Group LLC. All rights reserved.
            </p>
            <p className="text-sm text-white/50">
              Support: support@bisagroup.org • +1 (918) 248-6269
            </p>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(30px, 30px) scale(1.05); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-blob {
          animation: blob 15s infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
