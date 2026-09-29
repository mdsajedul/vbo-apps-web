"use client";

import React from "react";
import { useAuthStore } from "@/lib/auth-store";
import {
  CreditCard,
  CheckCircle2,
  HardDrive,
  Send,
  Boxes,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Download,
  AlertCircle,
  FileText,
} from "lucide-react";


export default function PlatformBillingPage() {
  const { user } = useAuthStore();

  const quotas = [
    {
      title: "POS Register Licenses",
      used: 4,
      limit: 10,
      unit: "Registers",
      icon: Boxes,
      color: "from-blue-600 to-indigo-600",
      barColor: "bg-blue-500",
    },
    {
      title: "WhatsApp Broadcast Quota",
      used: 12450,
      limit: 50000,
      unit: "Messages / mo",
      icon: Send,
      color: "from-purple-600 to-violet-600",
      barColor: "bg-purple-500",
    },
    {
      title: "Email Broadcast Quota",
      used: 8200,
      limit: 25000,
      unit: "Emails / mo",
      icon: MessageSquare,
      color: "from-cyan-600 to-blue-600",
      barColor: "bg-cyan-500",
    },
    {
      title: "Cloud File Storage",
      used: 1.2,
      limit: 10,
      unit: "GB",
      icon: HardDrive,
      color: "from-emerald-600 to-teal-600",
      barColor: "bg-emerald-500",
    },
  ];

  const invoices = [
    {
      id: "INV-2026-009",
      date: "2026-09-01",
      amount: "৳15,000",
      status: "PAID",
      plan: "Enterprise Multi-Product Suite (Annual)",
    },
    {
      id: "INV-2026-008",
      date: "2026-08-01",
      amount: "৳15,000",
      status: "PAID",
      plan: "Enterprise Multi-Product Suite (Annual)",
    },
    {
      id: "INV-2026-007",
      date: "2026-07-01",
      amount: "৳15,000",
      status: "PAID",
      plan: "Enterprise Multi-Product Suite (Annual)",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-500" />
            <span>Subscriptions & Billing</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your VBO Platform subscription plan, active entitlement quotas, and invoice history.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-900/20 transition-all">
          <Sparkles className="w-4 h-4" />
          <span>Upgrade Subscription</span>
        </button>
      </div>

      {/* Active Plan Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active Plan • Auto-Renews Sep 2027</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              Enterprise Multi-Product Suite
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Includes full access to VBO ERP (POS & Inventory), VBO Connect (Omnichannel WhatsApp & Automations), and VBO Platform SSO Identity.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl shrink-0">
            <div>
              <div className="text-[11px] text-slate-400">Monthly Billing</div>
              <div className="text-2xl font-black text-white">৳15,000 <span className="text-xs font-normal text-slate-400">/ mo</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Entitlements & Quotas */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Active Entitlement Quotas & Capacity
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quotas.map((q) => {
            const percentage = Math.min(100, Math.round((q.used / q.limit) * 100));
            const Icon = q.icon;

            return (
              <div
                key={q.title}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${q.color} flex items-center justify-center text-white shadow-md`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {percentage}% Used
                  </span>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {q.title}
                  </div>
                  <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {q.used.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ {q.limit.toLocaleString()} {q.unit}</span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${q.barColor} transition-all duration-500 rounded-full`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing & Invoice History */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Invoice History & Receipts
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {invoices.map((inv) => (
            <div key={inv.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {inv.id} — {inv.plan}
                  </div>
                  <div className="text-[11px] text-slate-500">Issued on {inv.date}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-900 dark:text-white">{inv.amount}</span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                  {inv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
