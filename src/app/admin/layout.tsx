"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, notFound } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Shield, 
  LayoutDashboard, 
  Building2, 
  Flag, 
  ArrowLeft, 
  LogOut, 
  UserCheck, 
  CreditCard, 
  TrendingUp, 
  Activity, 
  ShieldAlert, 
  Megaphone, 
  LifeBuoy, 
  Sparkles,
  FolderTree,
  Landmark,
  Layers,
  Zap,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSuperAdmin = user?.is_super_admin === true || user?.is_impersonating === true;
  const isImpersonating = user?.is_impersonating === true;

  if (!mounted) return null;

  if (!user || !isSuperAdmin) {
    notFound();
  }

  const navItems = [
    // Live Modules
    { name: 'Ecosystem Overview', href: '/admin/dashboard', icon: LayoutDashboard, badge: 'LIVE', isLive: true },
    { name: 'Global Tenant Directory', href: '/admin/tenants', icon: Building2, badge: 'LIVE', isLive: true },
    { name: 'Feature Flag Matrix', href: '/admin/feature-flags', icon: Flag, badge: 'LIVE', isLive: true },
    { name: 'SaaS Subscription Plans', href: '/admin/plans', icon: CreditCard, badge: 'LIVE', isLive: true },
    { name: 'Platform Payments', href: '/admin/payments', icon: Landmark, badge: 'LIVE', isLive: true },
    { name: 'DB Navigation Builder', href: '/admin/navigation', icon: FolderTree, badge: 'LIVE', isLive: true },
    { name: 'Master Data Hub', href: '/admin/master-data', icon: Layers, badge: 'LIVE', isLive: true },
    
    // Planned / Dummy Modules
    { name: 'SaaS Revenue & Churn', href: '/admin/finance', icon: TrendingUp, badge: 'DUMMY', isLive: false },
    { name: 'System Health & APM', href: '/admin/health', icon: Activity, badge: 'DUMMY', isLive: false },
    { name: 'Security Audit Trail', href: '/admin/audit', icon: ShieldAlert, badge: 'DUMMY', isLive: false },
    { name: 'Global Broadcasts', href: '/admin/broadcast', icon: Megaphone, badge: 'DUMMY', isLive: false },
    { name: 'Customer Support Desk', href: '/admin/support', icon: LifeBuoy, badge: 'DUMMY', isLive: false },
    { name: 'AI Churn Predictor', href: '/admin/ai-insights', icon: Sparkles, badge: 'DUMMY', isLive: false },
  ];

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Admin Dark Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 dark:bg-slate-950/80 text-slate-300 flex flex-col shadow-lg z-10 h-full overflow-hidden shrink-0 border-r border-slate-800">
        <div className="h-16 flex items-center justify-between px-5 font-bold text-xl border-b border-slate-800 tracking-tight shrink-0 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">
              <span className="text-white">VBO</span>{' '}
              <span className="text-blue-400">Tech</span>
            </span>
            <span className="text-purple-400 font-semibold text-[10px] bg-purple-950/80 border border-purple-500/30 px-1.5 py-0.5 rounded ml-0.5">
              CMD
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <div>
            <div className="px-3 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Ecosystem Management
            </div>
            <div className="mt-2 space-y-1">
              {navItems.filter(i => i.isLive).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-600/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      LIVE
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <div className="px-3 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Planned Modules</span>
              <span className="text-[9px] font-mono text-slate-500">Preview</span>
            </div>
            <div className="mt-2 space-y-1">
              {navItems.filter(i => !i.isLive).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      DUMMY
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Impersonation Banner if active */}
        {isImpersonating && (
          <div className="bg-amber-500 text-slate-950 px-6 py-2 text-xs font-bold flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4" />
              <span>IMPERSONATION MODE: You are logged in as {user?.email} (Tenant: {user?.tenant_name || user?.tenant_id})</span>
            </div>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="bg-slate-950 text-amber-400 px-3 py-1 rounded hover:bg-slate-900 transition-colors text-xs font-semibold"
            >
              Exit Impersonation
            </button>
          </div>
        )}

        {/* Top Header Bar */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-10">
          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>VBO Tech Command Center</span>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />

            <Link
              href="/dashboard"
              className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Tenant App</span>
            </Link>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.full_name || 'Super Admin'}</p>
                <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-8 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
