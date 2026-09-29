'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { 
  Percent, Plus, Trash2, Edit2, Receipt, 
  Tag, Check, AlertCircle 
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormError } from '@/components/ui/form-error';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useLanguage } from '@/i18n';

// Custom fetcher for tax API
const taxApi = {
  getRates: () => api.get('/tax-rates'),
  createRate: (data: any) => api.post('/tax-rates', data),
  updateRate: (id: string, data: any) => api.patch(`/tax-rates/${id}`, data),
  deleteRate: (id: string) => api.delete(`/tax-rates/${id}`),
};

const orgApi = {
  getOrgSettings: () => api.get('/organizations/current'),
  updateOrgSettings: (data: any) => api.patch('/organizations/current', data),
};

const taxSchema = z.object({
  name: z.string().min(1, 'Tax name is required'),
  percentage: z.number().min(0, 'Percentage cannot be negative').max(100, 'Cannot exceed 100%'),
  is_active: z.boolean(),
  is_default: z.boolean(),
});

type TaxFormValues = z.infer<typeof taxSchema>;

export default function TaxSettingsPage() {
  const { t } = useLanguage();
  const confirm = useConfirm();
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRate, setEditingRate] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Organization settings
  const [orgId, setOrgId] = useState<string | null>(null);
  const [isInclusive, setIsInclusive] = useState(true);

  const form = useForm<TaxFormValues>({
    resolver: zodResolver(taxSchema),
    defaultValues: { name: '', percentage: 15, is_active: true, is_default: false }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ratesRes, orgRes] = await Promise.all([
        taxApi.getRates(),
        orgApi.getOrgSettings().catch(() => ({ data: { is_tax_inclusive: true } }))
      ]);
      setRates(ratesRes.data || ratesRes || []);
      
      const org = orgRes.data || orgRes;
      if (org?.id) {
        setOrgId(org.id);
      }
      if (org?.is_tax_inclusive !== undefined) {
        setIsInclusive(org.is_tax_inclusive);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tax settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleInclusive = async (checked: boolean) => {
    setIsInclusive(checked);
    try {
      await orgApi.updateOrgSettings({ is_tax_inclusive: checked });
      toast.success(`Pricing model updated to Tax ${checked ? 'Inclusive' : 'Exclusive'}`);
    } catch (e) {
      setIsInclusive(!checked);
      toast.error('Failed to update pricing model');
    }
  };

  const onSubmit = async (data: TaxFormValues) => {
    setIsSaving(true);
    try {
      if (editingRate) {
        await taxApi.updateRate(editingRate.id, data);
        toast.success('Tax rate updated successfully');
      } else {
        await taxApi.createRate({
          ...data,
          organization_id: orgId || undefined,
        });
        toast.success('Tax rate created successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (e) {
      toast.error('Failed to save tax rate');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Delete Tax Rate',
      description: `Are you sure you want to delete tax rate "${name}"? Active catalog items mapped to this tax rate may be affected.`,
      confirmText: 'Delete Tax Rate',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await taxApi.deleteRate(id);
      toast.success('Tax rate deleted');
      fetchData();
    } catch (e) {
      toast.error('Cannot delete tax rate. It may be linked to active products.');
    }
  };

  const openEdit = (rate: any) => {
    setEditingRate(rate);
    form.reset({
      name: rate.name,
      percentage: Number(rate.percentage),
      is_active: rate.is_active,
      is_default: rate.is_default
    });
    setShowModal(true);
  };

  const openNew = () => {
    setEditingRate(null);
    form.reset({ name: '', percentage: 15, is_active: true, is_default: false });
    setShowModal(true);
  };

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/20 shadow-2xs">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('settings.tax.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('settings.tax.subtitle')}
            </p>
          </div>
        </div>

        <PermissionGuard permission="tax_rates:create">
          <Button 
            onClick={openNew} 
            className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 self-start sm:self-auto px-4 py-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('settings.tax.btn_add_tax')}</span>
          </Button>
        </PermissionGuard>
      </div>

      {/* Pricing Model Card */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/50 dark:border-blue-500/20">
                  <Receipt className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('settings.tax.pricing_model_title', { model: isInclusive ? t('settings.tax.btn_tax_inclusive') : t('settings.tax.btn_tax_exclusive') })}
                </h3>
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  isInclusive 
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20' 
                    : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isInclusive ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                  {isInclusive ? t('settings.tax.mushak_standard') : t('settings.tax.b2b_wholesale')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {isInclusive 
                  ? t('settings.tax.inclusive_desc')
                  : t('settings.tax.exclusive_desc')
                }
              </p>
            </div>

            {/* Segmented Switch */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 self-start md:self-auto flex-shrink-0">
              <button
                type="button"
                onClick={() => handleToggleInclusive(false)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  !isInclusive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t('settings.tax.btn_tax_exclusive')}
              </button>
              <button
                type="button"
                onClick={() => handleToggleInclusive(true)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isInclusive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t('settings.tax.btn_tax_inclusive')}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Rates Table Card */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('settings.tax.table_title')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('settings.tax.table_subtitle')}
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
            {rates.length} {rates.length === 1 ? t('settings.tax.rate_singular') : t('settings.tax.rates_plural')}
          </span>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">{t('settings.tax.col_tax_name')}</th>
                  <th className="px-6 py-4 text-right">{t('settings.tax.col_percentage')}</th>
                  <th className="px-6 py-4 text-center">{t('settings.tax.col_status')}</th>
                  <th className="px-6 py-4 text-right">{t('settings.tax.col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900 dark:border-white"></div>
                        <span>{t('settings.tax.loading')}</span>
                      </div>
                    </td>
                  </tr>
                ) : rates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-slate-500">
                      {t('settings.tax.no_tax_rates')}
                    </td>
                  </tr>
                ) : (
                  rates.map(rate => (
                    <tr key={rate.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {rate.name}
                          </span>
                          {rate.is_default && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {t('settings.tax.default_badge')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Percentage */}
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {Number(rate.percentage).toFixed(2)}%
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        {rate.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {t('settings.tax.active')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {t('settings.tax.inactive')}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <PermissionGuard permission="tax_rates:update">
                            <button 
                              onClick={() => openEdit(rate)} 
                              title="Edit tax rate"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </PermissionGuard>
                          <PermissionGuard permission="tax_rates:delete">
                            <button 
                              onClick={() => handleDelete(rate.id, rate.name)} 
                              title="Delete tax rate"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ────────────────────────────────────────────────────────────────────────
          CREATE / EDIT TAX RATE MODAL
      ──────────────────────────────────────────────────────────────────────── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          {/* Header */}
          <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/20">
                  <Percent className="w-3.5 h-3.5" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {editingRate ? t('settings.tax.modal_title_edit') : t('settings.tax.modal_title_add')}
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('settings.tax.modal_subtitle')}
              </p>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('settings.tax.name_label')} <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="name"
                    {...form.register('name')} 
                    placeholder={t('settings.tax.name_placeholder')} 
                    className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>
                <FormError message={form.formState.errors.name?.message} />
              </div>
              
              {/* Percentage */}
              <div className="space-y-1.5">
                <Label htmlFor="percentage" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('settings.tax.percentage_label')} <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="percentage"
                    type="number" 
                    step="0.01" 
                    {...form.register('percentage', { valueAsNumber: true })} 
                    placeholder={t('settings.tax.percentage_placeholder')} 
                    className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 font-mono text-xs"
                  />
                </div>
                <FormError message={form.formState.errors.percentage?.message} />
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                {/* Active Status */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50/60 dark:bg-slate-800/30 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {t('settings.tax.status_toggle_title')}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {t('settings.tax.status_toggle_hint')}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-3">
                    <input
                      type="checkbox"
                      checked={form.watch('is_active')}
                      onChange={(e) => form.setValue('is_active', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 dark:peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Default Rate */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50/60 dark:bg-slate-800/30 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {t('settings.tax.default_toggle_title')}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {t('settings.tax.default_toggle_hint')}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-3">
                    <input
                      type="checkbox"
                      checked={form.watch('is_default')}
                      onChange={(e) => form.setValue('is_default', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-2.5">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowModal(false)}
                className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
              >
                {t('settings.tax.btn_cancel')}
              </Button>
              <PermissionGuard permission={editingRate ? "tax_rates:update" : "tax_rates:create"}>
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isSaving ? t('settings.tax.saving') : editingRate ? t('settings.tax.btn_save_changes') : t('settings.tax.btn_create')}
                </Button>
              </PermissionGuard>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
