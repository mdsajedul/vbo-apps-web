"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { exchangeSSOCode } from '@/lib/sso';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuth() {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      let token = searchParams.get('token') || searchParams.get('access_token');
      let userRaw = searchParams.get('user');
      let refreshToken = searchParams.get('refresh_token');

      // Also check URL hash fragment (#token=...&user=...&refresh_token=...)
      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        if (!token) token = hashParams.get('token') || hashParams.get('access_token');
        if (!userRaw) userRaw = hashParams.get('user');
        if (!refreshToken) refreshToken = hashParams.get('refresh_token');
      }

function decodeJwtClaims(jwt: string): any {
  try {
    const parts = jwt.split('.');
    if (parts.length === 3) {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json);
    }
  } catch (e) {
    console.warn('Failed to parse JWT claims:', e);
  }
  return {};
}

      // Scenario A: Direct token redirect (e.g. Google OAuth redirect from VBO Platform)
      if (token && userRaw) {
        try {
          const userObj = JSON.parse(decodeURIComponent(userRaw));
          const claims = decodeJwtClaims(token);
          
          const appMappings = userObj.app_mappings || userObj.tenant?.app_mappings || claims.app_mappings || {};
          const erpTenantId = appMappings.erp || userObj.tenant_id || userObj.tenant?.id || claims.tenant_id || 'ten_default_demo';

          const userWithTenant = {
            ...userObj,
            tenant_id: erpTenantId,
            tenant_name: userObj.tenant_name || userObj.tenant?.name || claims.tenant_name || 'Default Organization',
            tenant_slug: userObj.tenant_slug || userObj.tenant?.slug || claims.tenant_slug || '',
            vbo_user_id: userObj.vbo_user_id || claims.vbo_user_id || userObj.id,
            vbo_tenant_id: userObj.vbo_tenant_id || claims.vbo_tenant_id || userObj.tenant?.id,
            role: userObj.role || claims.role || 'OWNER',
            roles: userObj.roles || [userObj.role || claims.role || 'OWNER'],
            is_super_admin: userObj.is_super_admin ?? (userObj.role === 'OWNER' || claims.role === 'OWNER'),
            features: userObj.features || userObj.tenant?.features || claims.features || [],
            limits: userObj.limits || userObj.tenant?.limits || claims.limits || {},
            app_mappings: appMappings,
            workspaces: userObj.workspaces || userObj.all_tenants || claims.workspaces || [],
            allowed_verticals: ['ALL'],
          };
          setAuth(userWithTenant, token, refreshToken);

          if (refreshToken) {
            document.cookie = `refresh_token=${refreshToken}; path=/; max-age=2592000; SameSite=Lax`;
          }
          document.cookie = `token=${token}; path=/; max-age=900; SameSite=Lax`;

          const roles = userWithTenant.roles || [];
          const isCashier = roles.some((r: any) =>
            (typeof r === 'string' ? r : r.name || r.slug || '').toUpperCase() === 'CASHIER'
          );
          // Default landing is the App Launcher ('/')
          const returnTo = sessionStorage.getItem('vbo_sso_return_to') || (isCashier ? '/erp/pos' : '/');
          sessionStorage.removeItem('vbo_sso_return_to');
          router.push(returnTo);
          return;
        } catch (err) {
          console.error('Error parsing user from SSO callback:', err);
          if (isMounted) setErrorMessage('Failed to decode user session from SSO.');
          return;
        }
      }

      // Scenario B: Authorization code with PKCE exchange
      if (code && state) {
        try {
          const response = await exchangeSSOCode(code, state);
          if (response.access_token && response.user) {
            const claims = decodeJwtClaims(response.access_token);
            const appMappings = response.tenant?.app_mappings || claims.app_mappings || {};
            const erpTenantId = appMappings.erp || response.tenant?.id || response.user.tenant_id || claims.tenant_id || 'ten_default_demo';

            const userWithTenant = {
              ...response.user,
              tenant_id: erpTenantId,
              tenant_name: response.tenant?.name || claims.tenant_name || 'Default Organization',
              tenant_slug: response.tenant?.slug || claims.tenant_slug || '',
              vbo_user_id: response.user?.id || claims.vbo_user_id,
              vbo_tenant_id: response.tenant?.id || claims.vbo_tenant_id,
              role: response.tenant?.role || response.user?.role || claims.role || 'OWNER',
              roles: [response.tenant?.role || response.user?.role || claims.role || 'OWNER'],
              is_super_admin: response.tenant?.role === 'OWNER' || claims.role === 'OWNER',
              features: response.tenant?.features || claims.features || [],
              limits: response.tenant?.limits || claims.limits || {},
              app_mappings: appMappings,
              workspaces: response.workspaces || response.all_tenants || claims.workspaces || [],
              allowed_verticals: ['ALL'],
            };
            setAuth(userWithTenant, response.access_token, response.refresh_token);
            if (response.refresh_token) {
              document.cookie = `refresh_token=${response.refresh_token}; path=/; max-age=2592000; SameSite=Lax`;
            }
            document.cookie = `token=${response.access_token}; path=/; max-age=900; SameSite=Lax`;

            const roles = userWithTenant.roles || [];
            const isCashier = roles.some((r: any) =>
              (typeof r === 'string' ? r : r.name || r.slug || '').toUpperCase() === 'CASHIER'
            );
            // Default landing is the App Launcher ('/')
            const returnTo = sessionStorage.getItem('vbo_sso_return_to') || (isCashier ? '/erp/pos' : '/');
            sessionStorage.removeItem('vbo_sso_return_to');
            router.push(returnTo);
            return;
          }

        } catch (err: any) {
          console.error('Error exchanging SSO authorization code:', err);
          if (isMounted) setErrorMessage(err.message || 'Single Sign-On authentication failed.');
          return;
        }
      }

      // If no valid auth params found, redirect to login
      if (!token && !code) {
        router.push('/login');
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [searchParams, router, setAuth]);

  if (errorMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white p-4">
        <div className="max-w-md w-full rounded-xl border border-red-500/20 bg-slate-900/80 p-6 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white">SSO Authentication Error</h2>
          <p className="mt-2 text-sm text-slate-400">{errorMessage}</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        <p className="text-sm text-slate-400 font-medium">Completing VBO Single Sign-On...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
