import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'operator' | 'viewer';
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const roleHierarchy: Record<string, number> = {
      viewer: 1,
      operator: 2,
      admin: 3,
    };
    const userLevel   = roleHierarchy[user?.role ?? 'viewer'] ?? 0;
    const neededLevel = roleHierarchy[requiredRole] ?? 0;

    if (userLevel < neededLevel) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
