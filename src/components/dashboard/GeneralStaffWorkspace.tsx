'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useAuthorization } from '@/lib/hooks/useAuthorization';
import {
  Sparkles,
  LayoutDashboard,
  Boxes,
  Users,
  CreditCard,
  ChefHat,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export function GeneralStaffWorkspace() {
  const { user } = useAuthStore();
  const { hasPermission, hasFeature } = useAuthorization();

  const userRoles = user?.roles || [];
  const permissions = user?.permissions || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
            Operational Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name || 'Staff Member'}
          </h1>
          <p className="text-slate-300 text-sm max-w-xl">
            Your workspace is customized for your assigned operational roles and permissions.
          </p>
        </div>
      </div>

      {/* Quick Launch Tools Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Accessible Workspaces
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* POS Launcher */}
          {hasPermission('pos:checkout') && (
            <Link
              href="/pos"
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                Point of Sale (POS)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Access checkout register, ring up orders, and process payments.
              </p>
            </Link>
          )}

          {/* Kitchen Display */}
          {hasPermission('restaurant_kitchen:read') && (
            <Link
              href="/restaurant/kitchen"
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <ChefHat className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                Kitchen Display System (KDS)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                View live cooking tickets, rush orders, and bump completed items.
              </p>
            </Link>
          )}

          {/* Recipe Master */}
          {hasPermission('restaurant_recipes:read') && (
            <Link
              href="/restaurant/recipes"
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                Recipe Master &amp; Yields
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Manage recipe formulas, ingredient proportions, and prep costs.
              </p>
            </Link>
          )}

          {/* Inventory Management */}
          {hasPermission('inventory:read') && (
            <Link
              href="/inventory"
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                Inventory &amp; Stock
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Track warehouse stock levels, adjustments, and reorder alerts.
              </p>
            </Link>
          )}

          {/* CRM / Customers */}
          {hasPermission('customers:read') && (
            <Link
              href="/customers"
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                Customers &amp; Loyalty
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                View customer profiles, loyalty tiers, and purchase history.
              </p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
