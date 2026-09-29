'use client';

import { useState, useEffect } from 'react';
import { reportsApi } from '@/lib/api';
import { useBranchStore } from '@/lib/branch-store';
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  MapPin
} from 'lucide-react';

export function RetailDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const selectedBranch = useBranchStore((s) => s.selectedBranch);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const params =
          selectedBranchId && selectedBranchId !== 'ALL'
            ? { branchId: selectedBranchId }
            : undefined;
        const data = await reportsApi.getDashboardMetrics(params);
        setMetrics(data);
      } catch (error) {
        console.error('Failed to load metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [selectedBranchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAll = selectedBranchId === 'ALL';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Dashboard Overview
            </h1>
            {isAll ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 shadow-2xs">
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Consolidated (All Branches)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{selectedBranch?.name || 'Branch View'}</span>
                {selectedBranch?.code && (
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                    {selectedBranch.code}
                  </span>
                )}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Today's key performance metrics</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
        {/* Total Sales */}
        <div className="bg-white dark:bg-slate-900/70 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:scale-110 transition-transform text-blue-600 dark:text-blue-400">
            <TrendingUp className="w-20 h-20" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-2xs">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Today's Sales</h3>
            </div>
            <div className="text-2xl lg:text-3xl font-bold font-mono text-slate-900 dark:text-white mb-2">
              ৳ {((metrics?.today?.totalSales || 0) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 w-fit px-2 py-0.5 rounded-lg">
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
              12% vs yesterday
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-slate-900/70 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:scale-110 transition-transform text-indigo-600 dark:text-indigo-400">
            <ShoppingBag className="w-20 h-20" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xs">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Orders</h3>
            </div>
            <div className="text-2xl lg:text-3xl font-bold font-mono text-slate-900 dark:text-white mb-2">
              {metrics?.today?.orderCount || 0}
            </div>
            <div className="flex items-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 w-fit px-2 py-0.5 rounded-lg">
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
              5% vs yesterday
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white dark:bg-slate-900/70 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:scale-110 transition-transform text-violet-600 dark:text-violet-400">
            <DollarSign className="w-20 h-20" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-500/20 shadow-2xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg. Order Value</h3>
            </div>
            <div className="text-2xl lg:text-3xl font-bold font-mono text-slate-900 dark:text-white mb-2">
              ৳ {((metrics?.today?.averageOrderValue || 0) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200/50 dark:border-rose-500/20 w-fit px-2 py-0.5 rounded-lg">
              <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
              2% vs yesterday
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-900/70 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:scale-110 transition-transform text-amber-500 dark:text-amber-400">
            <AlertTriangle className="w-20 h-20" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-2xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Low Stock Items</h3>
            </div>
            <div className="text-2xl lg:text-3xl font-bold font-mono text-slate-900 dark:text-white mb-2">
              {metrics?.alerts?.lowStockCount || 0}
            </div>
            <div className="flex items-center text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 w-fit px-2 py-0.5 rounded-lg">
              Needs Attention
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Links / Empty state for charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        <div className="bg-white dark:bg-slate-900/70 rounded-2xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs min-h-[300px] flex items-center justify-center">
          <div className="text-slate-400 dark:text-slate-500 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
              <TrendingUp className="w-6 h-6 opacity-70" />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sales Analytics</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Sales chart will appear here when more transaction data is recorded.</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900/70 rounded-2xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs min-h-[300px] flex items-center justify-center">
          <div className="text-slate-400 dark:text-slate-500 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
              <ShoppingBag className="w-6 h-6 opacity-70" />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Top Selling Products</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Top performing items will appear here as orders complete.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
