"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore, isProductSubscribed } from "@/lib/auth-store";
import { usersApi } from "@/lib/api";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileMenu } from "@/components/ProfileMenu";
import {
  Boxes,
  MessageSquare,
  Search,
  Sparkles,
  Command,
  ArrowRight,
  Lock,
} from "lucide-react";

export default function MacAppLauncherPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [userContext, setUserContext] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await usersApi.getMe();
        setUserContext(data);
      } catch (err) {}
    }
    loadUser();
  }, []);

  const isConnectActive = isProductSubscribed(user, "connect");

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("mac-launcher-search");
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const query = searchQuery.trim().toLowerCase();
  const showErp =
    !query ||
    "vbo erp pos cashier inventory accounting bi reports enterprise"
      .toLowerCase()
      .includes(query);
  const showConnect =
    !query ||
    "vbo connect whatsapp messaging omnichannel shared inbox campaigns automations"
      .toLowerCase()
      .includes(query);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070913] text-slate-900 dark:text-slate-100 flex flex-col justify-between relative overflow-hidden select-none transition-colors duration-200">
      {/* Background Ambience / Glow Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-[140px] pointer-events-none transition-colors duration-300" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/10 dark:bg-purple-600/15 blur-[140px] pointer-events-none transition-colors duration-300" />
      <div className="absolute top-[30%] right-[20%] w-[350px] h-[350px] rounded-full bg-cyan-500/10 dark:bg-cyan-600/10 blur-[130px] pointer-events-none transition-colors duration-300" />

      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION / LAUNCHER HEADER
      ───────────────────────────────────────────────────────────── */}
      <header className="relative z-30 h-16 px-4 sm:px-8 flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] bg-white/75 dark:bg-white/[0.02] backdrop-blur-2xl transition-colors duration-200">
        {/* Left Side: Brand Logo & Organization Context */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-black/5 dark:ring-white/20">
              <Boxes className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                  VBO Ecosystem
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-400/20 dark:border-blue-400/30">
                  Unified Umbrella
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                {user?.tenant_name || userContext?.organization?.name || "Active Organization"}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="relative max-w-sm w-full mx-4 hidden sm:block">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            id="mac-launcher-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applications (⌘K)..."
            className="w-full h-8 pl-9 pr-8 rounded-full bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200/70 dark:hover:bg-white/[0.1] focus:bg-white dark:focus:bg-white/[0.12] border border-slate-200/90 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/60 transition-all font-medium"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-white px-1"
            >
              ✕
            </button>
          ) : (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center text-[10px] text-slate-400 dark:text-slate-500 font-mono pointer-events-none">
              <Command className="w-2.5 h-2.5 mr-0.5" />K
            </div>
          )}
        </div>

        {/* Right Side: Language, Theme, Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center">
            <LanguageSwitcher compact />
          </div>
          <div className="flex items-center">
            <ThemeToggle />
          </div>
          <div className="flex items-center">
            <ProfileMenu userContext={userContext} />
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. FLAGSHIP PRODUCT SPOTLIGHT (ERP & CONNECT HERO)
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full px-4 sm:px-8 py-10 z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/10 border border-blue-400/20 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>Select Application</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome to VBO Unified Platform
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto mt-2">
            Access your cloud enterprise business applications seamlessly under one umbrella with single sign-on.
          </p>
        </div>

        {/* Primary Flagship Apps Hero Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl w-full">
          {/* Card 1: VBO ERP */}
          {showErp && (
            <Link
              href="/erp"
              className="group relative overflow-hidden rounded-2xl bg-white/85 dark:bg-gradient-to-br dark:from-slate-900/90 dark:to-blue-950/60 border border-slate-200/90 dark:border-blue-500/30 p-6 hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20 transition-all duration-300 flex flex-col justify-between shadow-lg shadow-slate-200/50 backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform shrink-0">
                    <Boxes className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                        VBO ERP
                      </h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Cloud Enterprise Business Operating System
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-blue-600 dark:group-hover:text-white group-hover:bg-blue-50 dark:group-hover:bg-blue-600/20 transition-all shrink-0">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300">
                  POS Cashier
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300">
                  Inventory
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300">
                  Accounting
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300">
                  BI Reports
                </span>
              </div>
            </Link>
          )}

          {/* Card 2: VBO Connect */}
          {showConnect && (
            <div
              onClick={() => {
                if (!isConnectActive) {
                  router.push("/settings/billing");
                } else {
                  router.push("/connect");
                }
              }}
              className={`group relative overflow-hidden rounded-2xl bg-white/85 dark:bg-gradient-to-br dark:from-slate-900/90 dark:to-purple-950/60 border p-6 transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-lg shadow-slate-200/50 backdrop-blur-xl ${
                isConnectActive
                  ? "border-slate-200/90 dark:border-purple-500/30 hover:border-purple-500/60 hover:shadow-2xl hover:shadow-purple-500/10 dark:hover:shadow-purple-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-amber-500/40"
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform shrink-0">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                        VBO Connect
                      </h2>
                      {isConnectActive ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Upgrade
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Omnichannel WhatsApp & Customer Messaging Hub
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-purple-600 dark:group-hover:text-white group-hover:bg-purple-50 dark:group-hover:bg-purple-600/20 transition-all shrink-0">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300">
                  WhatsApp API
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300">
                  Shared Inbox
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300">
                  Campaigns
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300">
                  Automations
                </span>
              </div>
            </div>
          )}

          {/* Empty state if search doesn't match */}
          {!showErp && !showConnect && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 mb-3">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No applications match &quot;{searchQuery}&quot;
              </h3>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-md shadow-blue-600/20"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          3. MINIMAL FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="relative z-20 py-4 px-6 text-center text-[11px] text-slate-400 dark:text-slate-600 border-t border-slate-200/60 dark:border-white/[0.04]">
        <span>VBO Tech Unified Operating System &bull; Seamless Cloud Ecosystem</span>
      </footer>
    </div>
  );
}
