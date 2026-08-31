import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../state/stores/useAuthStore';

export interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const status = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  const location = useLocation();

  const isAuthenticated = status === 'authenticated' && !!session?.accessToken;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
