"use client";

import React from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useBranchStore } from "@/lib/branch-store";
import {
  Building2,
  GitBranch,
  Database,
  CheckCircle2,
  Server,
  Globe,
  MapPin,
  ShieldCheck,
} from "lucide-react";

export default function PlatformTenantsPage() {
  const { user } = useAuthStore();
  const branches = useBranchStore((s) => s.branches);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-500" />
          <span>Workspaces & Tenant Config</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your organization structure, multi-branch outlets, and isolated tenant database configurations.
        </p>
      </div>

      {/* Tenant Detail Summary */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-purple-500" />
          <span>Tenant Organization Specs</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
            <div className="text-slate-500">Tenant Slug ID</div>
            <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
              {user?.tenant_id || "ten_default_demo"}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
            <div className="text-slate-500">Database Topology</div>
            <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Isolated Application Multitenancy</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
            <div className="text-slate-500">Primary Region</div>
            <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-500" />
              <span>Asia / Dhaka (ap-south-1)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Branch Outlets List */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-500" />
            <span>Active Outlets & Branches ({branches.length})</span>
          </h2>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {branches.map((b) => (
            <div key={b.id} className="py-3 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{b.name}</div>
                  <div className="text-[11px] text-slate-500">{(b as any).address || "Main Outlet Branch"}</div>

                </div>
              </div>

              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-200/60 dark:border-indigo-500/20">
                {b.industry_type || "RETAIL"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
