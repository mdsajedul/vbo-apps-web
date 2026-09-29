'use client';

import { useState, useEffect, useMemo } from 'react';
import { inventoryApi, productsApi } from '@/lib/api';
import { useBranchStore } from '@/lib/branch-store';
import { useMasterData } from '@/hooks/useMasterData';
import { 
  Plus, Edit2, AlertTriangle, ArrowDown, ArrowUp, 
  Boxes, ArrowRightLeft, Layers, Users, Building2, 
  CheckCircle2, Check, X, ShieldAlert, Globe, MapPin 
} from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormError } from '@/components/ui/form-error';
import { toast } from 'sonner';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useTranslation } from '@/i18n';

const adjustSchema = z.object({
  branch_id: z.string().min(1, 'Branch is required'),
  product_id: z.string().min(1, 'Product is required'),
  variant_id: z.string().optional(),
  quantity_change: z.number().min(1, 'Quantity must be at least 1'),
  type: z.enum(['ADD', 'SUB']),
  reason: z.string().min(1, 'Reason is required'),
});

type AdjustFormValues = z.infer<typeof adjustSchema>;

export default function InventoryPage() {
  const { t } = useTranslation();
  const { selectedBranchId, selectedBranch, branches, fetchAccessibleBranches } = useBranchStore();
  const { data: adjustmentReasons = [] } = useMasterData('ADJUSTMENT_REASON');
  const [inventory, setInventory] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);

  const form = useForm<AdjustFormValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: {
      branch_id: '',
      product_id: '',
      variant_id: '',
      quantity_change: 1,
      type: 'ADD',
      reason: 'MANUAL_COUNT'
    }
  });

  const watchProductId = form.watch('product_id');
  const watchType = form.watch('type');

  const fetchData = async () => {
    try {
      setLoading(true);
      const activeBranchFilter = selectedBranchId && selectedBranchId !== 'ALL' ? selectedBranchId : undefined;
      const [invResult, prodData] = await Promise.all([
        inventoryApi.getAll({ branch_id: activeBranchFilter, page: currentPage, limit: itemsPerPage }),
        productsApi.getAll(),
        branches.length === 0 ? fetchAccessibleBranches().catch(() => null) : Promise.resolve(null)
      ]);
      setInventory(invResult.data || []);
      if (invResult.meta) {
        setTotalItems(invResult.meta.total);
      }
      setProducts(prodData.data || prodData || []);
    } catch (error) {
      console.error(error);
      toast.error(t('inventory.adjust_modal.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranchId, currentPage, itemsPerPage]);

  const handleOpenModal = () => {
    const defaultBranchId = selectedBranchId && selectedBranchId !== 'ALL'
      ? selectedBranchId
      : (branches.length > 0 ? branches[0].id : '');
    form.reset({
      branch_id: defaultBranchId,
      product_id: '',
      variant_id: '',
      quantity_change: 1,
      type: 'ADD',
      reason: adjustmentReasons.length > 0 ? adjustmentReasons[0].code : 'MANUAL_COUNT'
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: AdjustFormValues) => {
    try {
      const payload: any = {
        branch_id: data.branch_id,
        quantity_change: data.quantity_change,
        type: data.type,
        reason: data.reason
      };

      if (data.variant_id) {
        payload.variant_id = data.variant_id;
      } else {
        payload.product_id = data.product_id;
      }

      await inventoryApi.adjust(payload);
      setIsModalOpen(false);
      toast.success(t('inventory.adjust_modal.success'));
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || t('inventory.adjust_modal.error'));
    }
  };

  // KPI Metrics
  const stats = useMemo(() => {
    let lowStockCount = 0;
    let totalValuation = 0;
    let inStockCount = 0;

    inventory.forEach((item) => {
      const qty = Number(item.quantity || 0);
      const reorder = Number(item.reorder_level || 0);
      const cost = Number(item.product?.cost_price || 0);

      if (qty <= reorder) {
        lowStockCount++;
      } else {
        inStockCount++;
      }
      totalValuation += (qty * cost) / 100;
    });

    return {
      total: totalItems || inventory.length,
      lowStock: lowStockCount,
      inStock: inStockCount,
      valuation: totalValuation,
    };
  }, [inventory, totalItems]);

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 border border-teal-500/20 shadow-2xs">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('inventory.overview.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('inventory.overview.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/inventory/transfers">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-teal-500/30"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('inventory.overview.btn_transfers')}</span>
            </Button>
          </Link>
          <Link href="/inventory/batches">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-amber-500/30"
            >
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('inventory.overview.btn_batches')}</span>
            </Button>
          </Link>
          <Link href="/inventory/suppliers">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-indigo-500/30"
            >
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('inventory.overview.btn_suppliers')}</span>
            </Button>
          </Link>
          <PermissionGuard permission="inventory:update">
            <Button
              onClick={handleOpenModal}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
            >
              <Edit2 className="w-4 h-4" />
              <span>{t('inventory.overview.btn_adjust')}</span>
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('inventory.overview.stat_total_items')}
              </p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {stats.total.toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 shadow-2xs">
              <Boxes className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('inventory.overview.stat_healthy_stock')}
              </p>
              <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.inStock.toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('inventory.overview.stat_low_stock')}
              </p>
              <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {stats.lowStock.toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {selectedBranchId === 'ALL' || !selectedBranchId ? t('inventory.overview.consolidated_valuation') : t('inventory.overview.branch_valuation')}
              </p>
              <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                ৳{stats.valuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
        {/* Toolbar */}
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
          <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {t('inventory.overview.showing_records', { count: inventory.length, total: totalItems || inventory.length })}
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 text-center text-slate-500">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                <span>{t('inventory.overview.loading')}</span>
              </div>
            </div>
          ) : inventory.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <Boxes className="w-5 h-5" />
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{t('inventory.overview.no_inventory')}</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  {t('inventory.overview.no_inventory_subtitle')}
                </p>
                <PermissionGuard permission="inventory:create">
                  <Button 
                    size="sm" 
                    onClick={handleOpenModal}
                    className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
                  >
                    {t('inventory.overview.btn_adjust')}
                  </Button>
                </PermissionGuard>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                  <tr>
                    <th className="px-6 py-4 font-semibold">{t('inventory.overview.col_product')}</th>
                    <th className="px-6 py-4 font-semibold">{t('inventory.overview.col_branch')}</th>
                    <th className="px-6 py-4 font-semibold">{t('inventory.overview.col_available')}</th>
                    <th className="px-6 py-4 font-semibold">{t('inventory.overview.col_cost')}</th>
                    <th className="px-6 py-4 text-right font-semibold">{t('inventory.overview.col_status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {inventory.map((item) => {
                    const isLowStock = Number(item.quantity) <= Number(item.reorder_level);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">
                            {item.variant ? `${item.product?.name} - ${item.variant.name}` : item.product?.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            SKU: {item.variant ? item.variant.sku : item.product?.sku}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                          {item.branch?.name || '-'}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {Number(item.quantity)} <span className="text-[11px] font-normal text-slate-400">{item.product?.base_uom?.symbol || ''}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                          {item.product?.cost_price ? `৳${(item.product.cost_price / 100).toFixed(2)}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20">
                              <AlertTriangle className="w-3 h-3" />
                              {t('inventory.overview.low_stock')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              {t('inventory.overview.in_stock')}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && inventory.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/80">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalItems / itemsPerPage) || 1}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={(size) => {
                  setItemsPerPage(size);
                  setCurrentPage(1);
                }}
                totalItems={totalItems}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjust Stock Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
                  <Boxes className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('inventory.adjust_modal.title')}</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('inventory.adjust_modal.branch_label')}</label>
                <select
                  {...form.register('branch_id')}
                  className={`w-full px-3.5 h-10 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.branch_id ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                >
                  <option value="">{t('inventory.adjust_modal.select_branch')}</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <FormError message={form.formState.errors.branch_id?.message} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('inventory.adjust_modal.product_label')}</label>
                <select
                  {...form.register('product_id')}
                  onChange={(e) => {
                    form.setValue('product_id', e.target.value, { shouldValidate: true });
                    form.setValue('variant_id', '', { shouldValidate: true });
                  }}
                  className={`w-full px-3.5 h-10 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.product_id ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                >
                  <option value="">{t('inventory.adjust_modal.select_product')}</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
                <FormError message={form.formState.errors.product_id?.message} />
              </div>

              {watchProductId && products.find(p => p.id === watchProductId)?.type === 'VARIABLE' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('inventory.adjust_modal.variant_label')}</label>
                  <select
                    {...form.register('variant_id')}
                    className={`w-full px-3.5 h-10 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.variant_id ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                  >
                    <option value="">{t('inventory.adjust_modal.select_variant')}</option>
                    {products.find(p => p.id === watchProductId)?.variants?.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.name} ({v.sku})</option>
                    ))}
                  </select>
                  <FormError message={form.formState.errors.variant_id?.message} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('inventory.adjust_modal.type_label')}</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => form.setValue('type', 'ADD', { shouldValidate: true })}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl font-bold text-xs transition-colors border ${
                        watchType === 'ADD' 
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-2xs' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" /> {t('inventory.adjust_modal.type_add')}
                    </button>
                    <button
                      type="button"
                      onClick={() => form.setValue('type', 'SUB', { shouldValidate: true })}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl font-bold text-xs transition-colors border ${
                        watchType === 'SUB' 
                          ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 shadow-2xs' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" /> {t('inventory.adjust_modal.type_deduct')}
                    </button>
                  </div>
                  <FormError message={form.formState.errors.type?.message} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('inventory.adjust_modal.qty_label')}</label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    {...form.register('quantity_change', { valueAsNumber: true })}
                    className={`h-10 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.quantity_change ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                  />
                  <FormError message={form.formState.errors.quantity_change?.message} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('inventory.adjust_modal.reason_label')}</label>
                <select
                  {...form.register('reason')}
                  className={`w-full px-3.5 h-10 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.reason ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                >
                  {adjustmentReasons.length > 0 ? (
                    adjustmentReasons.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.label} {r.label_bn ? `(${r.label_bn})` : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="MANUAL_COUNT">{t('inventory.adjust_modal.reason_manual')}</option>
                      <option value="DAMAGE">{t('inventory.adjust_modal.reason_damage')}</option>
                      <option value="THEFT">{t('inventory.adjust_modal.reason_theft')}</option>
                      <option value="SUPPLIER_DELIVERY">{t('inventory.adjust_modal.reason_supplier')}</option>
                      <option value="INTERNAL_USE">{t('inventory.adjust_modal.reason_internal')}</option>
                    </>
                  )}
                </select>
                <FormError message={form.formState.errors.reason?.message} />
              </div>
              
              <div className="flex justify-end gap-2.5 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
                >
                  {t('inventory.adjust_modal.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-5 shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('inventory.adjust_modal.confirm')}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
