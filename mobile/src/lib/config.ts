// Environment configuration for BisaFit mobile app
// Uses EXPO_PUBLIC_ env vars which are set in eas.json for builds

export const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qteefcujottugvwnhvix.supabase.co',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZWVmY3Vqb3R0dWd2d25odml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNTI0MzIsImV4cCI6MjA4NTYyODQzMn0.06G4MRXNHvnXdmVy5xGmQaK_nuv3boeCSrWddlbpQmA',
  BACKEND_URL: process.env.EXPO_PUBLIC_API_URL || 'https://bisafit.com',
  STRIPE_PUBLISHABLE_KEY: 'pk_live_51SmOcV2NfoMNZcjEvoxn3N0eeQL2JAM8SUtD9IItaLfDXdzlOOrWRQRPOJaEk6zTNVui7mZivPnA56mGxJH39EAQ00ZU0tgbpZ',
};
