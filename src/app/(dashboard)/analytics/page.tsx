'use client';

import { useState, useEffect } from 'react';
import { analyticsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Package, Users, Activity, BarChart3, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { format } from 'date-fns';
import { useLanguage } from '@/i18n';

export default function AnalyticsDashboardPage() {
  const { t } = useLanguage();
  const [salesTrends, setSalesTrends] = useState<any[]>([]);
  const [inventoryHealth, setInventoryHealth] = useState<any>(null);
  const [staffPerformance, setStaffPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [salesRes, invRes, staffRes] = await Promise.all([
        analyticsApi.getSalesTrends(30),
        analyticsApi.getInventoryHealth(),
        analyticsApi.getStaffPerformance()
      ]);
      setSalesTrends(salesRes.data || salesRes || []);
      setInventoryHealth(invRes.data || invRes);
      setStaffPerformance(staffRes.data || staffRes || []);
    } catch (err) {
      toast.error(t('analytics.failed_to_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalSales = salesTrends.reduce((sum, day) => sum + (day.total || 0), 0);
  const formattedSalesTrends = salesTrends.map(t => ({ 
    ...t, 
    displayDate: t.date ? format(new Date(t.date), 'MMM dd') : '', 
    total: (t.total || 0) / 100 
  }));
  const formattedStaff = staffPerformance.map(s => ({ ...s, totalAmount: (s.totalAmount || 0) / 100 }));

  return (
    <div className="space-y-6 max-w-7xl pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20 shadow-2xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('analytics.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('analytics.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchAnalytics}
            className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center text-slate-500">
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            <span>{t('analytics.loading')}</span>
          </div>
        </div>
      ) : (
        <>
          {/* Top 3 KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('analytics.kpi_sales_volume')}
                  </p>
                  <h3 className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    ৳{(totalSales / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{t('analytics.kpi_sales_rolling')}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-2xs">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('analytics.kpi_stock_health')}
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {t('analytics.healthy_skus', { count: inventoryHealth?.healthy || 0 })}
                  </h3>
                  <p className="text-xs text-rose-500 font-semibold mt-0.5">
                    {t('analytics.stock_alert', { low: inventoryHealth?.lowStock || 0, depleted: inventoryHealth?.outOfStock || 0 })}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xs">
                  <Package className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('analytics.kpi_top_staff')}
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white truncate mt-1">
                    {staffPerformance[0]?.name || t('analytics.no_sales_yet')}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {staffPerformance[0] ? t('analytics.staff_sales_summary', { amount: `৳${formattedStaff[0]?.totalAmount.toLocaleString('en-BD')}`, count: staffPerformance[0]?.totalSales }) : t('analytics.no_transactions')}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-2xs">
                  <Users className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Line */}
            <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
              <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('analytics.revenue_trend_title')}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{t('analytics.revenue_trend_subtitle')}</p>
                </div>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{t('analytics.daily_breakdown')}</span>
              </div>

              <CardContent className="p-6">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedSalesTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:hidden" />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" className="hidden dark:block" />
                      <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(value) => `৳${value}`} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          border: '1px solid rgba(51, 65, 85, 0.5)',
                          borderRadius: '12px', 
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          color: '#f8fafc',
                          fontSize: '12px'
                        }}
                        formatter={(value: any) => [`৳${Number(value || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`, t('analytics.revenue')]}
                      />
                      <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#6366f1' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Staff Performance Bar */}
            <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
              <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('analytics.staff_perf_title')}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{t('analytics.staff_perf_subtitle')}</p>
                </div>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">{t('analytics.leaderboard')}</span>
              </div>

              <CardContent className="p-6">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedStaff} margin={{ top: 10, right: 20, left: 10, bottom: 0 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" className="dark:hidden" />
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1e293b" className="hidden dark:block" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(value) => `৳${value}`} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} width={90} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          border: '1px solid rgba(51, 65, 85, 0.5)',
                          borderRadius: '12px', 
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          color: '#f8fafc',
                          fontSize: '12px'
                        }}
                        formatter={(value: any) => [`৳${Number(value || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`, t('analytics.revenue_generated')]}
                      />
                      <Bar dataKey="totalAmount" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
