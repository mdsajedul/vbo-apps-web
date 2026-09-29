"use client"
import React from 'react';
import { Sparkles, Brain, AlertTriangle, TrendingUp, Info } from 'lucide-react';

export default function AdminAiInsightsPage() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-amber-950/40 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-amber-300">DUMMY PREVIEW MODULE</h2>
            <p className="text-xs text-amber-200/70">
              AI Tenant Churn Risk Predictor & Automated SaaS Customer Growth Advisory.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full uppercase">
          Planned for Phase 5
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">AI Churn Predictor & Market Insights</h1>
        <p className="text-sm text-slate-400 mt-1">Autonomous LLM telemetry scanning tenant store activity, POS usage, and churn risks.</p>
      </div>

      {/* AI Risk Cards Mock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Tenant Churn Risk Radar (Mock)
            </h3>
            <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-mono font-semibold">2 At-Risk Tenants</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">Chittagong Retail Store #2</span>
                <span className="text-red-400 font-bold">85% High Risk</span>
              </div>
              <p className="text-slate-400">Zero POS sales registered in the past 6 days. Recommended action: Customer Success phone check-in.</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              Cross-Tenant Market Intelligence (Mock)
            </h3>
            <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded font-mono font-semibold">AI Benchmark</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-white">Dhaka Retail Gross Margin Trend</span>
              <p className="text-slate-400">Average gross margin across 14 clothing stores in Dhaka is 38.5% for July 2026.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
