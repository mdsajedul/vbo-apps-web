"use client"
import React, { useEffect, useState } from 'react';
import { useAuthorization } from '../../lib/hooks/useAuthorization';
import { ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RouteGuardProps {
  children: React.ReactNode;
  featureKey?: string;
  permission?: string;
  fallback?: React.ReactNode;
}

export function RouteGuard({ children, featureKey, permission, fallback }: RouteGuardProps) {
  const { hasFeature, hasPermission, user } = useAuthorization();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null; // Prevent hydration mismatch

  if (featureKey && !hasFeature(featureKey)) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-600">
          <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Feature Not Enabled</h2>
          <p className="text-center max-w-md">
            The feature '{featureKey}' is not enabled for your tenant's subscription plan.
            Please contact your administrator to upgrade.
          </p>
        </div>
      )
    );
  }

  if (permission && !hasPermission(permission)) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-600">
          <ShieldAlert className="w-16 h-16 text-amber-500 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-center max-w-md">
            You do not have the required permission ('{permission}') to view this page.
          </p>
        </div>
      )
    );
  }

  return <>{children}</>;
}
