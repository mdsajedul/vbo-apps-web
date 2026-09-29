'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { productsApi, categoriesApi, uploadApi, brandsApi, branchesApi, api } from '@/lib/api';
import { restaurantApi } from '@/lib/restaurant-api';
import { 
  UploadCloud, Plus, Trash2, ArrowLeft, UtensilsCrossed, 
  ShoppingBag, ChefHat, Tag, ShieldCheck, Database, 
  Package, Layers, Check, Info 
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormError } from '@/components/ui/form-error';
import { toast } from 'sonner';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useTranslation } from '@/i18n';

const variantSchema = z.object({
  name: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  selling_price: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().min(1, 'Product Name is required'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  category_id: z.string().optional(),
  brand_id: z.string().optional(),
  tax_rate_id: z.string().optional(),
  selling_price: z.string().optional(),
  cost_price: z.string().optional(),
  type: z.enum(['SIMPLE', 'VARIABLE']),
  is_pos_visible: z.boolean(),
  kitchen_station: z.string().optional(),
  prep_time_mins: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'DISCONTINUED']),
  base_uom_id: z.string().optional(),
  variants: z.array(variantSchema).optional(),
  weight: z.string().optional(),
  reorder_point: z.string().optional(),
  item_type: z.enum(['STANDARD', 'SERVICE', 'CONSUMABLE']),
  can_be_sold: z.boolean(),
  can_be_purchased: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [creationMode, setCreationMode] = useState<'RETAIL' | 'RESTAURANT'>('RESTAURANT');
  const [autoDetectedVertical, setAutoDetectedVertical] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [kitchenStations, setKitchenStations] = useState<any[]>([]);
  const [uoms, setUoms] = useState<any[]>([]);
  const [selectedDietaryBadges, setSelectedDietaryBadges] = useState<string[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      category_id: '',
      brand_id: '',
      tax_rate_id: '',
      selling_price: '',
      cost_price: '',
      type: 'SIMPLE',
      is_pos_visible: true,
      status: 'ACTIVE',
      base_uom_id: '',
      kitchen_station: '',
      prep_time_mins: '15',
      variants: [],
      weight: '',
      reorder_point: '',
      item_type: 'STANDARD',
      can_be_sold: true,
      can_be_purchased: creationMode === 'RESTAURANT' ? false : true,
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants'
  });

  const watchType = form.watch('type');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch common data first
        const [tree, brandsData, taxData, branchData, uomData] = await Promise.all([
          categoriesApi.getTree(),
          brandsApi.getAll(),
          api.get('/tax-rates'),
          branchesApi.getAll(),
          api.get('/uom').catch(() => ({ data: [] }))
        ]);

        // Auto-detect Branch Industry Type strictly via Database schema field
        const activeBranches = branchData.data || branchData || [];
        const activeBranch = activeBranches[0];
        const isRest = activeBranch?.industry_type === 'RESTAURANT';
        
        let stationsData: any[] = [];

        if (isRest) {
          setCreationMode('RESTAURANT');
          setAutoDetectedVertical(true);
          // Only fetch kitchen stations if in restaurant mode to avoid unauthorized 403 toasts
          stationsData = await restaurantApi.getKitchenStations().catch(() => []);
        } else {
          setCreationMode('RETAIL');
          setAutoDetectedVertical(true);
        }
        
        const flat: any[] = [];
        const flatten = (cats: any[], depth = 0) => {
          cats.forEach(c => {
            flat.push({ ...c, depth });
            if (c.children) flatten(c.children, depth + 1);
          });
        };
        flatten(tree);
        setCategories(flat);
        setBrands(brandsData || []);
        setTaxRates(taxData.data || []);
        setKitchenStations(stationsData || []);
        setUoms(uomData.data || uomData || []);

      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    setLoading(true);

    try {
      let image_url = '';
      if (imageFile) {
        const uploadRes = await uploadApi.uploadImage(imageFile);
        image_url = uploadRes.url;
      }

      // Auto-generate main SKU for restaurant dishes
      const prefix = creationMode === 'RESTAURANT' ? 'DISH' : 'SKU';
      const baseSku = data.sku?.trim() || `${prefix}-${Date.now().toString().slice(-6)}`;

      // Derive selling price for variable product if empty
      let baseSellingPrice = data.selling_price ? parseFloat(data.selling_price) : 0;
      if (data.type === 'VARIABLE' && data.variants && data.variants.length > 0) {
        if (!baseSellingPrice && data.variants[0].selling_price) {
          baseSellingPrice = parseFloat(data.variants[0].selling_price);
        }
      }

      const payload = {
        type: data.type,
        name: data.name,
        sku: baseSku,
        barcode: creationMode === 'RESTAURANT' ? undefined : (data.barcode || undefined),
        category_id: data.category_id || undefined,
        brand_id: creationMode === 'RESTAURANT' ? undefined : (data.brand_id || undefined),
        tax_rate_id: data.tax_rate_id || undefined,
        selling_price: Math.round(baseSellingPrice * 100), // convert to paisa
        cost_price: data.cost_price ? Math.round(parseFloat(data.cost_price) * 100) : undefined,
        image_url: image_url || undefined,
        status: data.status,
        base_uom_id: data.base_uom_id || undefined,
        is_pos_visible: data.is_pos_visible,
        item_type: data.item_type,
        can_be_sold: data.can_be_sold,
        can_be_purchased: data.can_be_purchased,
        is_restaurant_item: creationMode === 'RESTAURANT',
        kitchen_station: creationMode === 'RESTAURANT' ? (data.kitchen_station || undefined) : undefined,
        prep_time_mins: creationMode === 'RESTAURANT' && data.prep_time_mins ? parseInt(data.prep_time_mins, 10) : undefined,
        weight: creationMode === 'RETAIL' && data.weight ? parseFloat(data.weight) : undefined,
        reorder_point: creationMode === 'RETAIL' && data.reorder_point ? parseInt(data.reorder_point, 10) : undefined,
        variants: data.type === 'VARIABLE' && data.variants ? data.variants.map((v, idx) => ({
          name: v.name,
          sku: v.sku?.trim() || `${baseSku}-V${idx + 1}`,
          selling_price: Math.round(parseFloat(v.selling_price || '0') * 100),
          barcode: creationMode === 'RESTAURANT' ? undefined : (v.barcode || undefined),
        })) : undefined
      };

      await productsApi.create(payload);
      toast.success(creationMode === 'RESTAURANT' ? t('catalog.new_product_page.success_create_restaurant') : t('catalog.new_product_page.success_create_retail'));
      router.push('/catalog/products');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || t('catalog.new_product_page.error_create'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl pb-16 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <Link href="/catalog/products">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs">
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </Button>
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/20 shadow-2xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                {creationMode === 'RESTAURANT' ? t('catalog.new_product_page.title_restaurant') : t('catalog.new_product_page.title_retail')}
              </h2>
              {autoDetectedVertical && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  {creationMode === 'RESTAURANT' ? t('catalog.new_product_page.mode_restaurant') : t('catalog.new_product_page.mode_retail')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {creationMode === 'RESTAURANT'
                ? t('catalog.new_product_page.subtitle_restaurant')
                : t('catalog.new_product_page.subtitle_retail')}
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(
          async (data) => {
            await onSubmit(data);
          },
          (errors) => {
            console.error('Form Validation Errors:', errors);
            const firstKey = Object.keys(errors)[0];
            const errObj = errors[firstKey as keyof typeof errors] as any;
            let message = 'Please check the form for missing values';

            if (typeof errObj?.message === 'string') {
              message = errObj.message;
            } else if (Array.isArray(errObj) && errObj[0]) {
              const subObj = errObj[0];
              const subKey = Object.keys(subObj)[0];
              message = subObj[subKey]?.message || `Error in ${firstKey} #${1}`;
            }

            toast.error(`Validation Warning: ${message}`);
          }
        )}
        className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start"
      >
        <div className="xl:col-span-2 space-y-6">
        {/* Basic Information Section */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('catalog.new_product_page.section_basic')}</h3>
          </div>

          <CardContent className="p-6">
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" {...form.register('can_be_sold')} className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('catalog.new_product_page.can_be_sold_label')}</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" {...form.register('can_be_purchased')} className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('catalog.new_product_page.can_be_purchased_label')}</span>
                  </label>
                </div>
                <div className="w-full sm:w-64">
                  <select {...form.register('item_type')} className="w-full px-3 h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="STANDARD">{t('catalog.new_product_page.nature_standard')}</option>
                    <option value="CONSUMABLE">{t('catalog.new_product_page.nature_consumable')}</option>
                    <option value="SERVICE">{t('catalog.new_product_page.nature_service')}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {creationMode === 'RESTAURANT' ? t('catalog.new_product_page.dish_name_label') : t('catalog.new_product_page.name_label')}
                  </label>
                  <Input 
                    placeholder={creationMode === 'RESTAURANT' ? t('catalog.new_product_page.dish_name_placeholder') : t('catalog.new_product_page.name_placeholder')} 
                    {...form.register('name')} 
                    className={`h-10 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`} 
                  />
                  <FormError message={form.formState.errors.name?.message} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {creationMode === 'RESTAURANT' ? t('catalog.new_product_page.menu_category_label') : t('catalog.new_product_page.category_label')}
                  </label>
                  <select 
                    {...form.register('category_id')} 
                    className={`w-full px-3.5 h-10 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.category_id ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                  >
                    <option value="">{t('catalog.new_product_page.uncategorized')}</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{'\u00A0'.repeat(c.depth * 4)}{c.name}</option>
                    ))}
                  </select>
                  <FormError message={form.formState.errors.category_id?.message} />
                </div>

                {creationMode === 'RETAIL' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('catalog.new_product_page.brand_label')}</label>
                    <select 
                      {...form.register('brand_id')} 
                      className={`w-full px-3.5 h-10 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.brand_id ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                    >
                      <option value="">{t('catalog.new_product_page.no_brand')}</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                    <FormError message={form.formState.errors.brand_id?.message} />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('catalog.new_product_page.tax_rate_label')}</label>
                    <select 
                      {...form.register('tax_rate_id')} 
                      className={`w-full px-3.5 h-10 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.tax_rate_id ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                    >
                      <option value="">{t('catalog.new_product_page.default_vat')}</option>
                      {taxRates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.percentage}%)</option>
                      ))}
                    </select>
                    <FormError message={form.formState.errors.tax_rate_id?.message} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('catalog.new_product_page.uom_label')}</label>
                    <select 
                      {...form.register('base_uom_id')} 
                      className={`w-full px-3.5 h-10 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.base_uom_id ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                    >
                      <option value="">{t('catalog.new_product_page.uom_select')}</option>
                      {uoms.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                      ))}
                    </select>
                    <FormError message={form.formState.errors.base_uom_id?.message} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('catalog.new_product_page.status_label')}</label>
                  <select 
                    {...form.register('status')} 
                    className="w-full px-3.5 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ACTIVE">{t('catalog.new_product_page.status_active')}</option>
                    <option value="DRAFT">{t('catalog.new_product_page.status_draft')}</option>
                    <option value="DISCONTINUED">{t('catalog.new_product_page.status_discontinued')}</option>
                  </select>
                </div>
              </div>

              {/* Image Upload Box */}
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  {t('catalog.new_product_page.image_label')}
                </label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center hover:border-indigo-500 transition-colors flex flex-col items-center justify-center min-h-[220px] bg-slate-50/40 dark:bg-slate-800/20">
                  {imagePreview ? (
                    <div className="relative group w-full flex justify-center">
                      <img src={imagePreview} alt="Preview" className="h-36 object-contain rounded-xl shadow-sm" />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute top-0 right-1/4 bg-rose-600 text-white p-1 rounded-full shadow hover:bg-rose-700 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2 border border-indigo-500/20 shadow-2xs">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <label className="cursor-pointer text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                        {t('catalog.new_product_page.upload_photo')}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>
                      <p className="text-[11px] text-slate-400 mt-1">{t('catalog.new_product_page.upload_photo_desc')}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <input
                    type="checkbox"
                    id="is_pos_visible"
                    {...form.register('is_pos_visible')}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="is_pos_visible" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    {t('catalog.new_product_page.pos_visible_label')}
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & SKU Specifications */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('catalog.new_product_page.section_pricing')}</h3>
          </div>

          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{t('catalog.new_product_page.product_type_label')}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('catalog.new_product_page.product_type_subtitle')}</p>
              </div>
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
                <button
                  type="button"
                  onClick={() => form.setValue('type', 'SIMPLE')}
                  className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                    watchType === 'SIMPLE' 
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t('catalog.new_product_page.type_simple')}
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue('type', 'VARIABLE')}
                  className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                    watchType === 'VARIABLE' 
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t('catalog.new_product_page.type_variable')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {creationMode === 'RESTAURANT' ? t('catalog.new_product_page.restaurant_sku_label') : t('catalog.new_product_page.sku_label')}
                </label>
                <Input 
                  placeholder={creationMode === 'RESTAURANT' ? t('catalog.new_product_page.restaurant_sku_placeholder') : t('catalog.new_product_page.sku_placeholder')} 
                  {...form.register('sku')} 
                  className="h-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
            </div>

            {watchType === 'SIMPLE' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50/60 dark:bg-slate-800/30 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('catalog.new_product_page.selling_price_label')}
                  </label>
                  <Input 
                    type="number" step="0.01" placeholder="0.00" 
                    {...form.register('selling_price')} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('catalog.new_product_page.cost_price_label')}
                  </label>
                  <Input 
                    type="number" step="0.01" placeholder="0.00" 
                    {...form.register('cost_price')} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>

                {creationMode === 'RETAIL' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {t('catalog.new_product_page.barcode_label')}
                    </label>
                    <Input 
                      placeholder={t('catalog.new_product_page.barcode_placeholder')} 
                      {...form.register('barcode')} 
                      className="h-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500" 
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('catalog.new_product_page.section_variants')}
                  </h4>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => append({ name: '', sku: '', barcode: '', selling_price: '' })}
                    className="rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600 gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> {t('catalog.new_product_page.add_variant_btn')}
                  </Button>
                </div>

                {fields.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                    {t('catalog.new_product_page.no_variants_hint')}
                  </p>
                )}

                <div className="space-y-3">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="p-3 bg-slate-50/60 dark:bg-slate-800/30 rounded-xl border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">{t('catalog.new_product_page.variant_name_label')}</label>
                        <Input 
                          placeholder={creationMode === 'RESTAURANT' ? 'e.g. Half / Full' : t('catalog.new_product_page.variant_name_placeholder')} 
                          {...form.register(`variants.${idx}.name`)} 
                          className="h-9 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">{t('catalog.new_product_page.variant_price_label')}</label>
                        <Input 
                          type="number" step="0.01" placeholder="0.00" 
                          {...form.register(`variants.${idx}.selling_price`)} 
                          className="h-9 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">{t('catalog.new_product_page.variant_sku_label')}</label>
                        <Input 
                          placeholder="Auto-generated" 
                          {...form.register(`variants.${idx}.sku`)} 
                          className="h-9 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500" 
                        />
                      </div>
                      <div className="flex justify-end items-center pb-0.5">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => remove(idx)} 
                          className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vertical Specific Section */}
        {creationMode === 'RESTAURANT' ? (
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
            <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('catalog.new_product_page.section_restaurant')}</h3>
            </div>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('catalog.new_product_page.kitchen_station_label')}
                  </label>
                  <select 
                    {...form.register('kitchen_station')} 
                    className="w-full px-3.5 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{t('catalog.new_product_page.main_kitchen_option')}</option>
                    {kitchenStations.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('catalog.new_product_page.prep_time_label')}
                  </label>
                  <Input 
                    type="number" min="1" placeholder="15" 
                    {...form.register('prep_time_mins')} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
            <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('catalog.new_product_page.section_nature')}</h3>
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('catalog.new_product_page.weight_label')}</label>
                  <Input type="number" step="0.01" placeholder="0.50" {...form.register('weight')} className="h-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('catalog.new_product_page.reorder_point_label')}</label>
                  <Input type="number" min="0" placeholder="10" {...form.register('reorder_point')} className="h-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/catalog/products')}
            className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
          >
            {t('catalog.new_product_page.cancel_btn')}
          </Button>
          <PermissionGuard permission="catalog:create">
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-6 shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{loading ? t('catalog.new_product_page.saving_btn') : (creationMode === 'RESTAURANT' ? t('catalog.new_product_page.save_restaurant_btn') : t('catalog.new_product_page.save_retail_btn'))}</span>
            </Button>
          </PermissionGuard>
        </div>
        </div>

        {/* Right Sidebar - Help Panel */}
        <div className="hidden xl:block xl:col-span-1 space-y-6 sticky top-6">
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/10">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm">{t('catalog.new_product_page.guide_title')}</h3>
              </div>
              
              <div className="space-y-4 text-xs text-slate-600 dark:text-slate-400">
                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-200">{t('catalog.new_product_page.guide_step1_title')}</h4>
                  <p>{t('catalog.new_product_page.guide_step1_desc')}</p>
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-200">{t('catalog.new_product_page.guide_step2_title')}</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>{t('catalog.new_product_page.guide_storable')}</li>
                    <li>{t('catalog.new_product_page.guide_consumable')}</li>
                    <li>{t('catalog.new_product_page.guide_service')}</li>
                  </ul>
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-200">{t('catalog.new_product_page.guide_step3_title')}</h4>
                  <p>{t('catalog.new_product_page.guide_step3_desc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
