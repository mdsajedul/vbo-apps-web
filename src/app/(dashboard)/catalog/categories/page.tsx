'use client';

import { useState, useEffect } from 'react';
import { categoriesApi } from '@/lib/api';
import { slugify } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FolderTree, Plus, Edit2, Trash2, ArrowLeft, 
  Package, ChevronRight, CornerDownRight, Check, X 
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

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required'),
  parent_id: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CategoriesPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const confirm = useConfirm();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      id: '',
      name: '',
      slug: '',
      parent_id: ''
    }
  });

  const fetchCategories = async () => {
    try {
      const data = await categoriesApi.getTree();
      setCategories(data);
    } catch (error) {
      console.error(error);
      toast.error(t('catalog.categories_page.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      const payload = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        parent_id: data.parent_id && data.parent_id.trim() !== '' ? data.parent_id : undefined,
      };

      if (data.id && data.id.trim() !== '') {
        await categoriesApi.update(data.id, payload);
        toast.success(t('catalog.categories_page.success_update'));
      } else {
        await categoriesApi.create(payload);
        toast.success(t('catalog.categories_page.success_create'));
      }
      setIsModalOpen(false);
      form.reset({ id: '', name: '', slug: '', parent_id: '' });
      fetchCategories();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || t('catalog.categories_page.load_error'));
    }
  };

  const flattenCategories = (cats: any[], depth = 0, flat: any[] = []) => {
    cats.forEach(c => {
      flat.push({ ...c, depth });
      if (c.children && c.children.length > 0) {
        flattenCategories(c.children, depth + 1, flat);
      }
    });
    return flat;
  };

  const flatList = flattenCategories(categories);

  const CategoryNode = ({ category, depth = 0 }: { category: any; depth?: number }) => (
    <div className="border-b last:border-0 border-slate-100 dark:border-slate-800/60">
      <div 
        className="flex items-center justify-between p-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors"
        style={{ paddingLeft: `${depth * 1.75 + 1}rem` }}
      >
        <div className="flex items-center gap-2.5">
          {depth > 0 ? (
            <CornerDownRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-500/20 shadow-2xs flex-shrink-0">
              <FolderTree className="w-3.5 h-3.5" />
            </div>
          )}
          <div>
            <div className="font-bold text-slate-900 dark:text-white text-xs">{category.name}</div>
            <div className="text-[11px] font-mono text-slate-400">/{category.slug}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <PermissionGuard permission="catalog:update">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                form.reset({ id: category.id, name: category.name, slug: category.slug, parent_id: category.parent_id || '' });
                setIsModalOpen(true);
              }}
              className="h-7 rounded-lg text-xs font-semibold px-2.5 border-slate-200 dark:border-slate-700 shadow-2xs gap-1"
            >
              <Edit2 className="w-3 h-3" />
              <span>{t('catalog.categories_page.edit_category')}</span>
            </Button>
          </PermissionGuard>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              form.reset({ id: '', name: '', slug: '', parent_id: category.id });
              setIsModalOpen(true);
            }}
            className="h-7 rounded-lg text-xs font-semibold px-2.5 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200/60 dark:border-violet-500/20 hover:bg-violet-100 shadow-2xs gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>{t('catalog.categories_page.add_sub')}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const ok = await confirm({
                title: t('catalog.categories_page.delete_title'),
                description: t('catalog.categories_page.delete_confirm', { name: category.name }),
                confirmText: t('catalog.categories_page.delete_btn'),
                variant: 'destructive',
              });
              if (ok) {
                try {
                  await categoriesApi.delete(category.id);
                  toast.success(t('catalog.categories_page.success_delete'));
                  fetchCategories();
                } catch (e: any) {
                  toast.error(e.response?.data?.message || t('catalog.categories_page.error_delete'));
                }
              }
            }}
            className="h-7 rounded-lg text-xs font-semibold px-2 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-slate-200 dark:border-slate-700 shadow-2xs"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      {category.children && category.children.map((child: any) => (
        <CategoryNode key={child.id} category={child} depth={depth + 1} />
      ))}
    </div>
  );

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
          <div className="w-11 h-11 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/20 shadow-2xs">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('catalog.categories_page.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('catalog.categories_page.subtitle')}
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
              <span>{t('catalog.categories_page.back_to_catalog')}</span>
            </Button>
          </Link>
          <PermissionGuard permission="catalog:create">
            <Button
              onClick={() => {
                form.reset({ id: '', name: '', slug: '', parent_id: '' });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t('catalog.categories_page.create_root_btn')}</span>
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Main Hierarchy Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('catalog.categories_page.title')}</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {t('catalog.categories_page.total_categories', { count: flatList.length })}
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
          ) : categories.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <FolderTree className="w-5 h-5" />
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{t('catalog.categories_page.empty_title')}</p>
                <p className="text-xs text-slate-400">{t('catalog.categories_page.empty_subtitle')}</p>
                <Button 
                  size="sm" 
                  onClick={() => {
                    form.reset({ id: '', name: '', slug: '', parent_id: '' });
                    setIsModalOpen(true);
                  }}
                  className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
                >
                  {t('catalog.categories_page.create_root_btn')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {categories.map((cat) => (
                <CategoryNode key={cat.id} category={cat} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-500/20">
                  <FolderTree className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {form.watch('id') ? t('catalog.categories_page.edit_category') : t('catalog.categories_page.create_category')}
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
                  {t('catalog.categories_page.category_name_label')}
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
                  placeholder={t('catalog.categories_page.category_name_placeholder')}
                  className={`h-10 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                />
                <FormError message={form.formState.errors.name?.message} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('catalog.categories_page.slug_label')}
                </label>
                <Input
                  {...form.register('slug')}
                  placeholder={t('catalog.categories_page.slug_placeholder')}
                  className={`h-10 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.slug ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                />
                <FormError message={form.formState.errors.slug?.message} />
              </div>

              {!form.watch('id') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('catalog.categories_page.parent_label')}
                  </label>
                  <select
                    {...form.register('parent_id')}
                    className={`w-full px-3.5 h-10 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.parent_id ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                  >
                    <option value="">{t('catalog.categories_page.parent_none')}</option>
                    {flatList.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {'\u00A0'.repeat(cat.depth * 4)}{cat.name}
                      </option>
                    ))}
                  </select>
                  <FormError message={form.formState.errors.parent_id?.message} />
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
                >
                  {t('catalog.categories_page.cancel')}
                </Button>
                <PermissionGuard permission="catalog:update">
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-5 shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('catalog.categories_page.save')}</span>
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
