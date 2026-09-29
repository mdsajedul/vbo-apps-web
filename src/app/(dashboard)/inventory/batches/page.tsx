'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  Layers, AlertTriangle, ArrowLeft, Boxes, 
  Calendar, CheckCircle2, Package, Clock 
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/i18n';

export default function BatchesPage() {
  const { t } = useTranslation();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expiringBatches, setExpiringBatches] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/inventory/batches'),
      api.get('/inventory/batches/expiring?days=30')
    ]).then(([batchRes, expRes]) => {
      setBatches(batchRes.data?.data || batchRes.data || []);
      setExpiringBatches(expRes.data?.data || expRes.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

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
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20 shadow-2xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('inventory.batches.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('inventory.batches.subtitle')}
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
              <span>{t('inventory.batches.btn_overview')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Expiring Soon Alert Banner */}
      {expiringBatches.length > 0 && (
        <Card className="border-amber-200/80 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/20 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                {t('inventory.batches.expiring_alert_title', { count: expiringBatches.length })}
              </h4>
              <p className="text-xs text-amber-700/90 dark:text-amber-400/90 mt-0.5 mb-2.5">
                {t('inventory.batches.expiring_alert_desc')}
              </p>
              <div className="flex flex-wrap gap-2">
                {expiringBatches.map(b => (
                  <span key={b.id} className="bg-white/80 dark:bg-slate-900/80 border border-amber-300/60 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs px-2.5 py-1 rounded-lg font-medium shadow-2xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="font-bold">{b.product?.name}</span>
                    <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400">({t('inventory.batches.lot_prefix')} {b.batch_number})</span>
                    <span className="text-[11px] text-slate-500">{t('inventory.batches.exp_prefix')} {new Date(b.expiry_date).toLocaleDateString()}</span>
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batches Table Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('inventory.batches.table_title')}</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">{t('inventory.batches.tracked_lots', { count: batches.length })}</span>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 text-center text-slate-500">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                <span>{t('inventory.batches.loading')}</span>
              </div>
            </div>
          ) : batches.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{t('inventory.batches.no_batches')}</p>
                <p className="text-xs text-slate-400">{t('inventory.batches.no_batches_subtitle')}</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                  <tr>
                    <th className="px-6 py-4 font-semibold">{t('inventory.batches.col_lot')}</th>
                    <th className="px-6 py-4 font-semibold">{t('inventory.batches.col_product')}</th>
                    <th className="px-6 py-4 font-semibold">{t('inventory.batches.col_mfg_date')}</th>
                    <th className="px-6 py-4 font-semibold">{t('inventory.batches.col_expiry')}</th>
                    <th className="px-6 py-4 text-right font-semibold">{t('inventory.batches.col_stock')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {batches.map((batch: any) => {
                    const totalStock = batch.stocks?.reduce((sum: number, s: any) => sum + parseFloat(s.quantity), 0) || 0;
                    const isExpired = batch.expiry_date && new Date(batch.expiry_date) < new Date();
                    
                    return (
                      <tr key={batch.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${isExpired ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''}`}>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {batch.batch_number}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200 text-xs">
                          {batch.product?.name || '-'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {batch.manufacturing_date ? new Date(batch.manufacturing_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono">
                          {batch.expiry_date ? (
                            <span className={isExpired ? 'text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1' : 'text-slate-700 dark:text-slate-300'}>
                              {isExpired && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                              {new Date(batch.expiry_date).toLocaleDateString()}
                              {isExpired && ` (${t('inventory.batches.status_expired')})`}
                            </span>
                          ) : (
                            <span className="text-slate-400">{t('inventory.batches.no_expiry')}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          {totalStock > 0 ? (
                            <span className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                              {t('inventory.batches.units', { count: totalStock })}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">{t('inventory.batches.out_of_stock')}</span>
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
