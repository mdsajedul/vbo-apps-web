"use client";

import React from "react";
import { ShieldAlert, FileText, Search, Filter, Lock, CheckCircle2, AlertTriangle } from "lucide-react";

export default function PlatformAuditPage() {
  const sampleLogs = [
    { id: "LOG-9081", action: "TENANT_SETTING_UPDATE", actor: "sajedul@vbotech.com", target: "Main Branch POS Config", IP: "103.114.32.11", status: "SUCCESS", timestamp: "2 mins ago" },
    { id: "LOG-9080", action: "API_KEY_ROTATED", actor: "sajedul@vbotech.com", target: "Connect WhatsApp Webhook", IP: "103.114.32.11", status: "SUCCESS", timestamp: "1 hour ago" },
    { id: "LOG-9079", action: "ROLE_PERMISSION_CHANGE", actor: "sami@vbotech.com", target: "Branch Cashier Role", IP: "103.114.32.14", status: "SUCCESS", timestamp: "3 hours ago" },
    { id: "LOG-9078", action: "SSO_OAUTH_AUTHORIZE", actor: "system@vbotech.com", target: "vbo-connect-local Client", IP: "127.0.0.1", status: "SUCCESS", timestamp: "5 hours ago" },
    { id: "LOG-9077", action: "FAILED_LOGIN_ATTEMPT", actor: "unknown@partner.com", target: "Platform Auth Gate", IP: "185.220.101.5", status: "WARNING", timestamp: "Yesterday" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-amber-500" />
          <span>Security & System Audit Logs</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Immutable audit trails of administrative actions, authentication attempts, and API configuration changes.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit logs by actor, IP, or event..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Event Type</span>
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Event ID</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Target Resource</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {sampleLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{log.id}</td>
                  <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">{log.action}</td>
                  <td className="px-6 py-4">{log.actor}</td>
                  <td className="px-6 py-4">{log.target}</td>
                  <td className="px-6 py-4 text-slate-400">{log.IP}</td>
                  <td className="px-6 py-4">
                    {log.status === "SUCCESS" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> SUCCESS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3" /> WARNING
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
