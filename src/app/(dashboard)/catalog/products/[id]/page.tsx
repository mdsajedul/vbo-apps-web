'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { productsApi, categoriesApi, uploadApi, brandsApi, api } from '@/lib/api';
import { 
  UploadCloud, Plus, Trash2, ArrowLeft, Package, 
  Tag, Layers, Check, Info 
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

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  selling_price: z.string().min(1, 'Selling price is required'),
});

const productSchema = z.object({
  name: z.string().min(1, 'Product Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  category_id: z.string().optional(),
  brand_id: z.string().optional(),
  tax_rate_id: z.string().optional(),
  selling_price: z.string().min(1, 'Selling price is required'),
  cost_price: z.string().optional(),
  type: z.enum(['SIMPLE', 'VARIABLE']),
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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [uoms, setUoms] = useState<any[]>([]);
  
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
      status: 'ACTIVE',
      base_uom_id: '',
      variants: [],
      item_type: 'STANDARD',
      can_be_sold: true,
      can_be_purchased: true,
      weight: '',
      reorder_point: '',
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
        const [tree, brandsData, taxData, productData, uomData] = await Promise.all([
          categoriesApi.getTree(),
          brandsApi.getAll(),
          api.get('/tax-rates'),
          productsApi.getOne(productId),
          api.get('/uom').catch(() => ({ data: [] }))
        ]);
        
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
        setUoms(uomData.data || uomData || []);

        // Populate product data
        form.reset({
          type: (productData.type as 'SIMPLE' | 'VARIABLE') || 'SIMPLE',
          name: productData.name,
          sku: productData.sku,
          barcode: productData.barcode || '',
          category_id: productData.category_id || '',
          brand_id: productData.brand_id || '',
          tax_rate_id: productData.tax_rate_id || '',
          status: (productData.status as any) || 'ACTIVE',
          base_uom_id: productData.base_uom_id || '',
          selling_price: ((productData.selling_price ?? 0) / 100).toString(),
          cost_price: productData.cost_price ? (productData.cost_price / 100).toString() : '',
          item_type: (productData.item_type as any) || 'STANDARD',
          can_be_sold: productData.can_be_sold ?? true,
          can_be_purchased: productData.can_be_purchased ?? true,
          weight: productData.weight ? productData.weight.toString() : '',
          reorder_point: productData.reorder_point ? productData.reorder_point.toString() : '',
          variants: productData.type === 'VARIABLE' && productData.variants ? productData.variants.map((v: any) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            barcode: v.barcode || '',
            selling_price: (v.selling_price / 100).toString()
          })) : []
        });

        if (productData.image_url) {
          setImagePreview(productData.image_url.startsWith('http') ? productData.image_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${productData.image_url}`);
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to load product data');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [productId]);

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

      const payload = {
        type: data.type,
        name: data.name,
        sku: data.sku,
        barcode: data.barcode || undefined,
        category_id: data.category_id || undefined,
        brand_id: data.brand_id || undefined,
        tax_rate_id: data.tax_rate_id || undefined,
        selling_price: Math.round(parseFloat(data.selling_price) * 100),
        cost_price: data.cost_price ? Math.round(parseFloat(data.cost_price) * 100) : undefined,
        image_url: image_url || undefined,
        status: data.status,
        base_uom_id: data.base_uom_id || undefined,
        item_type: data.item_type,
        can_be_sold: data.can_be_sold,
        can_be_purchased: data.can_be_purchased,
        weight: data.weight ? parseFloat(data.weight) : undefined,
        reorder_point: data.reorder_point ? parseInt(data.reorder_point, 10) : undefined,
        variants: data.type === 'VARIABLE' && data.variants ? data.variants.map(v => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          selling_price: Math.round(parseFloat(v.selling_price) * 100),
          barcode: v.barcode || undefined,
        })) : undefined
      };

      await productsApi.update(productId, payload);
      toast.success('Product updated successfully');
      router.push('/catalog/products');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-16 text-center text-slate-500">
        <div className="inline-flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
          <span>Loading product details...</span>
        </div>
      </div>
    );
  }

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
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Edit Product Details
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Update catalog metadata, variant options, prices, and tax rates.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Basic Information & Category</h3>
          </div>

          <CardContent className="p-6">
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" {...form.register('can_be_sold')} className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Can be Sold</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" {...form.register('can_be_purchased')} className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Can be Purchased</span>
                  </label>
                </div>
                <div className="w-full sm:w-64">
                  <select {...form.register('item_type')} className="w-full px-3 h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="STANDARD">Storable Product</option>
                    <option value="CONSUMABLE">Consumable</option>
                    <option value="SERVICE">Service</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Product Name *
                  </label>
                  <Input 
                    {...form.register('name')} 
                    className={`h-10 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`} 
                  />
                  <FormError message={form.formState.errors.name?.message} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Category</label>
                  <select 
                    {...form.register('category_id')} 
                    className={`w-full px-3.5 h-10 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.category_id ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                  >
                    <option value="">-- Uncategorized --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{'\u00A0'.repeat(c.depth * 4)}{c.name}</option>
                    ))}
                  </select>
                  <FormError message={form.formState.errors.category_id?.message} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Brand</label>
                  <select 
                    {...form.register('brand_id')} 
                    className={`w-full px-3.5 h-10 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.brand_id ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                  >
                    <option value="">-- No Brand --</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  <FormError message={form.formState.errors.brand_id?.message} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Tax Rate</label>
                    <select 
                      {...form.register('tax_rate_id')} 
                      className={`w-full px-3.5 h-10 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.tax_rate_id ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                    >
                      <option value="">-- Default/Exempt --</option>
                      {taxRates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.percentage}%)</option>
                      ))}
                    </select>
                    <FormError message={form.formState.errors.tax_rate_id?.message} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Base Unit</label>
                    <select 
                      {...form.register('base_uom_id')} 
                      className={`w-full px-3.5 h-10 bg-white dark:bg-slate-900 border rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 ${form.formState.errors.base_uom_id ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                    >
                      <option value="">-- Select UOM --</option>
                      {uoms.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                      ))}
                    </select>
                    <FormError message={form.formState.errors.base_uom_id?.message} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Product Status</label>
                  <select 
                    {...form.register('status')} 
                    className="w-full px-3.5 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                    <option value="DISCONTINUED">DISCONTINUED</option>
                  </select>
                </div>
              </div>

              {/* Image Preview / Upload Box */}
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Product Image
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
                        Upload new image
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>
                      <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & SKU */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pricing & SKU Configuration</h3>
          </div>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Product Type <span className="text-rose-500">*</span>
                </label>
                <select 
                  {...form.register('type')} 
                  className="w-full px-3.5 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="SIMPLE">SIMPLE (Standard Single Item)</option>
                  <option value="VARIABLE">VARIABLE (Multi-Variant Item)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  SKU (Stock Keeping Unit) *
                </label>
                <Input 
                  {...form.register('sku')} 
                  className="h-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500" 
                />
                <FormError message={form.formState.errors.sku?.message} />
              </div>
            </div>

            {watchType === 'SIMPLE' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50/60 dark:bg-slate-800/30 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Selling Price (৳) *
                  </label>
                  <Input 
                    type="number" step="0.01" 
                    {...form.register('selling_price')} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500" 
                  />
                  <FormError message={form.formState.errors.selling_price?.message} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Cost Price (৳)
                  </label>
                  <Input 
                    type="number" step="0.01" 
                    {...form.register('cost_price')} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Barcode (Optional)
                  </label>
                  <Input 
                    placeholder="Scan or type barcode" 
                    {...form.register('barcode')} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Product Variants
                  </h4>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => append({ name: '', sku: '', barcode: '', selling_price: '' })}
                    className="rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600 gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Variant
                  </Button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="p-3.5 bg-slate-50/60 dark:bg-slate-800/30 rounded-xl border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Variant Name *</label>
                        <Input 
                          placeholder="e.g. Red, Large" 
                          {...form.register(`variants.${idx}.name`)} 
                          className="h-9 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">SKU *</label>
                        <Input 
                          {...form.register(`variants.${idx}.sku`)} 
                          className="h-9 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Selling Price (৳) *</label>
                        <Input 
                          type="number" step="0.01" 
                          {...form.register(`variants.${idx}.selling_price`)} 
                          className="h-9 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500" 
                        />
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <Input 
                          placeholder="Barcode" 
                          {...form.register(`variants.${idx}.barcode`)} 
                          className="h-9 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500" 
                        />
                        {fields.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => remove(idx)} 
                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/catalog/products')}
            className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
          >
            Cancel
          </Button>
          <PermissionGuard permission="catalog:update">
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-6 shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving...' : 'Save Product'}</span>
            </Button>
          </PermissionGuard>
        </div>
      </form>
    </div>
  );
}
