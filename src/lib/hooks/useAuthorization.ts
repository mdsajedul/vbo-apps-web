import { useAuthStore } from '../auth-store';

export function useAuthorization() {
  const user = useAuthStore((state) => state.user);

  const isSuperAdmin = user?.is_super_admin === true;
  
  const isOwnerOrAdmin = () => {
    if (isSuperAdmin) return true;
    if (!user) return false;
    const userRole = (user.role || '').toUpperCase();
    if (userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      return true;
    }
    const roles = user.roles || [];
    return roles.some((r: any) => {
      const name = (typeof r === 'string' ? r : r?.name || r?.role?.name || '').toUpperCase();
      return name === 'OWNER' || name === 'ADMIN' || name === 'SUPER_ADMIN';
    });
  };

  const hasPermission = (permissionSlug: string) => {
    if (isOwnerOrAdmin()) return true;
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permissionSlug);
  };

  const hasFeature = (featureKey: string) => {
    if (isSuperAdmin) return true; // Super admins can see all features
    if (!user || !user.features) return false;
    if (Array.isArray(user.features)) {
      return user.features.includes(featureKey);
    }
    return Boolean((user.features as Record<string, boolean>)[featureKey]);
  };

  return {
    user,
    isSuperAdmin,
    isOwnerOrAdmin,
    hasPermission,
    hasFeature,
  };
}
