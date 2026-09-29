"use client";

import { useEffect, useState } from "react";
import { useBranchStore } from "@/lib/branch-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapPin, Globe, Check, ChevronsUpDown, Lock, Plus } from "lucide-react";
import Link from "next/link";

export function BranchSwitcher() {
  const {
    branches,
    selectedBranchId,
    selectedBranch,
    canSelectAll,
    isLoading,
    isInitialized,
    setBranch,
    fetchAccessibleBranches,
  } = useBranchStore();

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAccessibleBranches();
  }, [fetchAccessibleBranches]);

  if (!isInitialized && isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse text-xs text-slate-400">
        <MapPin className="w-3.5 h-3.5" />
        <span>Loading...</span>
      </div>
    );
  }

  // Single-branch restricted view (e.g. Cashier or staff locked to one location)
  if (!canSelectAll && branches.length <= 1) {
    const single = branches[0] || selectedBranch;
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 text-xs font-semibold text-slate-700 dark:text-slate-200">
        <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="truncate max-w-[120px]">{single?.name || "Assigned Branch"}</span>
        {single?.code && (
          <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1 py-0.2 rounded font-bold uppercase">
            {single.code}
          </span>
        )}
        <span title="Branch assigned by admin" className="inline-flex items-center">
          <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500 ml-0.5" />
        </span>
      </div>
    );
  }

  const isAll = selectedBranchId === "ALL";
  const activeBranch = selectedBranch || branches.find((b) => b.id === selectedBranchId);

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DropdownMenu onOpenChange={(open) => {
      if (open) {
        fetchAccessibleBranches();
      }
    }}>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/70 transition-all text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
          title="Click to switch active branch context"
        >
          {isAll ? (
            <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          ) : (
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}

          <span className="truncate max-w-[110px] sm:max-w-[140px] text-left">
            {isAll ? "All Branches" : activeBranch?.name || "Select Branch"}
          </span>

          {isAll ? (
            <span className="hidden sm:inline-block text-[10px] font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/40">
              Consolidated
            </span>
          ) : (
            activeBranch?.code && (
              <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-bold uppercase border border-emerald-200/60 dark:border-emerald-800/40">
                {activeBranch.code}
              </span>
            )
          )}

          <ChevronsUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0 ml-0.5" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64 p-1.5">
        <DropdownMenuLabel className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 py-1">
          Branch Context
        </DropdownMenuLabel>

        {canSelectAll && (
          <>
            <DropdownMenuItem
              onClick={() => setBranch("ALL")}
              className={`flex items-center justify-between px-2 py-2 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                isAll
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <div>All Branches</div>
                  <div className="text-[10px] text-slate-400 font-normal">Consolidated metrics & reports</div>
                </div>
              </div>
              {isAll && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1" />
          </>
        )}

        {branches.length > 5 && (
          <div className="p-1 mb-1">
            <input
              type="text"
              placeholder="Search branches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <div className="max-h-60 overflow-y-auto space-y-0.5">
          {filteredBranches.map((branch) => {
            const isSelected = selectedBranchId === branch.id;
            return (
              <DropdownMenuItem
                key={branch.id}
                onClick={() => setBranch(branch.id)}
                className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 font-semibold"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{branch.name}</span>
                  {branch.code && (
                    <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-700 px-1 py-0.2 rounded text-slate-600 dark:text-slate-300 uppercase">
                      {branch.code}
                    </span>
                  )}
                </div>
                {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
              </DropdownMenuItem>
            );
          })}
          {filteredBranches.length === 0 && (
            <div className="py-2 text-center text-xs text-slate-400">No branches found</div>
          )}
        </div>

        {canSelectAll && (
          <>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem asChild className="cursor-pointer text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
              <Link href="/settings/branches" className="flex items-center gap-1.5 w-full px-2 py-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Manage Branches</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
