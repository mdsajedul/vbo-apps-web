'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, getUserDisplayRole } from '@/lib/auth-store';
import { LogOut, ChevronDown, Settings, ShieldCheck, User } from 'lucide-react';

interface ProfileMenuProps {
  userContext?: any;
}

export function ProfileMenu({ userContext }: ProfileMenuProps) {
  const router = useRouter();
  const auth = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentUser = userContext || auth.user;
  const userName = currentUser?.full_name || auth.user?.full_name || 'User';
  const roleName = getUserDisplayRole(currentUser || auth.user);
  const orgName = currentUser?.organization?.name || currentUser?.tenant_name || 'Organization';

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 sm:space-x-3 border-l border-slate-200 dark:border-slate-800 pl-2 sm:pl-6 outline-none group cursor-pointer"
      >
        <div className="hidden sm:flex flex-col items-end text-right leading-tight">
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
            {userName}
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 px-1.5 py-0.5 rounded mt-0.5">
            {roleName}
          </span>
        </div>

        <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
          {userName.charAt(0).toUpperCase()}
        </div>

        <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full sm:mt-3 w-64 max-w-[calc(100vw-24px)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Info */}
            <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/50">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{userName}</p>
                <span className="shrink-0 inline-block text-[9px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-extrabold bg-blue-500/10 dark:bg-blue-500/20 px-1.5 py-0.5 rounded">
                  {roleName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">{currentUser?.email || 'user@bos.com'}</p>
              {orgName && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate mt-1 border-t border-slate-200/50 dark:border-slate-800/50 pt-1">
                  {orgName}
                </p>
              )}
            </div>

            {/* Quick Links */}
            <div className="p-1.5 space-y-0.5">
              {currentUser?.is_super_admin && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-xl transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-500" />
                  <span>Super Admin Console</span>
                </Link>
              )}

              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>System Settings</span>
              </Link>
            </div>

            {/* Account Sign Out */}
            <div className="p-1.5 border-t border-slate-100 dark:border-slate-800/80">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  auth.logout();
                  router.push('/login');
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors text-left font-semibold cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Sign Out / Switch Account</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
