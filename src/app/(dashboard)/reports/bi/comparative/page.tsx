'use client';

import { useState, useEffect } from 'react';
import { biApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { 
  Play, TrendingUp, TrendingDown, ArrowRightLeft, 
  Building2, Calendar, DollarSign, Activity 
} from 'lucide-react';
import { useLanguage } from '@/i18n';

export default function ComparativePage() {
  const { t } = useLanguage();
  const [metric, setMetric] = useState<string>('SALES_VALUE');
  
  // Date states
  const [start1, setStart1] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [end1, setEnd1] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [start2, setStart2] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0]
  );
  const [end2, setEnd2] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [compareData, setCompareData] = useState<any | null>(null);
  
  // Branch comparison
  const [branchData, setBranchData] = useState<any[]>([]);
  const [branchLoading, setBranchLoading] = useState<boolean>(true);

  async function loadBranchComparison() {
    try {
      setBranchLoading(true);
      const data = await biApi.getBranchComparison();
      setBranchData(data || []);
    } catch (err) {
      console.error(err);
      toast.error(t('bi.comparative.branch_error'));
    } finally {
      setBranchLoading(false);
    }
  }

  useEffect(() => {
    loadBranchComparison();
  }, []);

  const runComparison = async () => {
    try {
      setLoading(true);
      const data = await biApi.getComparative({
        metric,
        start1: new Date(start1).toISOString(),
        end1: new Date(end1).toISOString(),
        start2: new Date(start2).toISOString(),
        end2: new Date(end2).toISOString()
      });
      setCompareData(data);
      toast.success(t('bi.comparative.compute_success'));
    } catch (err) {
      console.error(err);
      toast.error(t('bi.comparative.compute_error'));
    } finally {
      setLoading(false);
    }
  };

  const getMetricName = (m: string) => {
    switch (m) {
      case 'SALES_VALUE': return t('bi.comparative.metric_sales_value');
      case 'ORDERS_COUNT': return t('bi.comparative.metric_orders_count');
      case 'RETURNS_VALUE': return t('bi.comparative.metric_returns_value');
      default: return m;
    }
  };

  const formatValue = (val: number, m: string) => {
    if (m.includes('VALUE')) {
      return `৳ ${val.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return val.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Parameters Panel Card */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0 border border-sky-500/20">
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('bi.comparative.title')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('bi.comparative.subtitle')}
            </p>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('bi.comparative.metric_label')}
              </Label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                <option value="SALES_VALUE">{t('bi.comparative.metric_sales_value')}</option>
                <option value="ORDERS_COUNT">{t('bi.comparative.metric_orders_count')}</option>
                <option value="RETURNS_VALUE">{t('bi.comparative.metric_returns_value')}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('bi.comparative.period_1_label')}
              </Label>
              <div className="flex gap-2">
                <Input type="date" value={start1} onChange={(e) => setStart1(e.target.value)} className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-800" />
                <Input type="date" value={end1} onChange={(e) => setEnd1(e.target.value)} className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-800" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('bi.comparative.period_2_label')}
              </Label>
              <div className="flex gap-2">
                <Input type="date" value={start2} onChange={(e) => setStart2(e.target.value)} className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-800" />
                <Input type="date" value={end2} onChange={(e) => setEnd2(e.target.value)} className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-800" />
              </div>
            </div>

            <Button 
              onClick={runComparison} 
              disabled={loading} 
              className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-5 shadow-xs flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{loading ? t('bi.comparative.computing') : t('bi.comparative.btn_compare')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Output Cards */}
      {loading ? (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-12 flex items-center justify-center">
          <Spinner className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </Card>
      ) : compareData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('bi.comparative.period_1_title')}</span>
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-2">
              {formatValue(compareData.period1, metric)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">{t('bi.comparative.period_1_window')}</div>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('bi.comparative.period_2_title')}</span>
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-500/20">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-2">
              {formatValue(compareData.period2, metric)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">{t('bi.comparative.period_2_window')}</div>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('bi.comparative.net_diff_title')}</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Activity className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className={`text-xl font-mono font-bold mt-2 ${compareData.difference >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {compareData.difference >= 0 ? '+' : ''}{formatValue(compareData.difference, metric)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">{t('bi.comparative.variance_delta')}</div>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t('bi.comparative.growth_title')}</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {compareData.percentageChange >= 0 ? (
                <span className="inline-flex items-center gap-1 text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-5 h-5" /> +{compareData.percentageChange}%
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xl font-mono font-bold text-rose-600 dark:text-rose-400">
                  <TrendingDown className="w-5 h-5" /> {compareData.percentageChange}%
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">{t('bi.comparative.pop_shift')}</div>
          </Card>
        </div>
      ) : null}

      {/* Branch Side-by-Side Comparison */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0 border border-sky-500/20">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('bi.comparative.branch_title')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('bi.comparative.branch_subtitle')}
            </p>
          </div>
        </div>

        <CardContent className="p-6">
          {branchLoading ? (
            <div className="h-32 flex items-center justify-center">
              <Spinner className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          ) : branchData.length > 0 ? (
            <div className="space-y-5">
              {branchData.map((branch, index) => {
                const maxRev = Math.max(...branchData.map(b => b.revenue)) || 1;
                const percent = (branch.revenue / maxRev) * 100;
                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-900 dark:text-white font-bold">{branch.branchName}</span>
                      <span className="font-mono text-slate-900 dark:text-white">
                        ৳ {branch.revenue.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-sky-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">{t('bi.comparative.sales_executed', { count: branch.salesCount })}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-6">{t('bi.comparative.no_branch_data')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
