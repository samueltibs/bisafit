import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { sendWelcomeEmail } from '@/lib/emailService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Event:', event);
        
        // Handle password recovery - redirect to reset password page
        if (event === 'PASSWORD_RECOVERY') {
          console.log('[Auth] Password recovery detected, redirecting...');
          window.location.href = '/reset-password';
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Send welcome email on first sign up
        if (event === 'SIGNED_IN' && session?.user) {
          const userId = session.user.id;
          const email = session.user.email;
          
          // Check if welcome email already sent
          setTimeout(async () => {
            try {
              const { data: profile } = await supabase
                .from('users_profile')
                .select('welcome_email_sent, full_name')
                .eq('id', userId)
                .single();

              if (profile && !profile.welcome_email_sent && email) {
                const firstName = profile.full_name?.split(' ')[0] || '';
                sendWelcomeEmail(userId, email, firstName)
                  .then(result => {
                    if (result.success) {
                      console.log('Welcome email sent successfully');
                    }
                  })
                  .catch(err => console.error('Failed to send welcome email:', err));
              }
            } catch (err) {
              // Profile might not exist yet for new users, that's okay
              console.log('Could not check welcome email status:', err);
            }
          }, 2000); // Delay to allow profile creation trigger to complete
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
        data: {
          email_confirm: true, // Request email confirmation
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Add a timeout to prevent infinite loading states
      const timeoutPromise = new Promise<{ error: Error }>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Login request timed out. Please check your connection and try again.'));
        }, 30000); // 30 second timeout
      });

      const authPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const result = await Promise.race([authPromise, timeoutPromise]);
      return { error: (result as any).error || null };
    } catch (error) {
      console.error('[Auth] Sign in error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
