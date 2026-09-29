"use client";

import React from "react";
import { useAuthStore, getUserDisplayRole } from "@/lib/auth-store";
import { Users, UserPlus, Shield, CheckCircle2, Mail, Lock } from "lucide-react";

export default function PlatformTeamPage() {
  const { user } = useAuthStore();
  const userRole = getUserDisplayRole(user);

  const teamMembers = [
    {
      id: "usr_1",
      name: user?.full_name || "Sajedul Islam",
      email: user?.email || "sajedul@vbotech.com",
      role: userRole,
      status: "ACTIVE",
    },
    {
      id: "usr_2",
      name: "Sami",
      email: "sami@vbotech.com",
      role: "BUSINESS_LEAD",
      status: "ACTIVE",
    },
    {
      id: "usr_3",
      name: "Retail Manager",
      email: "manager@vbotech.com",
      role: "STORE_MANAGER",
      status: "ACTIVE",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-500" />
            <span>Team Members & Role Permissions</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Assign workspace roles, control multi-tenant branch access, and invite team members.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/20 transition-all">
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {teamMembers.map((m) => (
            <div key={m.id} className="py-4 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold shrink-0">
                  {m.name[0]}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">{m.name}</div>
                  <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3" />
                    <span>{m.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-md border border-purple-200/60 dark:border-purple-500/20">
                  {m.role}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-md">
                  {m.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
