"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NotificationBell } from "@/components/NotificationBell";
import { ProfileMenu } from "@/components/ProfileMenu";
import { ChevronRight, Menu } from "lucide-react";
import { BranchSwitcher } from "@/components/BranchSwitcher";
import { useBranchStore } from "@/lib/branch-store";
import { ProductLauncher } from "./ProductLauncher";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { UniversalSearch } from "./UniversalSearch";

interface UnifiedHeaderProps {
  onOpenMobileMenu?: () => void;
}

export function UnifiedHeader({ onOpenMobileMenu }: UnifiedHeaderProps = {}) {
  const [userContext, setUserContext] = useState<any>(null);
  const selectedBranch = useBranchStore((s) => s.selectedBranch);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const branches = useBranchStore((s) => s.branches);

  useEffect(() => {
    async function loadContext() {
      try {
        const data = await usersApi.getMe();
        setUserContext(data);
      } catch (err) {
        console.error("Failed to load user header context:", err);
      }
    }
    loadContext();
  }, []);

  const currentBranch =
    selectedBranchId && selectedBranchId !== "ALL"
      ? selectedBranch ||
        branches.find((b) => b.id === selectedBranchId) ||
        userContext?.branch
      : null;
  const industryType =
    currentBranch?.industry_type ||
    userContext?.organization?.default_industry_type;

  return (
    <header className="relative z-40 h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-3 sm:px-6 shrink-0 gap-3">
      {/* Left Area: Mobile Menu + 9-Dot Launcher + Workspace Switcher + Branch Switcher */}
      <div className="flex items-center gap-2 max-w-[70%] sm:max-w-none">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            title="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </button>
        )}

        {/* 9-Dot Product Launcher */}
        <ProductLauncher />

        {/* Workspace (Tenant) Switcher */}
        <WorkspaceSwitcher />

        {/* Branch Context Divider & Switcher */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50">
          <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />

          {/* Dynamic Branch Switcher */}
          <BranchSwitcher />

          {/* Industry Type Tag */}
          {industryType && (
            <span
              className={`hidden md:inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider border ${
                industryType === "RESTAURANT"
                  ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40"
                  : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/40"
              }`}
            >
              {industryType}
            </span>
          )}
        </div>
      </div>

      {/* Middle Area: Universal Command Palette Trigger */}
      <div className="flex-1 max-w-md hidden md:flex justify-center">
        <UniversalSearch />
      </div>

      {/* Right Area: Language + Theme + Notifications + User Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        <LanguageSwitcher />
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>
        <NotificationBell />
        <div className="hidden sm:block">
          <ProfileMenu userContext={userContext} />
        </div>
      </div>
    </header>
  );
}
