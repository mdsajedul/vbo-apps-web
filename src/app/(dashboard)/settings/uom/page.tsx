'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { uomApi } from '@/lib/api';
import { Plus, Zap, Scale } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormError } from '@/components/ui/form-error';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useLanguage } from '@/i18n';

const uomSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  symbol: z.string().min(1, 'Symbol is required'),
  category: z.string().min(1, 'Category is required'),
});

type UOMFormValues = z.infer<typeof uomSchema>;

export default function UOMSettingsPage() {
  const { t } = useLanguage();
  const confirm = useConfirm();
  const [uoms, setUoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const form = useForm<UOMFormValues>({
    resolver: zodResolver(uomSchema),
    defaultValues: { name: '', symbol: '', category: 'COUNT' }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await uomApi.getAll();
      setUoms(res.data || res || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load UOMs');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: UOMFormValues) => {
    try {
      await uomApi.create(data);
      toast.success('UOM created successfully');
      setShowModal(false);
      fetchData();
    } catch (e) {
      toast.error('Failed to save UOM');
    }
  };

  const handleSeedDefaults = async () => {
    const ok = await confirm({
      title: 'Seed Standard Units of Measure',
      description: 'This will populate the catalog with standard global Units of Measure (kg, g, liters, meters, pcs). Continue?',
      confirmText: 'Seed Standards',
      variant: 'info',
    });
    if (!ok) return;
    setIsSeeding(true);
    try {
      const res = await uomApi.seedDefaults();
      toast.success(res.message || 'Default UOMs seeded successfully');
      fetchData();
    } catch (e) {
      toast.error('Failed to seed default UOMs');
    } finally {
      setIsSeeding(false);
    }
  };

  const openNew = () => {
    form.reset({ name: '', symbol: '', category: 'COUNT' });
    setShowModal(true);
  };

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 border border-teal-500/20 shadow-2xs">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('settings.uom.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('settings.uom.subtitle')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleSeedDefaults} 
            disabled={isSeeding} 
            className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-4 py-2 shadow-2xs hover:border-amber-500/30"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            {isSeeding ? t('settings.uom.seeding') : t('settings.uom.btn_seed_defaults')}
          </Button>
          <PermissionGuard permission="settings:create">
            <Button 
              onClick={openNew} 
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" /> {t('settings.uom.btn_add_uom')}
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Table Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                <tr>
                  <th className="px-6 py-4 font-semibold">{t('settings.uom.col_name')}</th>
                  <th className="px-6 py-4 font-semibold">{t('settings.uom.col_symbol')}</th>
                  <th className="px-6 py-4 font-semibold">{t('settings.uom.col_category')}</th>
                  <th className="px-6 py-4 font-semibold">{t('settings.uom.col_type')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        <span>{t('settings.uom.loading')}</span>
                      </div>
                    </td>
                  </tr>
                ) : uoms.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-slate-500">
                      {t('settings.uom.no_uoms')}
                    </td>
                  </tr>
                ) : (
                  uoms.map((uom: any) => (
                    <tr key={uom.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {uom.name}
                      </td>

                      {/* Symbol */}
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md font-mono text-xs font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                          {uom.symbol}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                          {uom.category}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        {uom.is_base ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {t('settings.uom.base_unit')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
                            {t('settings.uom.derived_unit')}
                          </span>
                        )}
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
          ADD CUSTOM UOM MODAL
      ──────────────────────────────────────────────────────────────────────── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          {/* Header */}
          <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 border border-teal-500/20">
                  <Scale className="w-3.5 h-3.5" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('settings.uom.modal_title')}
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('settings.uom.modal_subtitle')}
              </p>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('settings.uom.name_label')}
                </Label>
                <Input 
                  id="name"
                  {...form.register('name')} 
                  placeholder={t('settings.uom.name_placeholder')} 
                  className="rounded-xl border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500" 
                />
                {form.formState.errors.name && <FormError message={form.formState.errors.name.message} />}
              </div>

              {/* Symbol */}
              <div className="space-y-1.5">
                <Label htmlFor="symbol" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('settings.uom.symbol_label')}
                </Label>
                <Input 
                  id="symbol"
                  {...form.register('symbol')} 
                  placeholder={t('settings.uom.symbol_placeholder')} 
                  className="rounded-xl border-slate-200 dark:border-slate-800 font-mono text-xs focus:ring-2 focus:ring-indigo-500" 
                />
                {form.formState.errors.symbol && <FormError message={form.formState.errors.symbol.message} />}
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('settings.uom.category_label')}
                </Label>
                <select 
                  id="category"
                  {...form.register('category')} 
                  className="w-full px-3 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="COUNT">{t('settings.uom.category_count')}</option>
                  <option value="WEIGHT">{t('settings.uom.category_weight')}</option>
                  <option value="VOLUME">{t('settings.uom.category_volume')}</option>
                  <option value="LENGTH">{t('settings.uom.category_length')}</option>
                </select>
                {form.formState.errors.category && <FormError message={form.formState.errors.category.message} />}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowModal(false)}
                className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
              >
                {t('settings.uom.btn_cancel')}
              </Button>
              <PermissionGuard permission="settings:update">
                <Button 
                  type="submit" 
                  className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs"
                >
                  {t('settings.uom.btn_save')}
                </Button>
              </PermissionGuard>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
