"use client"
import React from 'react';
import { TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, RefreshCcw, Info } from 'lucide-react';

export default function AdminFinancePage() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-amber-900 dark:text-amber-300">DUMMY PREVIEW MODULE</h2>
            <p className="text-xs text-amber-700 dark:text-amber-200/70">
              SaaS Revenue & Expansion Analytics module. Shows planned MRR, ARR, Churn, and Subscription Dunning workflows.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 px-3 py-1 rounded-full uppercase">
          Planned for Phase 4
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">SaaS Financials & Churn Analytics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Platform MRR growth, Net Revenue Retention (NRR), and billing dunning logs.</p>
      </div>

      {/* Mock Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-2 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Net New MRR (This Month)</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">৳14,500</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center"><ArrowUpRight className="w-3 h-3" /> +18%</span>
          </div>
          <p className="text-[11px] text-slate-500">+5 new paying retail tenants</p>
        </div>

        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-2 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Expansion MRR</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">৳4,900</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center"><ArrowUpRight className="w-3 h-3" /> +8%</span>
          </div>
          <p className="text-[11px] text-slate-500">2 plan upgrades (Starter → Pro)</p>
        </div>

        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-2 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Gross MRR Churn Rate</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">1.2%</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center"><ArrowDownRight className="w-3 h-3" /> -0.4%</span>
          </div>
          <p className="text-[11px] text-slate-500">Below 2% SaaS industry benchmark</p>
        </div>

        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-2 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Customer LTV : CAC</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">4.8x</span>
          </div>
          <p className="text-[11px] text-slate-500">Avg LTV ৳42,000 / CAC ৳8,750</p>
        </div>
      </div>

      {/* Dunning Table Mock */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <RefreshCcw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          Subscription Dunning & Auto-Renewal Retries (Mock Data)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Tenant Name</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Renewal Amount</th>
                <th className="p-3">Attempt Status</th>
                <th className="p-3">Next Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="p-3 font-semibold text-slate-900 dark:text-white">Dhaka Fashion Mart</td>
                <td className="p-3">Retail Pro</td>
                <td className="p-3">৳4,900</td>
                <td className="p-3"><span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded">Success (SSLCommerz)</span></td>
                <td className="p-3 text-slate-500">Renewed to Aug 2026</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900 dark:text-white">Chittagong Cafe</td>
                <td className="p-3">Restaurant Pro</td>
                <td className="p-3">৳4,900</td>
                <td className="p-3"><span className="text-amber-700 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded">Retry 1/3 (bKash Insufficient)</span></td>
                <td className="p-3 text-amber-600 dark:text-amber-300 font-semibold">Auto-retry in 24h</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
