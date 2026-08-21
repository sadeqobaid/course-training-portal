import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { UserRole } from '../types/api';

export function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: UserRole[];
}) {
  const { user, loading } = useAuth();
  if (loading) return <p>Checking your sign-in status…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <main className="narrow">
        <h1>Access denied</h1>
        <p>Your signed-in role does not have permission to open this workspace.</p>
      </main>
    );
  }
  return <>{children}</>;
}
