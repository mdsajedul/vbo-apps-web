"use client"
import React, { useEffect, useState } from 'react';
import { useAuthorization } from '../../lib/hooks/useAuthorization';

interface PermissionGuardProps {
  children: React.ReactNode;
  featureKey?: string;
  permission?: string;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ children, featureKey, permission, fallback }: PermissionGuardProps) {
  const { hasFeature, hasPermission } = useAuthorization();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null; // Prevent hydration mismatch

  if (featureKey && !hasFeature(featureKey)) {
    return <>{fallback || null}</>;
  }

  if (permission && !hasPermission(permission)) {
    return <>{fallback || null}</>;
  }

  return <>{children}</>;
}
