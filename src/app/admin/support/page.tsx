"use client"
import React from 'react';
import { LifeBuoy, MessageSquare, Clock, CheckCircle2, Info } from 'lucide-react';

export default function AdminSupportPage() {
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
              Integrated Customer Support Desk and Tenant Inquiries Management module.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full uppercase">
          Planned for Phase 4
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Tenant Support Desk</h1>
        <p className="text-sm text-slate-400 mt-1">In-app customer support tickets, onboarding inquiries, and technical issues.</p>
      </div>

      {/* Support Tickets Table Mock */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <LifeBuoy className="w-4 h-4 text-purple-400" />
          Open Support Tickets (Mock Data)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Ticket ID</th>
                <th className="p-3">Tenant Name</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="p-3 font-mono text-purple-400">#TCK-1042</td>
                <td className="p-3 font-semibold text-white">Tasty Bites Cafe</td>
                <td className="p-3">Thermal Printer paper feed calibration question</td>
                <td className="p-3"><span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">MEDIUM</span></td>
                <td className="p-3 text-slate-400">Open (Assigned)</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-purple-400">#TCK-1043</td>
                <td className="p-3 font-semibold text-white">BOS Retailer</td>
                <td className="p-3">Request for custom Mushak 6.2 tax report column</td>
                <td className="p-3"><span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">LOW</span></td>
                <td className="p-3 text-slate-400">In Review</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
