import { type ReactNode } from 'react';
import { Navigate } from '@/lib/rr';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/nsa/Feedback';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
