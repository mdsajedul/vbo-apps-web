"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { platformApi } from "@/lib/platform-api";
import { toast } from "sonner";
import {
  Building2,
  ChevronDown,
  Check,
  Plus,
  Loader2,
  ExternalLink,
  Shield,
  Layers,
} from "lucide-react";
import { useBranchStore } from "@/lib/branch-store";
import { useRouter } from "next/navigation";

export function WorkspaceSwitcher() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchingTenantId, setSwitchingTenantId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentTenantId = user?.vbo_tenant_id || user?.tenant_id;
  const currentTenantName = user?.tenant_name || "Workspace";
  const currentRole = user?.role || "MEMBER";

  // Workspaces from auth store or fallback
  const workspaces = user?.workspaces || [];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSwitchWorkspace = async (targetTenantId: string, name: string) => {
    if (targetTenantId === currentTenantId) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);
    setSwitchingTenantId(targetTenantId);

    try {
      toast.loading(`Switching to ${name}...`, { id: "switch-workspace" });
      const res = await platformApi.switchTenant(targetTenantId);

      const updatedUser = {
        ...user,
        ...res.user,
        tenant_id: res.tenant?.app_mappings?.erp || res.tenant?.id || targetTenantId,
        tenant_name: res.tenant?.name || name,
        tenant_slug: res.tenant?.slug || "",
        vbo_tenant_id: res.tenant?.id || targetTenantId,
        vbo_user_id: res.user?.id || user?.id,
        role: res.tenant?.role || "OWNER",
        roles: [res.tenant?.role || "OWNER"],
        features: res.tenant?.features || [],
        limits: res.tenant?.limits || {},
        app_mappings: res.tenant?.app_mappings || {},
        workspaces: res.workspaces || res.all_tenants || workspaces,
      };

      setAuth(updatedUser as any, res.access_token, res.refresh_token);

      // Reset branch state to avoid leaking previous tenant's branch context
      useBranchStore.setState({
        selectedBranchId: "ALL",
        selectedBranch: null,
        branches: [],
        isInitialized: false,
      });

      if (res.refresh_token) {
        document.cookie = `refresh_token=${res.refresh_token}; path=/; max-age=2592000; SameSite=Lax`;
      }
      document.cookie = `token=${res.access_token}; path=/; max-age=900; SameSite=Lax`;

      toast.success(`Switched to ${name}`, { id: "switch-workspace" });
      setIsOpen(false);

      // Reload page to re-initialize all tenant queries and services cleanly
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (err: any) {
      console.error("Workspace switch failed:", err);
      toast.error(err.message || "Failed to switch workspace", {
        id: "switch-workspace",
      });
      setIsSwitching(false);
      setSwitchingTenantId(null);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Switcher Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isSwitching}
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left"
        title="Switch Workspace / Organization"
      >
        <div className="w-5 h-5 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Building2 className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[90px] sm:max-w-[120px]">
            {currentTenantName}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Switcher Dropdown */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Workspaces
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {workspaces.length > 0 ? `${workspaces.length} available` : "1 active"}
            </span>
          </div>

          {/* Workspaces List */}
          <div className="p-1.5 space-y-1 max-h-60 overflow-y-auto">
            {workspaces.length === 0 ? (
              // If workspaces array is empty, show current active tenant
              <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/60 dark:bg-blue-500/10 text-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-slate-900 dark:text-white truncate">
                    {currentTenantName}
                  </span>
                </div>
                <Check className="w-3.5 h-3.5 text-blue-600" />
              </div>
            ) : (
              workspaces.map((ws) => {
                const isActive = ws.id === currentTenantId;
                const isThisSwitching = switchingTenantId === ws.id;

                return (
                  <button
                    key={ws.id}
                    onClick={() => handleSwitchWorkspace(ws.id, ws.name)}
                    disabled={isSwitching}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-500/15 border border-blue-200/80 dark:border-blue-500/30"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {ws.name}
                          </span>
                          {ws.role && (
                            <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {ws.role}
                            </span>
                          )}
                        </div>
                        {ws.slug && (
                          <span className="text-[10px] text-slate-400 block truncate">
                            {ws.slug}.vbotech.com
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {isThisSwitching ? (
                        <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                      ) : isActive ? (
                        <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-xs">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/settings/workspace");
              }}
              className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              Workspace Settings
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/settings/billing");
              }}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Plans & Quotas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
