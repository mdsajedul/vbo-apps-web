"use client";

import React from "react";
import { useAuthStore } from "@/lib/auth-store";
import { User, KeyRound, ShieldCheck, Mail, Phone, Lock } from "lucide-react";

export default function PlatformProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-emerald-500" />
          <span>My Profile & Security</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal identity credentials, password, 2FA, and active SSO sessions.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
            {(user?.full_name || "V")[0]}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {user?.full_name || "Sajedul Islam"}
            </h2>
            <p className="text-xs text-slate-500">{user?.email || "sajedul@vbotech.com"}</p>
            <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              <span>RS256 SSO Verified</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-500 font-semibold">Full Name</label>
            <input
              type="text"
              readOnly
              value={user?.full_name || "Sajedul Islam"}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 font-semibold">Email Address</label>
            <input
              type="email"
              readOnly
              value={user?.email || "sajedul@vbotech.com"}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
