"use client"
import React from 'react';
import { Megaphone, Bell, Send, CheckCircle2, Info } from 'lucide-react';

export default function AdminBroadcastPage() {
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
              Global Platform Broadcast Banners & System Update Announcements for tenant cashiers and admins.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full uppercase">
          Planned for Phase 4
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Global System Broadcast Banners</h1>
        <p className="text-sm text-slate-400 mt-1">Publish pop-up notices, maintenance alerts, and release announcements to active stores.</p>
      </div>

      {/* Broadcast Composer Form Mock */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-purple-400" />
          Create New Platform Announcement (Mock Form)
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-400 mb-1">Announcement Title</label>
            <input
              type="text"
              disabled
              value="BOS Platform Maintenance Notice - Scheduled for Aug 1"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-300 opacity-80"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Message Content</label>
            <textarea
              disabled
              rows={3}
              value="We will be deploying server optimizations on Sunday from 2:00 AM to 3:00 AM BD time. Offline POS sales will continue uninterrupted."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-300 opacity-80"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-500 font-mono">Target: All Active Tenants & Cashiers</span>
            <button
              disabled
              className="bg-purple-600/50 text-white px-4 py-2 rounded-xl font-semibold opacity-70 cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish System Broadcast (Preview)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
