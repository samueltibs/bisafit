import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerifiedEmail?: boolean;
}

export function ProtectedRoute({ children, requireVerifiedEmail = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Check for password recovery token - redirect to reset password page
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const type = hashParams.get('type');
  
  if (type === 'recovery') {
    return <Navigate to={`/reset-password${window.location.hash}`} replace />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check email verification if required
  if (requireVerifiedEmail && !user.email_confirmed_at) {
    return <Navigate to="/verify-email" replace />;
  }

  return <>{children}</>;
}
