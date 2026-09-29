"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import {
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  Maximize2,
} from "lucide-react";

export default function ConnectSubroutePage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // Extract subpath (e.g. "inbox", "campaigns", "automations")
  const slugArray = Array.isArray(params?.slug)
    ? params.slug
    : [params?.slug || "inbox"];
  const subpath = slugArray.join("/");

  const connectBaseUrl =
    process.env.NEXT_PUBLIC_CONNECT_DASHBOARD_URL || "http://localhost:3001";
  const targetUrl = `${connectBaseUrl}/${subpath}`;

  const moduleTitles: Record<string, string> = {
    inbox: "Shared Omnichannel Inbox",
    campaigns: "Campaign Broadcast Manager",
    automations: "Visual Marketing Journeys",
    contacts: "Audience & Contacts Directory",
    leads: "Lead Pipeline Funnel",
    templates: "Message & Email Templates",
    analytics: "Delivery & Performance Analytics",
    settings: "Connect Channel Settings",
  };

  const currentTitle =
    moduleTitles[slugArray[0]] || `Connect: ${slugArray[0]}`;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] -m-4 sm:-m-6 lg:-m-8 bg-slate-950">
      {/* Top Embedded Control Bar */}
      <div className="h-12 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/connect")}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Back to Connect Hub"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-white uppercase tracking-wider">
              {currentTitle}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              /{subpath}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 mr-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SSO Synced</span>
          </div>

          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            title="Open in Dedicated Tab"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fullscreen</span>
          </a>
        </div>
      </div>

      {/* Embedded Viewport / Iframe Frame */}
      <div className="flex-1 relative w-full h-full overflow-hidden bg-slate-950">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-10">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mb-3" />
            <span className="text-sm font-medium text-slate-300">
              Loading {currentTitle}...
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Syncing active session with Connect Engine
            </span>
          </div>
        )}

        <iframe
          src={targetUrl}
          title={currentTitle}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          allow="camera; microphone; clipboard-read; clipboard-write;"
        />
      </div>
    </div>
  );
}
