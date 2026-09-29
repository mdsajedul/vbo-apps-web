'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { restaurantApi } from '@/lib/restaurant-api';
import {
  ChefHat,
  Utensils,
  Flame,
  Clock,
  AlertTriangle,
  RefreshCw,
  Layers,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ListOrdered,
  Sparkles,
  ExternalLink,
  Store
} from 'lucide-react';

export function ChefRestaurantDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kitchenData, setKitchenData] = useState<any>(null);
  const [recipeData, setRecipeData] = useState<any>(null);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [kSummary, rSummary] = await Promise.allSettled([
        restaurantApi.getKitchenSummary(),
        restaurantApi.getRecipeSummary(),
      ]);

      if (kSummary.status === 'fulfilled') {
        setKitchenData(kSummary.value);
      }
      if (rSummary.status === 'fulfilled') {
        setRecipeData(rSummary.value);
      }
    } catch (err) {
      console.error('Failed to load chef dashboard metrics', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh kitchen status every 30 seconds
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading Culinary Workspace...</p>
      </div>
    );
  }

  const activeTickets = kitchenData?.totalActiveTickets || 0;
  const rushTickets = kitchenData?.rushTickets || 0;
  const lateTickets = kitchenData?.lateTickets || 0;
  const stationCount = kitchenData?.stationCount || 0;
  const stations = kitchenData?.stations || [];
  const activeOrders = kitchenData?.recentActiveOrders || [];

  const totalRecipes = recipeData?.totalRecipes || 0;
  const recentRecipes = recipeData?.recentRecipes || [];
  const lowStockIngredients = recipeData?.lowStockIngredients || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-15">
          <ChefHat className="h-64 w-64" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-amber-100">
              <Sparkles className="w-3.5 h-3.5" />
              Kitchen & Culinary Operations
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Chef & Kitchen Command Center
            </h1>
            <p className="text-amber-100 text-sm max-w-xl">
              Live kitchen order tracking, station workloads, and recipe prep formulas.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md font-medium text-sm transition-all flex items-center gap-2 border border-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <Link
              href="/restaurant/kitchen"
              className="px-5 py-2.5 rounded-xl bg-white text-orange-950 font-bold text-sm shadow-lg hover:bg-amber-50 hover:scale-[1.02] transition-all flex items-center gap-2 group"
            >
              <Flame className="w-4 h-4 text-orange-600 group-hover:animate-pulse" />
              Launch Fullscreen KDS
              <ExternalLink className="w-3.5 h-3.5 text-orange-600 ml-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Active Orders */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {activeTickets}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Orders currently cooking or queued
          </p>
        </div>

        {/* Rush Orders */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Rush Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-red-600 dark:text-red-400">
              {rushTickets}
            </span>
            {rushTickets > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs font-bold animate-pulse">
                High Priority
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Flagged for urgent preparation
          </p>
        </div>

        {/* Late Orders Alert */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Late Items (&gt;15 min)
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {lateTickets}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Exceeding standard prep target
          </p>
        </div>

        {/* Recipe Master Count */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Standard Recipes
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {totalRecipes}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configured with yield &amp; ingredients
          </p>
        </div>
      </div>

      {/* Main Grid: Kitchen Live Queue & Recipe / Inventory Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Kitchen Queue & Stations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Stations Status Bar */}
          {stations.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                Active Kitchen Stations ({stations.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stations.map((st: any) => (
                  <div
                    key={st.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
                  >
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                      {st.displayName || st.name}
                    </p>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                      {st.activeOrderCount}{' '}
                      <span className="text-xs font-normal text-slate-400">tickets</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Kitchen Tickets */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-orange-500" />
                  Live Order Tickets
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Most recent active KOT tickets sent to kitchen
                </p>
              </div>

              <Link
                href="/restaurant/kitchen"
                className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
              >
                View Full KDS <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {activeOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2" />
                <p className="font-bold text-slate-800 dark:text-slate-200">All caught up!</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  No pending kitchen orders at the moment.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 p-2 rounded-xl transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
                          Table {order.tableNumber || 'N/A'}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {order.stationName}
                        </span>
                        {order.isRush && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider animate-pulse">
                            RUSH
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {order.items?.map((item: any) => (
                          <span
                            key={item.id}
                            className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700"
                          >
                            <strong className="text-slate-900 dark:text-white font-bold mr-1">
                              {Number(item.quantity)}x
                            </strong>
                            {item.productName}
                            {item.specialInstructions && (
                              <span className="text-amber-600 dark:text-amber-400 text-[10px] ml-1">
                                ({item.specialInstructions})
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href="/restaurant/kitchen"
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
                      >
                        Open in KDS
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Recipe Management & Low-Stock Alerts */}
        <div className="space-y-6">
          {/* Low Stock Raw Ingredients Alert */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Prep Stock Alerts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recipe ingredients currently near or below reorder minimums.
            </p>

            {lowStockIngredients.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All recipe ingredients are adequately stocked.</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockIngredients.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Used in: {item.usedInRecipe}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-amber-700 dark:text-amber-300">
                        {item.currentStock} {item.uom}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Min: {item.reorderLevel} {item.uom}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recipe Master Shortcuts */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Recipe Formulas
              </h2>

              <Link
                href="/restaurant/recipes"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                All Recipes
              </Link>
            </div>

            {recentRecipes.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-500">
                No recipes created yet.{' '}
                <Link href="/restaurant/recipes" className="text-blue-600 font-bold hover:underline">
                  Create first recipe
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentRecipes.map((r: any) => (
                  <Link
                    key={r.id}
                    href="/restaurant/recipes"
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {r.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Yield: {r.yieldQuantity} • {r.ingredientCount} ingredients
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
