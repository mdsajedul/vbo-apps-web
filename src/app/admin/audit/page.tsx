"use client"
import React from 'react';
import { ShieldAlert, Key, UserCheck, Lock, Info } from 'lucide-react';

export default function AdminAuditPage() {
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
              Platform-Wide Audit Trail, Super-Admin Impersonation Logs, and Rate Limit Violation tracking.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full uppercase">
          Planned for Phase 4
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Security Audit Trail & Compliance</h1>
        <p className="text-sm text-slate-400 mt-1">Cross-tenant administrative action logs, impersonation records, and API key telemetry.</p>
      </div>

      {/* Mock Audit Log Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-purple-400" />
          Recent Platform Audit Events (Mock Data)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">User / Actor</th>
                <th className="p-3">Action Type</th>
                <th className="p-3">Target Resource</th>
                <th className="p-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              <tr>
                <td className="p-3 text-slate-500">2026-07-28 21:40:12</td>
                <td className="p-3 font-semibold text-purple-300">admin@bos.com (SuperAdmin)</td>
                <td className="p-3"><span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded font-sans font-bold">IMPERSONATION_START</span></td>
                <td className="p-3">Tenant: restaurant-tenant</td>
                <td className="p-3 text-slate-400">103.205.180.12</td>
              </tr>
              <tr>
                <td className="p-3 text-slate-500">2026-07-28 20:15:00</td>
                <td className="p-3 font-semibold text-white">admin@bos.com (SuperAdmin)</td>
                <td className="p-3"><span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-sans font-bold">FEATURE_FLAG_TOGGLE</span></td>
                <td className="p-3">Key: crm (is_enabled: true)</td>
                <td className="p-3 text-slate-400">103.205.180.12</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
