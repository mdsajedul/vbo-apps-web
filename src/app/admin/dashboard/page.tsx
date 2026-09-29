"use client"
import React, { useEffect, useState, useCallback } from 'react';
import { superAdminApi, platformAdminApi, ecosystemApi, ServiceHealthResult } from '@/lib/api';
import Link from 'next/link';
import { 
  Building2, Users, DollarSign, TrendingUp, Activity, 
  CheckCircle2, AlertTriangle, XCircle, RefreshCw, 
  Wifi, WifiOff, Clock, Server, Zap, MessageSquare,
  ArrowUpRight, ShieldCheck, Package, Globe2, MonitorCheck,
} from 'lucide-react';

interface EcosystemState {
  health: ServiceHealthResult[];
  erpMetrics: any;
  globalTenants: any[];
  products: any[];
}

function HealthBadge({ h }: { h: ServiceHealthResult }) {
  const color =
    h.status === 'online' ? 'emerald' :
    h.status === 'degraded' ? 'amber' : 'red';
  const Icon = h.status === 'online' ? Wifi : h.status === 'degraded' ? AlertTriangle : WifiOff;
  const label = h.service.replace('VBO ', '');
  const port = h.url.split(':').pop()?.replace(/\/.*/, '') || '';

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden group`}>
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
        color === 'emerald' ? 'from-emerald-400 to-emerald-600' :
        color === 'amber' ? 'from-amber-400 to-amber-600' : 'from-red-400 to-red-600'
      }`} />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-950' :
            color === 'amber' ? 'bg-amber-50 dark:bg-amber-950' : 'bg-red-50 dark:bg-red-950'
          }`}>
            <Server className={`w-4.5 h-4.5 ${
              color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
              color === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
            }`} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{label}</h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">:{port}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
          color === 'amber' ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800' :
          'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          <Icon className="w-3 h-3" />
          <span>{h.status}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <Clock className="w-3 h-3" />
          <span>{h.latencyMs}ms</span>
        </div>
        {h.error && (
          <span className="text-[10px] text-red-500 font-mono truncate">{h.error}</span>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, title, value, subtitle, color, trend }: {
  icon: any; title: string; value: string | number; subtitle: string; color: string; trend?: string;
}) {
  const colorMap: Record<string, { bg: string; icon: string; ring: string }> = {
    purple: { bg: 'bg-purple-50 dark:bg-purple-950', icon: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-100 dark:ring-purple-900' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950', icon: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-100 dark:ring-emerald-900' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-950', icon: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-100 dark:ring-blue-900' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950', icon: 'text-indigo-600 dark:text-indigo-400', ring: 'ring-indigo-100 dark:ring-indigo-900' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950', icon: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-100 dark:ring-amber-900' },
    cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950', icon: 'text-cyan-600 dark:text-cyan-400', ring: 'ring-cyan-100 dark:ring-cyan-900' },
  };
  const c = colorMap[color] || colorMap.purple;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.icon} flex items-center justify-center ring-1 ${c.ring}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-semibold text-slate-600 dark:text-slate-300 text-sm">{title}</h3>
      </div>
      <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1.5">
        {value}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{subtitle}</span>
        {trend && (
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded-md">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [state, setState] = useState<EcosystemState>({
    health: [],
    erpMetrics: null,
    globalTenants: [],
    products: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [health, erpMetrics, globalTenants, products] = await Promise.allSettled([
        ecosystemApi.checkAllHealth(),
        superAdminApi.getMetrics(),
        platformAdminApi.getGlobalTenants(),
        platformAdminApi.getProducts(),
      ]);

      setState({
        health: health.status === 'fulfilled' ? health.value : [],
        erpMetrics: erpMetrics.status === 'fulfilled' ? erpMetrics.value : null,
        globalTenants: globalTenants.status === 'fulfilled' ? globalTenants.value : [],
        products: products.status === 'fulfilled' ? products.value : [],
      });
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError(err.message || 'Failed to fetch ecosystem data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    // Auto-refresh health every 30s
    const interval = setInterval(async () => {
      try {
        const health = await ecosystemApi.checkAllHealth();
        setState(prev => ({ ...prev, health }));
        setLastRefresh(new Date());
      } catch { /* silent */ }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Derived data
  const { health, erpMetrics, globalTenants, products } = state;
  const onlineCount = health.filter(h => h.status === 'online').length;
  const totalTenants = globalTenants.length;
  const activeTenants = globalTenants.filter((t: any) => t.status === 'ACTIVE').length;
  const trialTenants = globalTenants.filter((t: any) =>
    t.subscriptions?.some((s: any) => s.status === 'TRIAL')
  ).length;
  const recentTenants = [...globalTenants]
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  // Count product subscriptions across all tenants
  const erpSubscriptions = globalTenants.filter((t: any) =>
    t.subscriptions?.some((s: any) => s.product_id === 'erp' && (s.status === 'ACTIVE' || s.status === 'TRIAL'))
  ).length;
  const connectSubscriptions = globalTenants.filter((t: any) =>
    t.subscriptions?.some((s: any) => s.product_id === 'connect' && (s.status === 'ACTIVE' || s.status === 'TRIAL'))
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-4"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading ecosystem data…</p>
        </div>
      </div>
    );
  }

  if (error && !erpMetrics && globalTenants.length === 0) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-400">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500" />
          Failed to Load
        </h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Ecosystem Command Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Multi-app health, global tenant telemetry, and unified operations across ERP & Connect.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              Last: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center space-x-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh All</span>
          </button>
        </div>
      </div>

      {/* ═══ SECTION 1: Live Ecosystem Health Monitor ═══ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MonitorCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Live Service Health
          </h2>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
            onlineCount === health.length 
              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
          }`}>
            {onlineCount}/{health.length} Online
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {health.map((h, i) => (
            <HealthBadge key={i} h={h} />
          ))}
        </div>
      </div>

      {/* ═══ SECTION 2: Unified Ecosystem KPI Grid ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          icon={Globe2}
          title="Global Workspaces"
          value={totalTenants}
          subtitle={`${activeTenants} active, ${trialTenants} trial`}
          color="purple"
        />
        <KpiCard
          icon={Package}
          title="ERP Subscriptions"
          value={erpSubscriptions}
          subtitle="Active & trial ERP tenants"
          color="blue"
        />
        <KpiCard
          icon={MessageSquare}
          title="Connect Subscriptions"
          value={connectSubscriptions}
          subtitle="Active & trial Connect tenants"
          color="cyan"
        />
        <KpiCard
          icon={DollarSign}
          title="Platform MRR"
          value={`৳ ${(erpMetrics?.mrr || 0).toLocaleString('en-BD')}`}
          subtitle="Monthly Recurring Revenue"
          color="emerald"
        />
      </div>

      {/* ═══ SECTION 3: ERP Operations + Cross-App Breakdown ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ERP Operations Telemetry */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            ERP Operations Volume
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide mb-1">Gross Sales</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">৳ {erpMetrics?.gross_volume_formatted || '0.00'}</p>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide mb-1">Total Sales</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{erpMetrics?.sales?.total_count || 0}</p>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide mb-1">System Users</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{erpMetrics?.users?.total || 0}</p>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide mb-1">ERP Tenants</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{erpMetrics?.tenants?.total || 0}</p>
            </div>
          </div>
        </div>

        {/* Tenant Status Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Global Tenant Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Active Tenants</span>
              </div>
              <span className="text-sm font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 px-3 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                {activeTenants}
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Trial Period</span>
              </div>
              <span className="text-sm font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 px-3 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                {trialTenants}
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Registered Products</span>
              </div>
              <span className="text-sm font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400 px-3 py-0.5 rounded-full border border-blue-300 dark:border-blue-800">
                {products.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 4: Recent Global Tenants ═══ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Latest Global Workspaces
          </h3>
          <Link
            href="/admin/tenants"
            className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-semibold flex items-center gap-1 transition-colors"
          >
            View All Tenants
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {recentTenants.length === 0 ? (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No global tenants found</p>
            <p className="text-xs">Create your first tenant from the Global Tenant Directory</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left py-2.5 px-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Organization</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Products</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Owner</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {recentTenants.map((tenant: any) => {
                  const owner = tenant.members?.find((m: any) => m.role === 'OWNER');
                  const subs = tenant.subscriptions || [];
                  return (
                    <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{tenant.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{tenant.slug}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          tenant.status === 'ACTIVE'
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : tenant.status === 'TRIAL'
                            ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                        }`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1.5">
                          {subs.map((s: any) => (
                            <span key={s.product_id} className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              s.status === 'ACTIVE'
                                ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}>
                              {s.product_id}
                            </span>
                          ))}
                          {subs.length === 0 && <span className="text-[10px] text-slate-400 dark:text-slate-500">—</span>}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          {owner?.user?.email || owner?.user?.full_name || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {new Date(tenant.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ SECTION 5: Quick Actions ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/admin/tenants"
          className="flex items-center gap-2.5 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Tenant Directory</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Manage global workspaces</p>
          </div>
        </Link>
        <Link
          href="/admin/plans"
          className="flex items-center gap-2.5 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Subscription Plans</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">ERP & Connect plans</p>
          </div>
        </Link>
        <Link
          href="/admin/feature-flags"
          className="flex items-center gap-2.5 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Feature Flags</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Toggle capabilities</p>
          </div>
        </Link>
        <a
          href="http://localhost:3005/api"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Platform API Docs</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Swagger/OpenAPI</p>
          </div>
        </a>
      </div>
    </div>
  );
}
