"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { initiateSSORedirect } from '@/lib/sso';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormError } from '@/components/ui/form-error';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Zap,
  ShoppingCart, Package, BarChart3, Globe, ShieldCheck,
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/* ---- Circuit Grid ---- */
function CircuitGrid() {
  return (
    <div className="circuit-bg" aria-hidden="true">
      <div className="circuit-gradient" />
      <svg className="circuit-svg" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <pattern id="hex-grid" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
            <path d="M30 0 L60 15 L60 37 L30 52 L0 37 L0 15 Z" fill="none" stroke="rgba(99,102,241,0.07)" strokeWidth="0.5"/>
            <circle cx="30" cy="0" r="1.5" fill="rgba(99,102,241,0.15)"/>
            <circle cx="60" cy="15" r="1" fill="rgba(99,102,241,0.1)"/>
            <circle cx="60" cy="37" r="1" fill="rgba(99,102,241,0.1)"/>
            <circle cx="30" cy="52" r="1.5" fill="rgba(99,102,241,0.15)"/>
            <circle cx="0" cy="15" r="1" fill="rgba(99,102,241,0.1)"/>
            <circle cx="0" cy="37" r="1" fill="rgba(99,102,241,0.1)"/>
            <circle cx="30" cy="26" r="1.2" fill="rgba(99,102,241,0.12)"/>
            <line x1="30" y1="0" x2="30" y2="26" stroke="rgba(99,102,241,0.05)" strokeWidth="0.5"/>
            <line x1="0" y1="15" x2="30" y2="26" stroke="rgba(99,102,241,0.05)" strokeWidth="0.5"/>
            <line x1="60" y1="15" x2="30" y2="26" stroke="rgba(99,102,241,0.05)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="fade-mask" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="white" stopOpacity="1"/>
            <stop offset="70%" stopColor="white" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </radialGradient>
          <mask id="grid-mask"><rect width="100%" height="100%" fill="url(#fade-mask)"/></mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-grid)" mask="url(#grid-mask)"/>
        <circle cx="35%" cy="25%" r="2.5" className="pulse-node n1"/>
        <circle cx="70%" cy="60%" r="2" className="pulse-node n2"/>
        <circle cx="20%" cy="70%" r="2" className="pulse-node n3"/>
        <circle cx="80%" cy="30%" r="1.8" className="pulse-node n4"/>
      </svg>
    </div>
  );
}

const features = [
  { icon: ShoppingCart, title: 'Point of Sale', desc: 'Blazing-fast retail & restaurant checkout, online or offline.' },
  { icon: Package, title: 'Inventory & Warehouse', desc: 'Real-time stock tracking with batch, expiry & multi-location.' },
  { icon: BarChart3, title: 'Analytics & Reports', desc: 'Live dashboards, Mushak compliance, and custom BI reports.' },
  { icon: Globe, title: 'Omnichannel Commerce', desc: 'Sync WooCommerce, Shopify & more from one hub.' },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const setAuth = useAuthStore(state => state.setAuth);

  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '354113298583-ci3i9j8hu54dov0k7t50st9u90lhbhk5.apps.googleusercontent.com';
  const platformUrl =
    process.env.NEXT_PUBLIC_VBO_PLATFORM_URL || 'http://localhost:3005';

  const handleGoogleCredentialResponse = useCallback(
    async (response: any) => {
      const credential = response?.credential;
      if (!credential) return;

      setGoogleLoading(true);
      setErrorMessage(null);

      try {
        const res = await fetch(`${platformUrl}/identity/google/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Google authentication failed');
        }

        const authData = await res.json();
        const userWithTenant = {
          ...authData.user,
          tenant_id:
            authData.tenant?.app_mappings?.erp ||
            authData.tenant?.id ||
            authData.user?.tenant_id ||
            'ten_default_demo',
          tenant_name: authData.tenant?.name || 'Default Organization',
          tenant_slug: authData.tenant?.slug || '',
          vbo_user_id: authData.user?.id,
          vbo_tenant_id: authData.tenant?.id,
          role: authData.tenant?.role || 'OWNER',
          roles: [authData.tenant?.role || 'OWNER'],
          is_super_admin: authData.user?.platform_role === 'SUPER_ADMIN' || authData.tenant?.role === 'OWNER',
          features: authData.tenant?.features || [],
          limits: authData.tenant?.limits || {},
          app_mappings: authData.tenant?.app_mappings || {},
          workspaces: authData.workspaces || authData.all_tenants || [],
          allowed_verticals: ['ALL'],
        };

        setAuth(userWithTenant, authData.access_token);
        if (authData.refresh_token) {
          document.cookie = `refresh_token=${authData.refresh_token}; path=/; max-age=2592000; SameSite=Lax`;
        }
        document.cookie = `token=${authData.access_token}; path=/; max-age=900; SameSite=Lax`;

        const roles = userWithTenant.roles || [];
        const isCashier = roles.some(
          (r: any) =>
            (typeof r === 'string' ? r : r.name || r.slug || '').toUpperCase() ===
            'CASHIER',
        );
        router.push(isCashier ? '/erp/pos' : '/');
      } catch (err: any) {
        console.error('Google Sign-In Error:', err);
        setErrorMessage(err.message || 'Google sign-in could not be completed.');
      } finally {
        setGoogleLoading(false);
      }
    },
    [platformUrl, router, setAuth],
  );

  const initGoogleOneTap = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Trigger floating Google One Tap prompt
        (window as any).google.accounts.id.prompt();
      } catch (e) {
        console.warn('Google One Tap init suppressed:', e);
      }
    }
  }, [googleClientId, handleGoogleCredentialResponse]);

  const handleGoogleButtonClick = () => {
    setErrorMessage(null);
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      setGoogleLoading(true);
      try {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            initiateSSORedirect('google');
          }
        });
        setTimeout(() => {
          setGoogleLoading(false);
        }, 3500);
      } catch {
        initiateSSORedirect('google');
      }
    } else {
      initiateSSORedirect('google');
    }
  };

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${platformUrl}/identity/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          password: data.password,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Invalid email or password');
      }

      const authData = await res.json();
      const userWithTenant = {
        ...authData.user,
        tenant_id:
          authData.tenant?.app_mappings?.erp ||
          authData.tenant?.id ||
          authData.user.tenant_id ||
          'ten_default_demo',
        tenant_name: authData.tenant?.name || 'Default Organization',
        role: authData.tenant?.role || 'OWNER',
        roles: [authData.tenant?.role || 'OWNER'],
        is_super_admin: authData.user?.platform_role === 'SUPER_ADMIN' || authData.tenant?.role === 'OWNER',
        features: authData.tenant?.features || [],
        allowed_verticals: ['ALL'],
      };

      setAuth(userWithTenant, authData.access_token);
      if (authData.refresh_token) {
        document.cookie = `refresh_token=${authData.refresh_token}; path=/; max-age=2592000; SameSite=Lax`;
      }
      document.cookie = `token=${authData.access_token}; path=/; max-age=900; SameSite=Lax`;

      const roles = userWithTenant.roles || [];
      const isCashier = roles.some(
        (r: any) =>
          (typeof r === 'string' ? r : r.name || r.slug || '').toUpperCase() ===
          'CASHIER',
      );
      router.push(isCashier ? '/erp/pos' : '/');
    } catch (error: any) {
      console.error('Login failed', error);
      setErrorMessage(
        error.message || 'Authentication failed. Please check your credentials.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        .circuit-bg { position:fixed; inset:0; z-index:0; overflow:hidden; }
        .circuit-gradient {
          position:absolute; inset:0;
          background:
            radial-gradient(ellipse 120% 80% at 20% 50%, #0F1629 0%, transparent 60%),
            radial-gradient(ellipse 100% 80% at 80% 50%, #2D1B4E 0%, transparent 60%),
            radial-gradient(ellipse 80% 60% at 50% 40%, #1E1145 0%, transparent 50%),
            #080B18;
        }
        .circuit-svg { position:absolute; inset:0; width:100%; height:100%; }
        .pulse-node { fill:rgba(99,102,241,0.15); animation:nodePulse 4s ease-in-out infinite; }
        .n1{animation-delay:0s} .n2{animation-delay:1.2s} .n3{animation-delay:2.5s} .n4{animation-delay:3.2s}
        @keyframes nodePulse {
          0%,100%{fill:rgba(99,102,241,0.1);r:2}
          50%{fill:rgba(99,102,241,0.45);r:3.5}
        }

        /* ---- Full-page split layout ---- */
        .login-page {
          position: relative;
          z-index: 10;
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
          height: 100vh;
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
          overflow: hidden;
        }

        /* ---- Left: Marketing ---- */
        .login-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0 48px;
          border-right: 1px solid rgba(99, 102, 241, 0.06);
          animation: fadeUp 0.5s ease-out both;
        }
        .login-left-inner {
          max-width: 440px;
          width: 100%;
        }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to { opacity:1; transform:translateY(0); }
        }

        .l-brand { display:flex; align-items:center; gap:10px; margin-bottom:24px; }
        .l-brand-icon {
          width:36px; height:36px; border-radius:10px;
          display:flex; align-items:center; justify-content:center;
          background:linear-gradient(135deg,rgba(99,102,241,0.2),rgba(79,70,229,0.3));
          border:1px solid rgba(99,102,241,0.25); flex-shrink:0;
        }
        .l-brand-text { font-size:17px; font-weight:700; color:#F8FAFC; letter-spacing:-0.02em; }

        .l-headline {
          font-size: 26px; font-weight: 600; color: #F8FAFC;
          line-height: 1.3; letter-spacing: -0.015em; margin-bottom: 8px;
        }
        .l-sub { font-size:13px; color:#94A3B8; line-height:1.6; }

        .l-sep { height:1px; background:rgba(148,163,184,0.08); margin:22px 0; }

        .l-features { display:flex; flex-direction:column; gap:14px; }
        .l-feat { display:flex; align-items:flex-start; gap:12px; }
        .l-feat-ic {
          width:34px; height:34px; border-radius:9px;
          display:flex; align-items:center; justify-content:center;
          background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.15); flex-shrink:0;
        }
        .l-feat-t { font-size:13px; font-weight:600; color:#F8FAFC; margin-bottom:1px; }
        .l-feat-d { font-size:12px; color:#94A3B8; line-height:1.4; }

        .l-trust {
          display:flex; align-items:center; gap:8px;
          margin-top:20px; padding-top:16px;
          border-top:1px solid rgba(148,163,184,0.08);
        }
        .l-trust-t { font-size:11px; color:#4B5563; }

        /* ---- Right: Form ---- */
        .login-right {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0 48px;
          animation: fadeUp 0.5s 0.1s ease-out both;
        }
        .login-right-inner {
          max-width: 380px;
          width: 100%;
        }

        .r-heading { font-size:24px; font-weight:600; color:#F8FAFC; letter-spacing:-0.01em; margin-bottom:4px; }
        .r-sub { font-size:13px; color:#94A3B8; margin-bottom:24px; }

        .r-label {
          display:block; font-size:11px; font-weight:600;
          text-transform:uppercase; letter-spacing:0.06em; color:#94A3B8; margin-bottom:6px;
        }
        .r-input-wrap { position:relative; display:flex; align-items:center; }
        .r-input-wrap .r-ic {
          position:absolute; left:14px; width:16px; height:16px;
          color:#64748B; pointer-events:none; transition:color 0.2s; z-index:2;
        }
        .r-input {
          width:100%; height:44px; padding:0 44px 0 42px;
          background:rgba(0,0,0,0.3); border:1px solid rgba(148,163,184,0.15);
          border-radius:10px; color:#F8FAFC; font-size:14px; font-family:inherit;
          outline:none; transition:border-color 0.2s, box-shadow 0.2s;
        }
        .r-input::placeholder { color:#475569; }
        .r-input:focus { border-color:#6366F1; box-shadow:0 0 0 3px rgba(99,102,241,0.15); }
        .r-input-wrap:focus-within .r-ic { color:#818CF8; }
        .r-input.has-error { border-color:#EF4444; }
        .r-toggle {
          position:absolute; right:12px; background:none; border:none;
          color:#64748B; cursor:pointer; padding:4px; display:flex;
          align-items:center; transition:color 0.2s; z-index:2;
        }
        .r-toggle:hover { color:#A5B4FC; }

        .r-btn {
          width:100%; height:44px; border:none; border-radius:10px;
          background:linear-gradient(135deg,#6366F1,#4F46E5);
          color:#FFF; font-size:14px; font-weight:600; font-family:inherit;
          cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
          transition:all 0.2s; box-shadow:0 4px 16px rgba(99,102,241,0.25);
        }
        .r-btn:hover:not(:disabled) { box-shadow:0 6px 24px rgba(99,102,241,0.35); filter:brightness(1.08); transform:translateY(-1px); }
        .r-btn:active:not(:disabled) { transform:translateY(0); }
        .r-btn:disabled { opacity:0.7; cursor:not-allowed; }

        .r-link { font-size:13px; color:#A5B4FC; text-decoration:none; font-weight:500; transition:color 0.2s; }
        .r-link:hover { color:#C7D2FE; text-decoration:underline; }

        .r-footer {
          position:absolute; bottom:20px; left:0; right:0;
          text-align:center; font-size:11px; color:#4B5563;
        }

        /* ---- Mobile ---- */
        @media (max-width: 768px) {
          .login-page { grid-template-columns:1fr; height:100vh; }
          .login-left { display:none; }
          .login-right { padding:0 24px; }
          .r-mobile-brand { display:flex !important; }
        }
        @media (min-width: 769px) {
          .r-mobile-brand { display:none !important; }
        }
      `}</style>

      <CircuitGrid />

      <div className="login-page">
        {/* ====== LEFT ====== */}
        <div className="login-left">
          <div className="login-left-inner">
            <div className="l-brand">
              <img src="/logo.png" alt="VBO" className="w-9 h-9 object-contain" />
              <span className="l-brand-text">VBO ERP</span>
            </div>

            <h1 className="l-headline">Everything your business needs.<br/>One platform.</h1>
            <p className="l-sub">From checkout to compliance -- manage retail, restaurant, inventory, and finance in a single workspace.</p>

            <div className="l-sep"/>

            <div className="l-features">
              {features.map(f => (
                <div key={f.title} className="l-feat">
                  <div className="l-feat-ic"><f.icon className="w-[15px] h-[15px] text-indigo-400"/></div>
                  <div>
                    <div className="l-feat-t">{f.title}</div>
                    <div className="l-feat-d">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="l-trust">
              <ShieldCheck className="w-[13px] h-[13px] text-slate-600 flex-shrink-0"/>
              <span className="l-trust-t">Enterprise-grade security * RBAC * End-to-end encrypted credentials</span>
            </div>
          </div>
        </div>

        {/* ====== RIGHT ====== */}
        <div className="login-right">
          <div className="login-right-inner">
            <div className="r-mobile-brand items-center gap-2.5 mb-6 justify-center">
              <img src="/logo.png" alt="VBO" className="w-9 h-9 object-contain" />
              <span className="l-brand-text">VBO ERP</span>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <h2 className="r-heading mb-0">Sign in to your workspace</h2>
            </div>
            <p className="r-sub">Use your centralized VBO Account or company credentials.</p>

            {/* Centralized SSO Buttons */}
            <div className="space-y-2.5 mb-6">
              <button
                type="button"
                onClick={() => initiateSSORedirect('platform')}
                className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl border border-indigo-500/40 hover:border-indigo-400 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.99]"
              >
                <Zap className="w-4 h-4 text-indigo-200 fill-indigo-200" />
                <span>Sign in with VBO Single Sign-On (SSO)</span>
              </button>

              <button
                type="button"
                disabled={googleLoading || loading}
                onClick={handleGoogleButtonClick}
                className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-slate-200 hover:text-white text-xs font-semibold transition-all shadow-sm group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    <span>Connecting with Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400 flex items-center justify-between">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-red-400 hover:text-red-300 ml-2 font-bold text-sm"
                >
                  &times;
                </button>
              </div>
            )}

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-[#0b0f19] px-2 text-slate-500 font-medium">Or sign in with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="r-label">Email Address</label>
                <div className="r-input-wrap">
                  <Mail className="r-ic"/>
                  <input type="email" {...register('email')} className={`r-input ${errors.email?'has-error':''}`} placeholder="you@company.com" autoComplete="email"/>
                </div>
                <FormError message={errors.email?.message} className="mt-1.5 text-xs"/>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="r-label" style={{marginBottom:0}}>Password</label>
                  <a href="#" className="r-link text-xs">Forgot password?</a>
                </div>
                <div className="r-input-wrap">
                  <Lock className="r-ic"/>
                  <input type={showPassword?'text':'password'} {...register('password')} className={`r-input ${errors.password?'has-error':''}`} placeholder="••••••••" autoComplete="current-password"/>
                  <button type="button" className="r-toggle" onClick={()=>setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                  </button>
                </div>
                <FormError message={errors.password?.message} className="mt-1.5 text-xs"/>
              </div>

              <div className="pt-1">
                <button type="submit" disabled={loading} className="r-btn">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="text-xs text-slate-500 mt-6">
              Don&apos;t have an enterprise account?{' '}<a href="#" className="r-link">Contact Sales</a>
            </p>
          </div>
        </div>
      </div>

      <p className="r-footer">&copy; {new Date().getFullYear()} VBOTech &middot; Privacy &middot; Terms</p>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogleOneTap}
      />
    </>
  );
}
