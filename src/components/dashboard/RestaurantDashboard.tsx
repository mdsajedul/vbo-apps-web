'use client';

import React, { useState, useEffect } from 'react';
import { reportsApi } from '@/lib/api';
import { useBranchStore } from '@/lib/branch-store';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Users,
  Utensils,
  Clock,
  RefreshCw,
  Award,
  AlertOctagon,
  Calendar,
  Flame,
  ArrowUpRight,
  TrendingDown,
  Layers,
  ChefHat,
  Receipt,
  Store,
  Globe,
  MapPin
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export function RestaurantDashboard() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'top' | 'slow'>('top');

  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const selectedBranch = useBranchStore((s) => s.selectedBranch);

  // Fetch Restaurant Metrics
  const fetchMetrics = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await reportsApi.getRestaurantDashboardMetrics({
        period,
        branchId: selectedBranchId && selectedBranchId !== 'ALL' ? selectedBranchId : undefined
      });
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load restaurant metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [period, selectedBranchId]);

  const kpis = metrics?.kpis || {};
  const charts = metrics?.charts || {};
  const tables = metrics?.tables || {};
  const commandWidgets = metrics?.commandWidgets || {};

  // Custom Chart Tooltip for Sales Trend
  const CustomSalesTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-white text-xs">
          <p className="font-semibold text-slate-300 mb-1">{label}</p>
          <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
            <span>Sales:</span>
            <span>৳ {(payload[0].value || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
          </div>
          {payload[1] && (
            <div className="flex items-center gap-2 text-emerald-400 text-xs mt-0.5">
              <span>Orders:</span>
              <span>{payload[1].value}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Synthesizing Restaurant Operating Command Metrics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ─── HEADER & CONTROLS ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900/70 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-500/20 shadow-2xs">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Restaurant Operating Command
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Live performance analytics & intelligent operational insights
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Active Branch Context Indicator */}
          {selectedBranchId === 'ALL' ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Consolidated (All Branches)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{selectedBranch?.name || 'Branch View'}</span>
              {selectedBranch?.code && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                  {selectedBranch.code}
                </span>
              )}
            </span>
          )}

          {/* Period Toggle Pill Switch */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  period === p
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-600'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── TOP 6 KEY PERFORMANCE INDICATOR CARDS ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-4">
        {/* Card 1: Today's Revenue */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:scale-110 transition-transform">
            <DollarSign className="w-20 h-20" />
          </div>
          <div className="relative z-10">
            <div className="text-[11px] uppercase tracking-wider font-bold text-blue-100 mb-1">
              {period === 'today' ? "Today's Revenue" : period === 'week' ? 'Weekly Revenue' : 'Monthly Revenue'}
            </div>
            <div className="text-2xl font-black tracking-tight mb-2">
              ৳ {(kpis.totalSalesBdt || 0).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="flex items-center text-[11px] font-semibold text-emerald-200 bg-white/10 backdrop-blur-sm w-fit px-2 py-0.5 rounded-lg border border-white/10">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +14.2% vs prev period
            </div>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white dark:bg-slate-900/70 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              {period === 'today' ? "Today's Orders" : 'Total Orders'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-2">{kpis.orderCount || 0}</div>
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 w-fit px-2 py-0.5 rounded-lg border border-emerald-200/50 dark:border-emerald-500/20">
            +8.5% order velocity
          </div>
        </div>

        {/* Card 3: Average Check Size */}
        <div className="bg-white dark:bg-slate-900/70 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Avg Check Size</span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-500/20 shadow-2xs">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            ৳ {(kpis.averageOrderValueBdt || 0).toLocaleString('en-BD', { minimumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Per guest table ticket
          </div>
        </div>

        {/* Card 4: Total Customers */}
        <div className="bg-white dark:bg-slate-900/70 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Total Customers</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-2xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-2">{kpis.totalCustomersCount || 0}</div>
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 w-fit px-2 py-0.5 rounded-lg border border-emerald-200/50 dark:border-emerald-500/20">
            Active directory
          </div>
        </div>

        {/* Card 5: Active Tables Floor Occupancy */}
        <div className="bg-white dark:bg-slate-900/70 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Active Tables</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-2xs">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            {kpis.activeTables?.occupied || 0} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">/ {kpis.activeTables?.total || 15}</span>
          </div>
          <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 w-fit px-2 py-0.5 rounded-lg border border-amber-200/50 dark:border-amber-500/20">
            {Math.round(((kpis.activeTables?.occupied || 0) / (kpis.activeTables?.total || 15)) * 100)}% Floor Occupancy
          </div>
        </div>

        {/* Card 6: Current Shift Control */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs relative overflow-hidden border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Register Shift</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          {kpis.currentShift?.isOpen ? (
            <div>
              <div className="text-lg font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Open Register
              </div>
              <p className="text-[11px] text-slate-300">
                Starting: ৳{kpis.currentShift.startingCashBdt} BDT
              </p>
            </div>
          ) : (
            <div>
              <div className="text-lg font-bold text-amber-400 mb-1">Shift Closed</div>
              <p className="text-[11px] text-slate-400">Open register via POS</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── CHARTS ROW 1: SALES TREND & ORDER TYPE DONUT ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Area Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/70 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Sales & Order Volume Trend</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {period === 'today' ? 'Hourly revenue progression' : 'Daily sales breakdown over selected period'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400" /> Revenue (BDT)
              </span>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.salesTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomSalesTooltip />} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#2563EB"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#salesGradient)"
                  activeDot={{ r: 6, fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Type Distribution Donut Chart (1 Col) */}
        <div className="bg-white dark:bg-slate-900/70 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-1">Order Type Distribution</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Dine-In vs Takeaway vs Delivery mix</p>
          </div>

          <div className="h-[200px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.orderTypeBreakdown || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(charts.orderTypeBreakdown || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} orders`, 'Volume']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{kpis.orderCount || 0}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Total Orders</span>
            </div>
          </div>

          {/* Custom Badges Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {(charts.orderTypeBreakdown || []).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div className="truncate">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block truncate">{item.name}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{item.value} orders</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── PERIOD SUMMARY OVERVIEW BAR ─── */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              {period === 'today' ? "Today's Period Performance Summary" : period === 'week' ? 'Weekly Consolidated Summary' : 'Monthly Consolidated Summary'}
            </h3>
            <p className="text-xs text-slate-500">Financial aggregation & guest metrics</p>
          </div>
          <span className="text-xs font-bold bg-blue-900/60 text-blue-300 px-3 py-1 rounded-xl border border-blue-700/40">
            Live Stream
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-center">
          <div>
            <span className="text-xs text-slate-400 font-medium block mb-1">Gross Sales Revenue</span>
            <span className="text-xl font-black text-white">৳{(kpis.totalSalesBdt || 0).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block mb-1">Total Tax Collected</span>
            <span className="text-xl font-black text-emerald-400">৳{(kpis.taxTotalBdt || 0).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block mb-1">Discounts Granted</span>
            <span className="text-xl font-black text-amber-400">৳{(kpis.discountTotalBdt || 0).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block mb-1">Average Check</span>
            <span className="text-xl font-black text-indigo-300">৳{(kpis.averageOrderValueBdt || 0).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block mb-1">Total Orders Processed</span>
            <span className="text-xl font-black text-violet-300">{kpis.orderCount || 0}</span>
          </div>
        </div>
      </div>

      {/* ─── CHARTS ROW 2: FINANCIALS (INCOME vs EXPENSE & PURCHASES) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Bar Chart */}
        <div className="bg-white dark:bg-slate-900/70 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Income vs Expense</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">General ledger financial revenue & operating cost comparison</p>
            </div>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.incomeVsExpense || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(val: any) => [`৳ ${val.toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Income (Sales)" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Expense (Cost)" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Purchase Intake Trend Chart */}
        <div className="bg-white dark:bg-slate-900/70 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Procurement & Purchases</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Goods Receipt Note (GRN) inventory intake costs</p>
            </div>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.purchaseTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(val: any) => [`৳ ${val.toLocaleString()}`, 'Purchases']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#FFF' }}
                />
                <Bar dataKey="amount" name="Procurement Cost" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── DATA TABLES: TOP SELLING & SLOW SELLING PRODUCTS ─── */}
      <div className="bg-white dark:bg-slate-900/70 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Product Performance Matrix</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Menu item velocity & revenue rankings</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('top')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'top' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Top Selling Items
            </button>
            <button
              onClick={() => setActiveTab('slow')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'slow' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" /> Slow Selling Items
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-6">Rank</th>
                <th className="py-3.5 px-6">Menu Item Name</th>
                <th className="py-3.5 px-6 text-right">Quantity Sold</th>
                <th className="py-3.5 px-6 text-right">Revenue (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {(activeTab === 'top' ? tables.topSellingItems : tables.slowSellingItems)?.length > 0 ? (
                (activeTab === 'top' ? tables.topSellingItems : tables.slowSellingItems).map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-6">
                      <span
                        className={`w-6 h-6 rounded-full font-extrabold text-[11px] inline-flex items-center justify-center ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : idx === 2
                            ? 'bg-amber-700/20 text-amber-900 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-white">{item.name}</td>
                    <td className="py-3.5 px-6 text-right font-bold text-slate-900 dark:text-white">{item.quantity} units</td>
                    <td className="py-3.5 px-6 text-right font-bold text-blue-600 dark:text-blue-400">
                      ৳ {item.revenueBdt.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No product transaction data available for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── STANDOUT RESTAURANT COMMAND WIDGETS (OUR COMPETITIVE EDGE) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Widget 1: Kitchen Prep Time */}
        <div className="bg-white dark:bg-slate-900/70 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-500/20 shrink-0 shadow-2xs">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Kitchen Prep Time</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{commandWidgets.avgKitchenPrepMinutes || 12} min</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">Optimal Service Speed</span>
          </div>
        </div>

        {/* Widget 2: Table Turnover Rate */}
        <div className="bg-white dark:bg-slate-900/70 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20 shrink-0 shadow-2xs">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Settled Sessions</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{commandWidgets.tableTurnoverCount || 0} tables</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">Completed Dining Sessions</span>
          </div>
        </div>

        {/* Widget 3: Live Guest Rating */}
        <div className="bg-white dark:bg-slate-900/70 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/20 shrink-0 shadow-2xs">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Guest Satisfaction</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {commandWidgets.guestRating?.average || 4.8} <span className="text-amber-500">★</span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">
              Based on {commandWidgets.guestRating?.totalReviews || 12} reviews
            </span>
          </div>
        </div>

        {/* Widget 4: Loss Prevention Void & Comp Alert */}
        <div className="bg-white dark:bg-slate-900/70 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-500/20 shrink-0 shadow-2xs">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Voids & Comps</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{commandWidgets.voidCompAlertCount || 0} items</span>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block">Loss Prevention Watch</span>
          </div>
        </div>
      </div>
    </div>
  );
}
