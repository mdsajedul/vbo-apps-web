'use client';

import { useState, useEffect } from 'react';
import { returnsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';
import { 
  RotateCcw, Search, ChevronLeft, ChevronRight, 
  ShoppingCart, Receipt, CheckCircle, XCircle, Clock 
} from 'lucide-react';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useTranslation } from '@/i18n';

export default function ReturnsListPage() {
  const { t } = useTranslation();
  const [returns, setReturns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters and Pagination
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const data = await returnsApi.getAll();
      setReturns(data?.data || data || []);
    } catch (error) {
      toast.error(t('sales.process_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcess = async (id: string, status: string) => {
    try {
      await returnsApi.process(id, { status });
      toast.success(t('sales.process_success'));
      fetchReturns();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('sales.process_failed'));
    }
  };

  const filteredReturns = (Array.isArray(returns) ? returns : []).filter(ret => {
    const matchesStatus = statusFilter === 'ALL' || ret.status === statusFilter;
    const term = search.toLowerCase();
    const matchesSearch = !search || 
      (ret.sale?.receipt_number || '').toLowerCase().includes(term) || 
      (ret.customer?.name || '').toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage) || 1;
  const paginatedReturns = filteredReturns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-500/20 shadow-2xs">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('sales.returns_title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('sales.returns_subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/sales">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-indigo-500/30"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('sales.title')}</span>
            </Button>
          </Link>
          <Link href="/sales/transactions">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-indigo-500/30"
            >
              <Receipt className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('sales.total_transactions')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/40 dark:bg-slate-800/20">
          <div className="flex flex-1 items-center gap-3 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder={t('sales.search_returns')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-10 h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              />
            </div>
            <select 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            >
              <option value="ALL">{t('sales.filter_all')}</option>
              <option value="PENDING_APPROVAL">{t('sales.filter_pending')}</option>
              <option value="APPROVED">{t('sales.filter_approved')}</option>
              <option value="REJECTED">{t('sales.filter_rejected')}</option>
            </select>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {t('invoices.showing_entries', { start: filteredReturns.length ? ((currentPage - 1) * itemsPerPage) + 1 : 0, end: Math.min(currentPage * itemsPerPage, filteredReturns.length), total: filteredReturns.length })}
          </div>
        </div>

        {/* Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                <tr>
                  <th className="px-6 py-4 font-semibold">{t('sales.col_receipt')}</th>
                  <th className="px-6 py-4 font-semibold">{t('sales.col_customer')}</th>
                  <th className="px-6 py-4 font-semibold">{t('sales.col_date')}</th>
                  <th className="px-6 py-4 text-right font-semibold">{t('sales.col_refund')}</th>
                  <th className="px-6 py-4 font-semibold">{t('sales.payment_method')}</th>
                  <th className="px-6 py-4 font-semibold">{t('sales.col_status')}</th>
                  <th className="px-6 py-4 text-right font-semibold">{t('sales.col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        <span>{t('sales.loading_report')}</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedReturns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                          <RotateCcw className="w-5 h-5" />
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{t('sales.no_returns_found')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedReturns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      {/* Receipt */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                          {ret.sale?.receipt_number || 'N/A'}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        {ret.customer?.name || t('sales.col_customer')}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {ret.created_at ? format(new Date(ret.created_at), 'MMM dd, yyyy') : '-'}
                      </td>

                      {/* Refund Amount */}
                      <td className="px-6 py-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
                        ৳{((ret.refund_amount || 0) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Refund Method */}
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                        {ret.refund_method || t('sales.cash')}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {ret.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            {t('sales.status_approved')}
                          </span>
                        ) : ret.status === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20">
                            <XCircle className="w-3 h-3 text-rose-500" />
                            {t('sales.status_rejected')}
                          </span>
                        ) : ret.status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20">
                            <CheckCircle className="w-3 h-3 text-indigo-500" />
                            {t('sales.status_approved')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20">
                            <Clock className="w-3 h-3 text-amber-500" />
                            {t('sales.status_pending')}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5 items-center">
                          {ret.status === 'PENDING_APPROVAL' && (
                            <PermissionGuard permission="sales_returns:update">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 rounded-xl text-xs font-semibold border-emerald-200 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 px-3 shadow-2xs" 
                                onClick={() => handleProcess(ret.id, 'APPROVED')}
                              >
                                {t('sales.action_approve')}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 rounded-xl text-xs font-semibold border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-3 shadow-2xs" 
                                onClick={() => handleProcess(ret.id, 'REJECTED')}
                              >
                                {t('sales.action_reject')}
                              </Button>
                            </PermissionGuard>
                          )}
                          {ret.status === 'APPROVED' && (
                            <PermissionGuard permission="sales_returns:update">
                              <Button 
                                size="sm" 
                                className="h-8 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 shadow-xs" 
                                onClick={() => handleProcess(ret.id, 'COMPLETED')}
                              >
                                {t('sales.action_approve')}
                              </Button>
                            </PermissionGuard>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <div>
                {t('invoices.showing_entries', { start: ((currentPage - 1) * itemsPerPage) + 1, end: Math.min(currentPage * itemsPerPage, filteredReturns.length), total: filteredReturns.length })}
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="outline" size="icon" className="h-8 w-8 rounded-xl border-slate-200 dark:border-slate-700" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" size="icon" className="h-8 w-8 rounded-xl border-slate-200 dark:border-slate-700" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
