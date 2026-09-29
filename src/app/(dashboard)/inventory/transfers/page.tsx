'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useBranchStore } from '@/lib/branch-store';
import { 
  ArrowRightLeft, Plus, Send, Download, 
  ArrowLeft, Building2, CheckCircle2, Clock, 
  Truck, Boxes, Globe, MapPin 
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useTranslation } from '@/i18n';

export default function BranchTransfersPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { selectedBranchId, selectedBranch } = useBranchStore();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const query = selectedBranchId && selectedBranchId !== 'ALL' 
      ? `?branch_id=${selectedBranchId}` 
      : '';
    api.get(`/inventory/transfers${query}`)
      .then(res => {
        setTransfers(res.data?.data || res.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBranchId]);

  const handleDispatch = async (id: string) => {
    const ok = await confirm({
      title: t('inventory.transfers.dispatch_confirm_title'),
      description: t('inventory.transfers.dispatch_confirm_desc'),
      confirmText: t('inventory.transfers.dispatch_confirm_btn'),
      variant: 'info',
    });
    if (!ok) return;
    try {
      await api.post(`/inventory/transfers/${id}/dispatch`, {});
      toast.success(t('inventory.transfers.dispatch_success'));
      setTransfers(transfers.map(t => t.id === id ? { ...t, status: 'IN_TRANSIT' } : t));
    } catch (error) {
      toast.error(t('inventory.transfers.dispatch_error'));
    }
  };

  const handleReceive = async (id: string) => {
    const ok = await confirm({
      title: t('inventory.transfers.receive_confirm_title'),
      description: t('inventory.transfers.receive_confirm_desc'),
      confirmText: t('inventory.transfers.receive_confirm_btn'),
      variant: 'default',
    });
    if (!ok) return;
    try {
      await api.post(`/inventory/transfers/${id}/receive`, {});
      toast.success(t('inventory.transfers.receive_success'));
      setTransfers(transfers.map(t => t.id === id ? { ...t, status: 'RECEIVED' } : t));
    } catch (error) {
      toast.error(t('inventory.transfers.receive_error'));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <Link href="/inventory">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs">
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </Button>
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 border border-teal-500/20 shadow-2xs">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('inventory.transfers.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('inventory.transfers.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/inventory">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold px-3.5 py-2 shadow-2xs"
            >
              <Boxes className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('inventory.transfers.btn_overview')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Transfers Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
        {/* Branch Context Indicator */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/40 dark:bg-slate-800/20">
          <div className="flex items-center gap-2.5">
            {selectedBranchId === 'ALL' || !selectedBranchId ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-2xs">
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{t('inventory.overview.viewing_all')}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-slate-400 font-normal">{t('inventory.overview.active_branch')}</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedBranch?.name || 'Selected Branch'}</span>
                {selectedBranch?.code && (
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                    {selectedBranch.code}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="text-xs text-slate-400 font-medium">
            {t('inventory.transfers.showing_records', { count: transfers.length })}
          </div>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 text-center text-slate-500">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                <span>{t('inventory.transfers.loading')}</span>
              </div>
            </div>
          ) : transfers.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{t('inventory.transfers.no_transfers')}</p>
                <p className="text-xs text-slate-400">{t('inventory.transfers.no_transfers_subtitle')}</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                  <tr>
                    <th className="px-6 py-4 font-semibold">{t('inventory.transfers.col_ref_no')}</th>
                    <th className="px-6 py-4 font-semibold">{t('inventory.transfers.col_source')}</th>
                    <th className="px-6 py-4 font-semibold">{t('inventory.transfers.col_dest')}</th>
                    <th className="px-6 py-4 font-semibold">{t('inventory.transfers.col_status')}</th>
                    <th className="px-6 py-4 font-semibold">{t('inventory.transfers.col_items')}</th>
                    <th className="px-6 py-4 text-right font-semibold">{t('inventory.transfers.col_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {transfers.map((tItem: any) => {
                    const isOutgoing = Boolean(selectedBranchId && selectedBranchId !== 'ALL' && tItem.from_branch_id === selectedBranchId);
                    const isIncoming = Boolean(selectedBranchId && selectedBranchId !== 'ALL' && tItem.to_branch_id === selectedBranchId);
                    const canDispatch = isOutgoing || selectedBranchId === 'ALL';
                    const canReceive = isIncoming || selectedBranchId === 'ALL';
                    
                    return (
                      <tr key={tItem.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {tItem.reference_no}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                          {isOutgoing ? (
                            <span className="font-bold text-teal-600 dark:text-teal-400">
                              {tItem.from_branch?.name} {t('inventory.transfers.current_badge')}
                            </span>
                          ) : (
                            tItem.from_branch?.name || '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                          {isIncoming ? (
                            <span className="font-bold text-teal-600 dark:text-teal-400">
                              {tItem.to_branch?.name} {t('inventory.transfers.current_badge')}
                            </span>
                          ) : (
                            tItem.to_branch?.name || '-'
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {tItem.status === 'RECEIVED' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> {t('inventory.transfers.status_received')}
                            </span>
                          ) : tItem.status === 'IN_TRANSIT' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 px-2.5 py-0.5 rounded-full">
                              <Truck className="w-3 h-3" /> {t('inventory.transfers.status_in_transit')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" /> {tItem.status ? tItem.status.replace('_', ' ') : t('inventory.transfers.status_draft')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-bold text-slate-900 dark:text-white">{tItem.items?.length || 0}</span> {t('inventory.transfers.products_suffix')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {canDispatch && tItem.status === 'DRAFT' && (
                            <PermissionGuard permission="inventory_transfers:update">
                              <Button 
                                size="sm" 
                                onClick={() => handleDispatch(tItem.id)} 
                                className="h-8 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white px-3 shadow-2xs gap-1.5"
                              >
                                <Send className="w-3.5 h-3.5" /> {t('inventory.transfers.btn_dispatch')}
                              </Button>
                            </PermissionGuard>
                          )}
                          {canReceive && tItem.status === 'IN_TRANSIT' && (
                            <PermissionGuard permission="inventory_transfers:update">
                              <Button 
                                size="sm" 
                                onClick={() => handleReceive(tItem.id)} 
                                className="h-8 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 shadow-2xs gap-1.5"
                              >
                                <Download className="w-3.5 h-3.5" /> {t('inventory.transfers.btn_receive')}
                              </Button>
                            </PermissionGuard>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
