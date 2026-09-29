"use client";

import React from "react";
import { Key, Plus, Webhook, Copy, CheckCircle2 } from "lucide-react";

export default function PlatformApiKeysPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Key className="w-6 h-6 text-amber-500" />
            <span>Developer API Keys & Webhooks</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your REST API authentication keys, webhook URL endpoints, and integration credentials.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-900/20 transition-all">
          <Plus className="w-4 h-4" />
          <span>Create API Key</span>
        </button>
      </div>

      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Active API Keys</h2>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-slate-900 dark:text-white">Live Production Secret Key</div>
            <div className="font-mono text-slate-500 mt-0.5">vbo_live_sk_849204...9201</div>
          </div>
          <button className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
