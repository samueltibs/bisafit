import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ShoppingBag, Shirt, Watch, Dumbbell, Sparkles, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { APP_NAME, EMAIL_STORE } from '@/lib/branding';

const INTEREST_OPTIONS = [
  { id: 'apparel', label: 'Apparel', icon: Shirt },
  { id: 'accessories', label: 'Accessories', icon: Watch },
  { id: 'equipment', label: 'Equipment', icon: Dumbbell },
];

const COMING_SOON_ITEMS = [
  'Men & Women workout apparel',
  'Water bottles & accessories',
  'Resistance bands & fitness gear',
  'Limited drops & seasonal collections',
];

export default function Store() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleNotifyMe = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to join the waitlist.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('store_interest').upsert(
        {
          user_id: user.id,
          email: user.email || '',
          interests_json: selectedInterests,
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;

      setHasSubmitted(true);
      toast({
        title: "You're on the list!",
        description: "We'll notify you when the store goes live.",
      });
    } catch (error) {
      console.error('Failed to save interest:', error);
      toast({
        title: 'Something went wrong',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="max-w-md mx-auto text-center space-y-8">
          {/* Hero Section */}
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">{APP_NAME} Store</h1>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Launching Soon
            </div>
          </div>

          {/* Body Copy */}
          <p className="text-muted-foreground leading-relaxed">
            Soon you'll be able to purchase {APP_NAME}-branded essentials for your fitness journey — 
            from workout outfits to bottles, bands, and more.
          </p>

          {/* What's Coming Section */}
          <div className="bg-card rounded-xl p-6 text-left space-y-4 border border-border">
            <h2 className="font-semibold text-foreground">What's coming</h2>
            <ul className="space-y-3">
              {COMING_SOON_ITEMS.map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Interest Selection */}
          <div className="bg-card rounded-xl p-6 text-left space-y-4 border border-border">
            <h2 className="font-semibold text-foreground">I'm interested in...</h2>
            <div className="space-y-3">
              {INTEREST_OPTIONS.map(({ id, label, icon: Icon }) => (
                <label
                  key={id}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <Checkbox
                    checked={selectedInterests.includes(id)}
                    onCheckedChange={() => toggleInterest(id)}
                    disabled={hasSubmitted}
                  />
                  <Icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="text-sm text-foreground">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={handleNotifyMe}
            disabled={isSubmitting || hasSubmitted}
          >
            <Bell className="w-4 h-4" />
            {hasSubmitted ? "You're on the list!" : 'Notify me when it launches'}
          </Button>

          {hasSubmitted && (
            <p className="text-sm text-muted-foreground">
              We'll email you at launch from {EMAIL_STORE}. 💪
            </p>
          )}

          {/* Admin Note - visible only in code, not rendered */}
          {/* TODO: This placeholder will be replaced with Shopify product links later */}
        </div>
      </div>
    </AppLayout>
  );
}
