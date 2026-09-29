"use client"
import React from 'react';
import { Activity, Server, Cpu, Database, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function AdminHealthPage() {
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
              System Health, BullMQ Queue Monitor, and Infrastructure APM telemetry module.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full uppercase">
          Planned for Phase 4
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Health & APM Telemetry</h1>
        <p className="text-sm text-slate-400 mt-1">Live response SLAs, background queue depths, and database connection pooling.</p>
      </div>

      {/* APM Grid Mock */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">API Latency (p95 SLA)</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-400">42 ms</span>
            <span className="text-xs text-slate-500">target &lt; 100ms</span>
          </div>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> All endpoints healthy</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">BullMQ Redis Queue</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">0 active</span>
            <span className="text-xs text-slate-500">/ 0 failed</span>
          </div>
          <p className="text-[11px] text-slate-400">Low stock & invoice workers idle</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">DB Connection Pool</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">8 / 50</span>
            <span className="text-xs text-slate-500">connections</span>
          </div>
          <p className="text-[11px] text-slate-400">Supabase Transaction Pooler</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">Cloudinary Storage Usage</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">1.2 GB</span>
            <span className="text-xs text-slate-500">/ 25 GB</span>
          </div>
          <p className="text-[11px] text-slate-400">Product images & receipts</p>
        </div>
      </div>
    </div>
  );
}
