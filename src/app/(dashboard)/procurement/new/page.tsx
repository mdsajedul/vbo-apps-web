'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  Plus, Trash2, ArrowLeft, ShoppingBag, Truck, 
  Building2, Package, Check, Calculator, Tag, 
  FileSpreadsheet, Coins 
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormError } from '@/components/ui/form-error';
import { toast } from 'sonner';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PageLoader, Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const poItemSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  unit_cost: z.string().min(1, 'Unit cost is required'),
});

const poSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  branch_id: z.string().min(1, 'Branch is required'),
  items: z.array(poItemSchema).min(1, 'At least one item is required'),
});

type POFormValues = z.infer<typeof poSchema>;

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const form = useForm<POFormValues>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      supplier_id: '',
      branch_id: '',
      items: [{ product_id: '', quantity: '1', unit_cost: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  });

  useEffect(() => {
    Promise.all([
      api.get('/suppliers'),
      api.get('/branches'),
      api.get('/products')
    ]).then(([supRes, braRes, proRes]) => {
      setSuppliers(supRes.data?.data || supRes.data || []);
      setBranches(braRes.data?.data || braRes.data || []);
      setProducts(proRes.data?.data || proRes.data || []);
    }).catch((err) => {
      console.error('Failed to load initial procurement data:', err);
      toast.error('Failed to load suppliers or branches');
    }).finally(() => {
      setInitialLoading(false);
    });
  }, []);

  const watchItems = form.watch('items');

  // Compute live order summary
  const totalItemsCount = watchItems.length;
  const totalUnitsCount = watchItems.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0);
  const grandTotalAmount = watchItems.reduce((sum, item) => {
    const qty = parseInt(item.quantity, 10) || 0;
    const cost = parseFloat(item.unit_cost) || 0;
    return sum + (qty * cost);
  }, 0);

  const onSubmit = async (data: POFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        supplier_id: data.supplier_id,
        branch_id: data.branch_id,
        items: data.items.map(i => ({
          product_id: i.product_id,
          quantity: parseInt(i.quantity, 10),
          unit_cost: Math.round(parseFloat(i.unit_cost) * 100)
        }))
      };
      await api.post('/procurement/orders', payload);
      toast.success('Purchase Order created successfully');
      router.push('/procurement');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create Purchase Order');
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex items-center gap-3.5 pt-1">
        <Link 
          href="/procurement" 
          className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center border border-slate-200/60 dark:border-slate-700 shadow-2xs transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20 shadow-2xs">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Create purchase order
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Issue a new inventory procurement request to registered suppliers and warehouse branches.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Card 1: Order Specifications */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Order routing & specifications
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specify the vendor source and destination retail branch or central warehouse.
            </p>
          </div>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Supplier Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="supplier_id" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Vendor / Supplier <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Truck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select 
                    id="supplier_id"
                    {...form.register('supplier_id')} 
                    className={cn(
                      "w-full h-10 pl-10 pr-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-colors",
                      form.formState.errors.supplier_id ? 'border-rose-500 focus:ring-rose-500' : ''
                    )}
                  >
                    <option value="">Select registered supplier...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} {s.contact_person ? `(${s.contact_person})` : ''}</option>
                    ))}
                  </select>
                </div>
                <FormError message={form.formState.errors.supplier_id?.message} />
              </div>

              {/* Destination Branch */}
              <div className="space-y-1.5">
                <Label htmlFor="branch_id" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Receiving Destination Branch <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select 
                    id="branch_id"
                    {...form.register('branch_id')} 
                    className={cn(
                      "w-full h-10 pl-10 pr-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-colors",
                      form.formState.errors.branch_id ? 'border-rose-500 focus:ring-rose-500' : ''
                    )}
                  >
                    <option value="">Select receiving branch...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
                <FormError message={form.formState.errors.branch_id?.message} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Purchased Line Items */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Purchased line items
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Add catalog items, order quantities, and agreed purchase unit rates.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700 font-mono">
              {fields.length} {fields.length === 1 ? 'Line Item' : 'Line Items'}
            </span>
          </div>

          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              {fields.map((field, idx) => {
                const currentQty = parseInt(watchItems[idx]?.quantity, 10) || 0;
                const currentCost = parseFloat(watchItems[idx]?.unit_cost) || 0;
                const lineTotal = currentQty * currentCost;

                return (
                  <div 
                    key={field.id} 
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col md:flex-row md:items-end gap-3.5 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    {/* Product */}
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Item #{idx + 1} Product <span className="text-rose-500">*</span>
                      </Label>
                      <div className="relative">
                        <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <select 
                          {...form.register(`items.${idx}.product_id`)} 
                          className={cn(
                            "w-full h-10 pl-10 pr-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-colors",
                            form.formState.errors.items?.[idx]?.product_id ? 'border-rose-500' : ''
                          )}
                        >
                          <option value="">Select catalog product...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku || p.barcode || 'N/A'})</option>
                          ))}
                        </select>
                      </div>
                      <FormError message={form.formState.errors.items?.[idx]?.product_id?.message} />
                    </div>

                    {/* Quantity */}
                    <div className="w-full md:w-32 space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Quantity <span className="text-rose-500">*</span>
                      </Label>
                      <Input 
                        type="number" 
                        min="1" 
                        {...form.register(`items.${idx}.quantity`)} 
                        className={cn(
                          "h-10 text-xs rounded-xl font-mono border-slate-200 dark:border-slate-800",
                          form.formState.errors.items?.[idx]?.quantity ? 'border-rose-500' : ''
                        )} 
                        placeholder="1"
                      />
                      <FormError message={form.formState.errors.items?.[idx]?.quantity?.message} />
                    </div>

                    {/* Unit Cost */}
                    <div className="w-full md:w-40 space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Unit Cost (৳) <span className="text-rose-500">*</span>
                      </Label>
                      <div className="relative">
                        <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          {...form.register(`items.${idx}.unit_cost`)} 
                          className={cn(
                            "h-10 pl-9 text-xs rounded-xl font-mono border-slate-200 dark:border-slate-800",
                            form.formState.errors.items?.[idx]?.unit_cost ? 'border-rose-500' : ''
                          )} 
                          placeholder="0.00"
                        />
                      </div>
                      <FormError message={form.formState.errors.items?.[idx]?.unit_cost?.message} />
                    </div>

                    {/* Line Subtotal */}
                    <div className="w-full md:w-36 space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Subtotal
                      </Label>
                      <div className="h-10 px-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700 flex items-center font-mono text-xs font-bold text-slate-900 dark:text-white">
                        ৳ {lineTotal.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    {/* Remove Line Action */}
                    {fields.length > 1 && (
                      <PermissionGuard permission="procurement:delete">
                        <button 
                          type="button" 
                          onClick={() => remove(idx)} 
                          className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200/60 dark:border-slate-700 transition-colors shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </PermissionGuard>
                    )}
                  </div>
                );
              })}
            </div>

            <FormError message={form.formState.errors.items?.root?.message} />

            {/* Add Item button */}
            <div className="pt-2">
              <PermissionGuard permission="procurement:create">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => append({ product_id: '', quantity: '1', unit_cost: '' })} 
                  className="rounded-xl text-xs font-semibold h-9 px-4 border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add line item</span>
                </Button>
              </PermissionGuard>
            </div>

            {/* Order Grand Totals Banner */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <span>Total Lines: <strong className="text-slate-900 dark:text-white font-mono">{totalItemsCount}</strong></span>
                <span>•</span>
                <span>Total Quantity: <strong className="text-slate-900 dark:text-white font-mono">{totalUnitsCount} Units</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Estimated Total:
                </span>
                <span className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                  ৳ {grandTotalAmount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Submitting generates a pending order ready for stock receiving audit.
            </span>

            <div className="flex items-center gap-2.5">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/procurement')}
                className="rounded-xl text-xs font-semibold px-4 h-10 border-slate-200 dark:border-slate-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting} 
                className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-6 shadow-xs flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit purchase order'}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
