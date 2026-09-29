'use client';

import { useState, useEffect } from 'react';
import { brandsApi } from '@/lib/api';
import { slugify } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Tag, Plus, Edit2, Trash2, ArrowLeft, 
  Package, Check, X 
} from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormError } from '@/components/ui/form-error';
import { toast } from 'sonner';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useTranslation } from '@/i18n';

const brandSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Brand name is required'),
  slug: z.string().min(1, 'Slug is required'),
});

type BrandFormValues = z.infer<typeof brandSchema>;

export default function BrandsPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      id: '',
      name: '',
      slug: ''
    }
  });

  const fetchBrands = async () => {
    try {
      const data = await brandsApi.getAll();
      setBrands(data || []);
    } catch (error) {
      console.error(error);
      toast.error(t('catalog.brands_page.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const onSubmit = async (data: BrandFormValues) => {
    try {
      if (data.id) {
        await brandsApi.update(data.id, { name: data.name, slug: data.slug });
        toast.success(t('catalog.brands_page.success_update'));
      } else {
        await brandsApi.create({
          name: data.name,
          slug: data.slug,
        });
        toast.success(t('catalog.brands_page.success_create'));
      }
      setIsModalOpen(false);
      fetchBrands();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || t('catalog.brands_page.load_error'));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <Link href="/catalog/products">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs">
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </Button>
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20 shadow-2xs">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('catalog.brands_page.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('catalog.brands_page.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/catalog/products">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold px-3.5 py-2 shadow-2xs"
            >
              <Package className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('catalog.brands_page.back_to_catalog')}</span>
            </Button>
          </Link>
          <PermissionGuard permission="catalog:create">
            <Button
              onClick={() => {
                form.reset({ id: '', name: '', slug: '' });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t('catalog.brands_page.create_brand')}</span>
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Main Brands Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('catalog.brands_page.title')}</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {t('catalog.brands_page.total_brands', { count: brands.length })}
          </span>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 text-center text-slate-500">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                <span>{t('catalog.loading')}</span>
              </div>
            </div>
          ) : brands.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{t('catalog.brands_page.empty_title')}</p>
                <p className="text-xs text-slate-400">{t('catalog.brands_page.empty_subtitle')}</p>
                <Button 
                  size="sm" 
                  onClick={() => {
                    form.reset({ id: '', name: '', slug: '' });
                    setIsModalOpen(true);
                  }}
                  className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
                >
                  {t('catalog.brands_page.create_brand')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {brands.map((brand) => (
                <div key={brand.id} className="flex items-center justify-between p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 font-bold text-xs">
                      {brand.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">{brand.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">/{brand.slug}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <PermissionGuard permission="catalog:update">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          form.reset({ id: brand.id, name: brand.name, slug: brand.slug });
                          setIsModalOpen(true);
                        }}
                        className="h-8 rounded-xl text-xs font-semibold px-3 border-slate-200 dark:border-slate-700 shadow-2xs gap-1.5 hover:border-indigo-300 hover:text-indigo-600"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{t('common.edit')}</span>
                      </Button>
                    </PermissionGuard>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const ok = await confirm({
                          title: t('catalog.brands_page.delete_title'),
                          description: t('catalog.brands_page.delete_confirm', { name: brand.name }),
                          confirmText: t('catalog.brands_page.delete_btn'),
                          variant: 'destructive',
                        });
                        if (ok) {
                          try {
                            await brandsApi.delete(brand.id);
                            toast.success(t('catalog.brands_page.success_delete'));
                            fetchBrands();
                          } catch (e: any) {
                            toast.error(e.response?.data?.message || t('catalog.brands_page.error_delete'));
                          }
                        }
                      }}
                      className="h-8 rounded-xl text-xs font-semibold px-2.5 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-slate-200 dark:border-slate-700 shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brand Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {form.watch('id') ? t('catalog.brands_page.edit_brand') : t('catalog.brands_page.create_brand')}
                </h3>
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
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('catalog.brands_page.brand_name_label')}
                </label>
                <Input
                  {...form.register('name')}
                  onChange={e => {
                    const newName = e.target.value;
                    form.setValue('name', newName, { shouldValidate: true });
                    if (!form.watch('id')) {
                      form.setValue('slug', slugify(newName), { shouldValidate: true });
                    }
                  }}
                  placeholder={t('catalog.brands_page.brand_name_placeholder')}
                  className={`h-10 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                />
                <FormError message={form.formState.errors.name?.message} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('catalog.brands_page.slug_label')}
                </label>
                <Input
                  {...form.register('slug')}
                  placeholder={t('catalog.brands_page.slug_placeholder')}
                  className={`h-10 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.slug ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                />
                <FormError message={form.formState.errors.slug?.message} />
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
                >
                  {t('catalog.brands_page.cancel')}
                </Button>
                <PermissionGuard permission="catalog:update">
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-5 shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('catalog.brands_page.save')}</span>
                  </Button>
                </PermissionGuard>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
