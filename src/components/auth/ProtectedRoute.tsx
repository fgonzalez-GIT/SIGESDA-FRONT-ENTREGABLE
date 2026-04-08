import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import { selectIsAuthenticated, selectUser } from '@/store/slices/authSlice';
import { UserRole } from '@/types/auth.types';
import { hasRole } from '@/utils/auth.utils';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * Componente wrapper para rutas protegidas
 *
 * Funcionalidades:
 * - Valida que el usuario esté autenticado
 * - Opcionalmente valida que tenga uno de los roles permitidos
 * - Redirige a /login si no está autenticado
 * - Redirige a /unauthorized si no tiene el rol requerido
 *
 * @example
 * ```tsx
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 * ```
 *
 * @example Con roles
 * ```tsx
 * <ProtectedRoute allowedRoles={['admin', 'admin_catalogos']}>
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 */
export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const location = useLocation();

  // No autenticado -> redirigir a login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Validar roles si se especificaron
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasRole(user, allowedRoles)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Usuario autenticado y con rol válido
  return <>{children}</>;
};
