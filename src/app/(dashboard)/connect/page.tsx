"use client";

import React from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import {
  MessageSquare,
  Send,
  Zap,
  Users,
  Target,
  FileText,
  Sliders,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

export default function ConnectHubPage() {
  const { user } = useAuthStore();

  const connectDashboardUrl =
    process.env.NEXT_PUBLIC_CONNECT_DASHBOARD_URL || "http://localhost:3001";

  const modules = [
    {
      title: "Omnichannel Shared Inbox",
      description:
        "Centralized team inbox combining WhatsApp Business Cloud, Web Chat, and Email conversations in real time.",
      route: "/connect/inbox",
      icon: MessageSquare,
      gradient: "from-purple-600 to-indigo-600",
      tag: "Live Real-Time",
      tagColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    {
      title: "Campaign Broadcasts",
      description:
        "High-throughput WhatsApp and Email newsletter broadcasts with per-tenant queue fairness and retry resilience.",
      route: "/connect/campaigns",
      icon: Send,
      gradient: "from-blue-600 to-cyan-600",
      tag: "Fairness Queue Active",
      tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      title: "Audience & Contacts",
      description:
        "Unified customer registry with automatic synchronization from BOS POS sales, segments, and custom tags.",
      route: "/connect/contacts",
      icon: Users,
      gradient: "from-emerald-600 to-teal-600",
      tag: "Synced with POS",
      tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      title: "Lead Funnels & CRM",
      description:
        "Drag-and-drop Kanban pipeline to qualify prospects, assign deal stages, and track conversion values.",
      route: "/connect/leads",
      icon: Target,
      gradient: "from-pink-600 to-rose-600",
      tag: "Pipeline",
      tagColor: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    },
    {
      title: "Message & Email Templates",
      description:
        "Meta-approved WhatsApp HSM templates and responsive drag-and-drop HTML email layouts.",
      route: "/connect/templates",
      icon: FileText,
      gradient: "from-indigo-600 to-violet-600",
      tag: "HSM Verified",
      tagColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    },
    {
      title: "Channel & API Settings",
      description:
        "Configure WhatsApp Business Cloud API credentials, webhook tokens, and SMTP email broadcast servers.",
      route: "/connect/settings",
      icon: Sliders,
      gradient: "from-slate-700 to-slate-900",
      tag: "Gateway",
      tagColor: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 border border-purple-800/40 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Native Next.js Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              VBO Connect Workspace
            </h1>
            <p className="text-sm text-purple-200/80 leading-relaxed">
              Omnichannel customer communications, broadcast campaigns, audience CRM,
              and WhatsApp engagement powered by VBO Platform identity.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <a
              href={connectDashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 transition-all"
            >
              <span>Launch Standalone Window</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* SSO Context Ribbon */}
        <div className="mt-6 pt-4 border-t border-purple-900/50 flex flex-wrap items-center gap-4 text-xs text-purple-300/80">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              SSO Authenticated:{" "}
              <strong className="text-white">
                {user?.full_name || user?.email || "Current User"}
              </strong>
            </span>
          </div>
          <span className="hidden sm:inline text-purple-700">•</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Tenant ID:{" "}
              <code className="bg-purple-900/40 px-1.5 py-0.5 rounded text-purple-200 font-mono text-[11px]">
                {user?.tenant_id || "default"}
              </code>
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.route}
              href={m.route}
              className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/50 dark:hover:border-purple-500/50 shadow-sm hover:shadow-xl transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${m.tagColor}`}
                  >
                    {m.tag}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-1.5">
                  {m.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {m.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400">
                <span>Enter Module</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Active Channels Status */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Connected Communication Channels
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time webhook listeners & multi-channel message dispatchers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            WhatsApp Cloud API
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Email (SMTP)
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 font-medium">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            Web Chat Widget
          </span>
        </div>
      </div>
    </div>
  );
}
