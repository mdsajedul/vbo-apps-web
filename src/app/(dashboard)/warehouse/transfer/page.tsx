'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { warehouseApi, branchesApi, productsApi } from '@/lib/api';
import { ArrowLeft, ArrowRightLeft, Building2, Box, Package, Check } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormError } from '@/components/ui/form-error';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';

const transferSchema = z.object({
  branch_id: z.string().min(1, 'Branch is required'),
  from_bin_id: z.string().min(1, 'Source Bin is required'),
  to_bin_id: z.string().min(1, 'Destination Bin is required'),
  product_id: z.string().min(1, 'Product is required'),
  quantity: z.string().min(1, 'Quantity is required'),
});

type TransferFormValues = z.infer<typeof transferSchema>;

export default function BinTransferPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [bins, setBins] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      branch_id: '',
      from_bin_id: '',
      to_bin_id: '',
      product_id: '',
      quantity: '',
    }
  });

  const watchBranchId = form.watch('branch_id');

  useEffect(() => {
    branchesApi.getAll().then(res => {
      const data = res.data || res || [];
      setBranches(data);
      if (data.length > 0) {
        form.setValue('branch_id', data[0].id);
      }
    }).catch(console.error);

    productsApi.getAll().then(res => {
      setProducts(res.data || res || []);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!watchBranchId) {
      setBins([]);
      return;
    }
    warehouseApi.getBins({ branch_id: watchBranchId }).then(res => {
      setBins(res || []);
    }).catch(console.error);
  }, [watchBranchId]);

  const onSubmit = async (data: TransferFormValues) => {
    if (data.from_bin_id === data.to_bin_id) {
      toast.error('Source and destination bins cannot be identical.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...data,
        quantity: parseFloat(data.quantity)
      };
      await warehouseApi.transferStock(payload);
      toast.success(t('warehouse.transfer_success'));
      router.push('/warehouse');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || t('warehouse.transfer_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16 w-full">
      {/* Header */}
      <div className="flex items-center gap-4 pt-1">
        <Link href="/warehouse">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs">
            <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 border border-teal-500/20 shadow-2xs">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('warehouse.transfer_title')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('warehouse.transfer_subtitle')}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('warehouse.transfer_details')}</h3>
          </div>

          <CardContent className="p-6 space-y-5">
            {/* Branch */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('warehouse.branch')} <span className="text-rose-500">*</span>
              </label>
              <select 
                {...form.register('branch_id')} 
                className={`w-full px-3.5 h-10 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.branch_id ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
              >
                <option value="">{t('warehouse.select_branch')}</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <FormError message={form.formState.errors.branch_id?.message} />
            </div>

            {/* Source & Destination Bins */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('warehouse.source_bin')} <span className="text-rose-500">*</span>
                </label>
                <select 
                  {...form.register('from_bin_id')} 
                  className={`w-full px-3.5 h-10 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.from_bin_id ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                >
                  <option value="">{t('warehouse.select_source_bin')}</option>
                  {bins.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.zone?.name || 'Zone'})</option>
                  ))}
                </select>
                <FormError message={form.formState.errors.from_bin_id?.message} />
              </div>

              <div className="hidden sm:flex justify-center pb-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('warehouse.destination_bin')} <span className="text-rose-500">*</span>
                </label>
                <select 
                  {...form.register('to_bin_id')} 
                  className={`w-full px-3.5 h-10 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.to_bin_id ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                >
                  <option value="">{t('warehouse.select_destination_bin')}</option>
                  {bins.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.zone?.name || 'Zone'})</option>
                  ))}
                </select>
                <FormError message={form.formState.errors.to_bin_id?.message} />
              </div>
            </div>

            {/* Product & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('warehouse.product')} <span className="text-rose-500">*</span>
                </label>
                <select 
                  {...form.register('product_id')} 
                  className={`w-full px-3.5 h-10 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.product_id ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                >
                  <option value="">{t('warehouse.select_product')}</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <FormError message={form.formState.errors.product_id?.message} />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('warehouse.quantity')} <span className="text-rose-500">*</span>
                </label>
                <Input 
                  type="number" 
                  min="1" 
                  step="0.0001" 
                  placeholder={t('warehouse.quantity_placeholder')} 
                  {...form.register('quantity')} 
                  className={`h-10 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.quantity ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`} 
                />
                <FormError message={form.formState.errors.quantity?.message} />
              </div>
            </div>

            {bins.length < 2 && watchBranchId && (
              <p className="text-rose-500 text-xs font-medium mt-2">
                {t('warehouse.no_bins_available')}
              </p>
            )}
          </CardContent>

          <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/warehouse')}
              className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading || bins.length < 2}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-6 shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{loading ? t('warehouse.executing') : t('warehouse.execute_transfer')}</span>
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
