'use client';

import { useState, useEffect, useMemo } from 'react';
import { invoicesApi, paymentsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { 
  Plus, Eye, MoreHorizontal, Link as LinkIcon, Search, 
  ChevronLeft, ChevronRight, Receipt, ArrowUpRight, 
  Clock, CheckCircle, AlertCircle, Copy, ExternalLink 
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useTranslation } from '@/i18n';

export default function InvoicesPage() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [gateways, setGateways] = useState<any[]>([]);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [generatedLink, setGeneratedLink] = useState('');

  useEffect(() => {
    fetchInvoices();
    fetchGateways();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await invoicesApi.getAll();
      setInvoices(res.data || res || []);
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchGateways = async () => {
    try {
      const res = await paymentsApi.getGateways();
      setGateways((res.data || res || []).filter((g: any) => g.is_enabled));
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateLink = async (invoice: any) => {
    if (gateways.length === 0) {
      toast.error(t('invoices.no_gateways'));
      return;
    }
    
    // Pick the first gateway as default
    const defaultGateway = gateways[0].gateway_name;

    try {
      const response = await paymentsApi.generateLink({
        gateway: defaultGateway,
        invoice_id: invoice.id,
        amount: invoice.total_amount - invoice.paid_amount,
        currency: 'BDT'
      });
      setGeneratedLink(`${window.location.origin}/checkout/${response.token}`);
      setActiveInvoice(invoice);
      setLinkDialogOpen(true);
    } catch (err) {
      console.error(err);
      toast.error(t('invoices.generate_link_failed'));
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success(t('invoices.link_copied'));
  };

  const filteredInvoices = invoices.filter(inv => {
    const term = searchQuery.toLowerCase();
    return (inv.invoice_number || '').toLowerCase().includes(term) || 
           (inv.customer?.name || '').toLowerCase().includes(term);
  });

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage) || 1;
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Quick KPI Statistics
  const stats = useMemo(() => {
    const totalBilled = invoices.reduce((acc, inv) => acc + (inv.total_amount || 0), 0);
    const totalCollected = invoices.reduce((acc, inv) => acc + (inv.paid_amount || 0), 0);
    const outstanding = totalBilled - totalCollected;
    const overdueCount = invoices.filter(inv => inv.status === 'OVERDUE').length;

    return {
      billed: totalBilled,
      collected: totalCollected,
      outstanding: outstanding,
      overdue: overdueCount,
    };
  }, [invoices]);

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20 shadow-2xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('invoices.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('invoices.subtitle')}
            </p>
          </div>
        </div>

        <PermissionGuard permission="invoices:create">
          <Link href="/invoices/new">
            <Button className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs">
              <Plus className="w-4 h-4" />
              <span>{t('invoices.create_invoice')}</span>
            </Button>
          </Link>
        </PermissionGuard>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('invoices.total_billed')}
              </p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 font-mono">
                ৳ {(stats.billed / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-2xs">
              <Receipt className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Collected */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('invoices.total_collected')}
              </p>
              <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                ৳ {(stats.collected / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-2xs">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Outstanding */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('invoices.outstanding_balance')}
              </p>
              <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
                ৳ {(stats.outstanding / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('invoices.overdue_accounts')}
              </p>
              <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
                {stats.overdue} <span className="text-xs font-normal text-slate-400">{t('invoices.invoices_count')}</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-2xs">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4 bg-slate-50/40 dark:bg-slate-800/20">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder={t('invoices.search_placeholder')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {t('invoices.showing_entries', { start: filteredInvoices.length ? ((currentPage - 1) * itemsPerPage) + 1 : 0, end: Math.min(currentPage * itemsPerPage, filteredInvoices.length), total: filteredInvoices.length })}
          </div>
        </div>

        {/* Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                <tr>
                  <th className="px-6 py-4 font-semibold">{t('invoices.col_invoice_number')}</th>
                  <th className="px-6 py-4 font-semibold">{t('invoices.col_customer')}</th>
                  <th className="px-6 py-4 font-semibold">{t('invoices.col_issue_date')}</th>
                  <th className="px-6 py-4 font-semibold">{t('invoices.col_due_date')}</th>
                  <th className="px-6 py-4 text-right font-semibold">{t('invoices.col_amount')}</th>
                  <th className="px-6 py-4 font-semibold">{t('invoices.col_status')}</th>
                  <th className="px-6 py-4 text-right font-semibold">{t('invoices.col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        <span>Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{t('invoices.no_invoices')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      {/* Invoice Number */}
                      <td className="px-6 py-4">
                        <Link href={`/invoices/${inv.id}`} className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                          {inv.invoice_number}
                        </Link>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white text-xs">
                          {inv.customer?.name || 'Walk-in'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {inv.customer?.phone || inv.customer?.email || ''}
                        </div>
                      </td>

                      {/* Issue Date */}
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {inv.created_at ? format(new Date(inv.created_at), 'MMM dd, yyyy') : '-'}
                      </td>

                      {/* Due Date */}
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {inv.due_date ? format(new Date(inv.due_date), 'MMM dd, yyyy') : '-'}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white text-xs">
                        ৳ {((inv.total_amount || 0) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {inv.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {t('invoices.status_paid')}
                          </span>
                        ) : inv.status === 'PARTIALLY_PAID' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            {t('invoices.status_partial')}
                          </span>
                        ) : inv.status === 'OVERDUE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            {t('invoices.status_overdue')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            {inv.status || t('invoices.status_pending')}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5 items-center">
                          <Link href={`/invoices/${inv.id}`}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600 px-3 shadow-2xs gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" /> 
                              <span>{t('invoices.view_invoice')}</span>
                            </Button>
                          </Link>
                          
                          {(inv.status !== 'PAID' && inv.status !== 'CANCELLED') && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                                  <MoreHorizontal className="w-4 h-4 text-slate-500" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl p-1.5 border border-slate-200 dark:border-slate-800 shadow-lg">
                                <DropdownMenuItem 
                                  onClick={() => handleGenerateLink(inv)}
                                  className="rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer"
                                >
                                  <LinkIcon className="w-3.5 h-3.5 text-indigo-600" /> 
                                  <span>{t('invoices.generate_payment_link')}</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                {t('invoices.showing_entries', { start: ((currentPage - 1) * itemsPerPage) + 1, end: Math.min(currentPage * itemsPerPage, filteredInvoices.length), total: filteredInvoices.length })}
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

      {/* ────────────────────────────────────────────────────────────────────────
          PAYMENT LINK GENERATED MODAL
      ──────────────────────────────────────────────────────────────────────── */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          {/* Header */}
          <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                  <LinkIcon className="w-3.5 h-3.5" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('invoices.link_dialog_title')}
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('invoices.link_dialog_subtitle')}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p>{t('invoices.invoice_label')}: <strong className="text-slate-900 dark:text-white font-mono">{activeInvoice?.invoice_number}</strong></p>
              <p>{t('invoices.client_label')}: <strong className="text-slate-900 dark:text-white">{activeInvoice?.customer?.name}</strong></p>
              <p>{t('invoices.due_amount_label')}: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">৳{(((activeInvoice?.total_amount || 0) - (activeInvoice?.paid_amount || 0)) / 100).toLocaleString('en-BD', {minimumFractionDigits: 2})}</strong></p>
            </div>

            <div className="flex gap-2">
              <Input value={generatedLink} readOnly className="bg-slate-50 dark:bg-slate-800/60 font-mono text-xs rounded-xl" />
              <Button onClick={copyLink} className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs">
                {t('invoices.copy_link')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
