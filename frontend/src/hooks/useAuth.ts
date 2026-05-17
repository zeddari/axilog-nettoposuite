import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();

  const hasRole = (...roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAdmin   = () => hasRole('admin');
  const canEdit   = () => hasRole('admin', 'operator');
  const canManageCatalogue = () => hasRole('admin', 'operator', 'service_manager');

  return { user, isAuthenticated, isLoading, logout, hasRole, isAdmin, canEdit, canManageCatalogue };
}
