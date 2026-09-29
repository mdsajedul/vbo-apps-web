'use client';

import { useState, useEffect } from 'react';
import { crmApi } from '@/lib/api';
import { 
  DollarSign, Hourglass, BarChart3, TrendingUp, 
  AlertCircle, Users, Target, GitPullRequest, 
  Layers, RefreshCw 
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function CrmDashboardPage() {
  const [pipelineVal, setPipelineVal] = useState<any>(null);
  const [velocity, setVelocity] = useState<any>(null);
  const [funnel, setFunnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [valRes, velRes, funnelRes] = await Promise.all([
        crmApi.getPipelineValue(),
        crmApi.getSalesVelocity(),
        crmApi.getFunnelData()
      ]);
      setPipelineVal(valRes);
      setVelocity(velRes);
      setFunnel(funnelRes || []);
    } catch (err) {
      console.error('Failed to load CRM dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatTaka = (amountPaisa: number) => {
    return `৳ ${(amountPaisa / 100).toLocaleString('en-BD', {
      maximumFractionDigits: 0
    })}`;
  };

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6 max-w-7xl pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-500/20 shadow-2xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              CRM & Sales Pipeline
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live deal flow telemetry, weighted probability forecasts, and lead velocity analytics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/crm/leads">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-rose-500/30"
            >
              <Users className="w-3.5 h-3.5 text-rose-500" />
              <span>Leads</span>
            </Button>
          </Link>
          <Link href="/crm/opportunities">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-indigo-500/30"
            >
              <Target className="w-3.5 h-3.5 text-indigo-500" />
              <span>Deals</span>
            </Button>
          </Link>
          <Link href="/crm/pipelines">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-amber-500/30"
            >
              <GitPullRequest className="w-3.5 h-3.5 text-amber-500" />
              <span>Pipelines</span>
            </Button>
          </Link>
          <Link href="/crm/segments">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-teal-500/30"
            >
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>Segments</span>
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={loadData}
            className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          </Button>
        </div>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pipeline Value */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Total Pipeline Value
              </p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {pipelineVal ? formatTaka(pipelineVal.totalValue) : '৳ 0'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Active Deals: <span className="font-bold text-slate-800 dark:text-slate-200">{pipelineVal?.opportunityCount || 0}</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xs">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Weighted Value */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Weighted Forecast Value
              </p>
              <h3 className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {pipelineVal ? formatTaka(pipelineVal.weightedValue) : '৳ 0'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Adjusted for stage win probability
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-2xs">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Sales Velocity */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Sales Velocity
              </p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {velocity ? `${velocity.averageDays} days` : '0 days'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Avg time (<span className="font-bold text-slate-800 dark:text-slate-200">{velocity?.convertedCount || 0}</span> won deals)
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-2xs">
              <Hourglass className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Chart */}
        <Card className="lg:col-span-2 border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sales Conversion Funnel</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Deals distribution</span>
          </div>

          <CardContent className="p-6 h-80">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                <span>Loading funnel...</span>
              </div>
            ) : funnel.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <AlertCircle className="w-6 h-6 text-slate-400" />
                <span>No active funnel stages or deals tracked yet</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                  <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(51, 65, 85, 0.5)',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                    cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {funnel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Funnel Table Details */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Stage Conversion Yield</h3>
            <span className="text-xs text-slate-400 font-medium">Fulfillment %</span>
          </div>

          <CardContent className="p-6">
            <div className="space-y-4">
              {funnel.map((item, idx) => {
                const totalDeals = funnel.reduce((sum, f) => sum + f.count, 0);
                const percent = totalDeals > 0 ? Math.round((item.count / totalDeals) * 100) : 0;
                return (
                  <div key={item.stage} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">{item.stage}</span>
                      <span className="text-slate-900 dark:text-white font-bold">
                        {item.count} <span className="text-[11px] text-slate-400 font-normal">({percent}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: colors[idx % colors.length]
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {funnel.length === 0 && !loading && (
                <p className="text-slate-400 text-xs text-center py-8">No pipeline stages defined</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
