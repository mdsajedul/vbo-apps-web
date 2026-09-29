'use client';

import { useState, useEffect } from 'react';
import { reportsApi } from '@/lib/api';
import { Download, Calendar, Receipt, FileText, ShoppingCart, RotateCcw, TrendingUp, Tag, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';

export default function SalesReportsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'Z-REPORT' | 'TAX'>('Z-REPORT');
  
  // Z-Report state
  const [zDate, setZDate] = useState(new Date().toISOString().split('T')[0]);
  const [zReport, setZReport] = useState<any>(null);
  const [zLoading, setZLoading] = useState(false);

  // Tax state
  const [taxStart, setTaxStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [taxEnd, setTaxEnd] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  const [taxReport, setTaxReport] = useState<any>(null);
  const [taxLoading, setTaxLoading] = useState(false);

  const fetchZReport = async () => {
    setZLoading(true);
    try {
      const data = await reportsApi.getZReport(zDate);
      setZReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setZLoading(false);
    }
  };

  const fetchTaxReport = async () => {
    setTaxLoading(true);
    try {
      const data = await reportsApi.getTaxReport(taxStart, taxEnd);
      setTaxReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setTaxLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'Z-REPORT') fetchZReport();
    else fetchTaxReport();
  }, [activeTab, zDate, taxStart, taxEnd]);

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportZReport = () => {
    if (!zReport) return;
    const lines = [
      'Metric,Amount',
      `Total Sales,${(zReport.total_sales || 0) / 100}`,
      `Total Tax,${(zReport.total_tax || 0) / 100}`,
      `Total Discount,${(zReport.total_discount || 0) / 100}`,
      `Transactions,${zReport.transaction_count || 0}`,
    ];
    Object.entries(zReport.by_payment_method || {}).forEach(([method, amount]: any) => {
      lines.push(`Payment (${method}),${(amount || 0) / 100}`);
    });
    downloadCSV(lines.join('\n'), `z-report-${zDate}.csv`);
  };

  const exportTaxReport = () => {
    if (!taxReport) return;
    const lines = [
      'Period,Total Taxable Sales,Total Tax Collected',
      `${taxReport.start_date} to ${taxReport.end_date},${(taxReport.total_taxable_sales || 0) / 100},${(taxReport.total_tax_collected || 0) / 100}`
    ];
    downloadCSV(lines.join('\n'), `tax-report-${taxStart}-to-${taxEnd}.csv`);
  };

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20 shadow-2xs">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('sales.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('sales.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/sales/transactions">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-indigo-500/30"
            >
              <Receipt className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('sales.total_transactions')}</span>
            </Button>
          </Link>
          <Link href="/sales/returns">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-rose-500/30"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span>{t('sales.returns_title')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Mode Selection Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 w-fit border border-slate-200/80 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('Z-REPORT')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'Z-REPORT'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('sales.tab_z_report')}
        </button>
        <button
          onClick={() => setActiveTab('TAX')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'TAX'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('sales.tab_tax')}
        </button>
      </div>

      {/* Main Container Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
        {activeTab === 'Z-REPORT' && (
          <div>
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('sales.select_date')}:</span>
                <input
                  type="date"
                  value={zDate}
                  onChange={(e) => setZDate(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono shadow-2xs"
                />
              </div>
              <Button
                onClick={exportZReport}
                disabled={!zReport || zReport.transaction_count === 0}
                variant="outline"
                className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold px-4 py-2 shadow-2xs hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t('sales.download_csv')}</span>
              </Button>
            </div>
            
            <CardContent className="p-6">
              {zLoading ? (
                <div className="text-center text-slate-500 py-16">
                  <div className="inline-flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                    <span>{t('sales.loading_report')}</span>
                  </div>
                </div>
              ) : zReport ? (
                <div className="space-y-6">
                  {/* KPI Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Gross Sales */}
                    <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('sales.gross_sales')}</p>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                        ৳{((zReport.total_sales || 0) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </h3>
                    </div>

                    {/* Tax Collected */}
                    <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('sales.tax_collected')}</p>
                      <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
                        ৳{((zReport.total_tax || 0) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </h3>
                    </div>

                    {/* Discounts */}
                    <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('sales.discount_given')}</p>
                      <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                        ৳{((zReport.total_discount || 0) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </h3>
                    </div>

                    {/* Transaction Count */}
                    <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('sales.total_transactions')}</p>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                        {(zReport.transaction_count || 0).toLocaleString()}
                      </h3>
                    </div>
                  </div>

                  {/* Payment Breakdown Table */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-indigo-500" />
                      <span>{t('sales.payment_breakdown')}</span>
                    </h3>

                    {Object.keys(zReport.by_payment_method || {}).length === 0 ? (
                      <div className="p-8 rounded-xl border border-dashed text-center text-xs text-slate-400">
                        {t('sales.no_data_for_date')}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                            <tr>
                              <th className="px-6 py-3.5 font-semibold">{t('sales.payment_method')}</th>
                              <th className="px-6 py-3.5 text-right font-semibold">{t('sales.amount_collected')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {Object.entries(zReport.by_payment_method).map(([method, amount]: any) => (
                              <tr key={method} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                                <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white text-xs">
                                  {method}
                                </td>
                                <td className="px-6 py-3.5 text-right font-bold font-mono text-emerald-600 dark:text-emerald-400 text-xs">
                                  ৳{((amount || 0) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </div>
        )}

        {activeTab === 'TAX' && (
          <div>
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('sales.start_date')}:</span>
                <input
                  type="date"
                  value={taxStart}
                  onChange={(e) => setTaxStart(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono shadow-2xs"
                />
                <span className="text-xs text-slate-400">{t('sales.end_date')}:</span>
                <input
                  type="date"
                  value={taxEnd}
                  onChange={(e) => setTaxEnd(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono shadow-2xs"
                />
              </div>
              <Button
                onClick={exportTaxReport}
                disabled={!taxReport}
                variant="outline"
                className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold px-4 py-2 shadow-2xs hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t('sales.download_csv')}</span>
              </Button>
            </div>

            <CardContent className="p-6">
              {taxLoading ? (
                <div className="text-center text-slate-500 py-16">
                  <div className="inline-flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                    <span>{t('sales.loading_report')}</span>
                  </div>
                </div>
              ) : taxReport ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-2xs">
                    <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                      {t('sales.taxable_sales')}
                    </h3>
                    <div className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
                      ৳{(((taxReport.total_taxable_sales || 0)) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-2xs">
                    <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
                      {t('sales.tax_collected')}
                    </h3>
                    <div className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      ৳{(((taxReport.total_tax_collected || 0)) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </div>
        )}
      </Card>
    </div>
  );
}
