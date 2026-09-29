"use client"
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../lib/auth-store';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isPublicRoute =
    pathname === '/login' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/checkout');

  useEffect(() => {
    if (!isMounted) return;

    // If not authenticated and trying to access a protected route
    if (!isAuthenticated && !isPublicRoute) {
      router.push('/login');
      return;
    }
    
    const roles = user?.roles || [];
    const isCashier = roles.some((r: any) => 
      (typeof r === 'string' ? r : r.name || r.slug || '').toUpperCase() === 'CASHIER'
    );

    // If authenticated and trying to access login page
    if (isAuthenticated && pathname === '/login') {
      router.push(isCashier ? '/erp/pos' : '/');
      return;
    }

    // If authenticated as cashier, restrict them from non-POS pages
    if (isAuthenticated && isCashier && !pathname.startsWith('/pos') && !pathname.startsWith('/erp/pos') && !isPublicRoute) {
      router.push('/erp/pos');
      return;
    }
  }, [isAuthenticated, pathname, router, isMounted, user, isPublicRoute]);


  // Wait for client hydration before rendering children or redirecting
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not authenticated and not on a public route, render loading state while redirecting
  if (!isAuthenticated && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }


  return <>{children}</>;
}
