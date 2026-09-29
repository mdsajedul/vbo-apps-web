'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { invoicesApi, customersApi, api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Receipt, User, Calendar, FileText, Check } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useTranslation } from '@/i18n';

export default function CreateInvoicePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [customerId, setCustomerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [terms, setTerms] = useState('');
  const [items, setItems] = useState<any[]>([
    { product_id: '', description: '', quantity: 1, unit_price: 0, tax_amount: 0, discount_amount: 0 }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    customersApi.getAll().then(res => setCustomers(res.data || res || [])).catch(console.error);
    api.get('/products').then(res => setProducts(res.data?.data || res.data || [])).catch(console.error);
  }, []);

  const handleAddItem = () => {
    setItems([...items, { product_id: '', description: '', quantity: 1, unit_price: 0, tax_amount: 0, discount_amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Auto fill details if product is selected
    if (field === 'product_id' && value) {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        newItems[index].description = selectedProduct.name;
        newItems[index].unit_price = selectedProduct.price / 100;
      }
    }
    
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error(t('invoices.select_customer_validation'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer_id: customerId,
        due_date: dueDate || undefined,
        terms: terms || undefined,
        items: items.map(i => ({
          product_id: i.product_id || undefined,
          description: i.description,
          unit_price: Math.round(Number(i.unit_price) * 100),
          quantity: Number(i.quantity),
          tax_amount: Math.round(Number(i.tax_amount || 0) * 100),
          discount_amount: Math.round(Number(i.discount_amount || 0) * 100)
        }))
      };

      const res = await invoicesApi.create(payload);
      const invoice = res.data || res;
      toast.success(t('invoices.invoice_created_success'));
      router.push(`/invoices/${invoice.id}`);
    } catch (err) {
      console.error(err);
      toast.error(t('invoices.invoice_create_failed'));
      setLoading(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
  const totalTax = items.reduce((sum, item) => sum + Number(item.tax_amount || 0), 0);
  const totalDiscount = items.reduce((sum, item) => sum + Number(item.discount_amount || 0), 0);
  const total = subtotal + totalTax - totalDiscount;

  return (
    <div className="space-y-6 max-w-5xl pb-16 w-full">
      {/* Header */}
      <div className="flex items-center gap-4 pt-1">
        <Link href="/invoices">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs">
            <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20 shadow-2xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('invoices.new_invoice_title')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('invoices.new_invoice_subtitle')}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Terms Card */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('invoices.customer_section')}
            </h3>
          </div>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Customer */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('invoices.select_customer')} <span className="text-rose-500">*</span>
                </label>
                <select 
                  className="w-full px-3 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  value={customerId} 
                  onChange={e => setCustomerId(e.target.value)} 
                  required
                >
                  <option value="">{t('invoices.select_customer_placeholder')}</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('invoices.due_date')}
                </label>
                <div className="relative">
                  <Input 
                    type="date" 
                    value={dueDate} 
                    onChange={e => setDueDate(e.target.value)} 
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('invoices.payment_terms')}
                </label>
                <Input 
                  type="text" 
                  value={terms} 
                  onChange={e => setTerms(e.target.value)} 
                  placeholder={t('invoices.payment_terms_placeholder')} 
                  className="h-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items Card */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('invoices.items_section')}
              </h3>
            </div>
            <PermissionGuard permission="invoices:create">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleAddItem} 
                className="rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600 gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> {t('invoices.add_item')}
              </Button>
            </PermissionGuard>
          </div>

          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="p-4 bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex-1 w-full space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select
                        className="h-9 w-full px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        value={item.product_id}
                        onChange={e => handleItemChange(index, 'product_id', e.target.value)}
                      >
                        <option value="">{t('invoices.select_product_placeholder')}</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} - ৳{(p.price / 100).toFixed(2)}
                          </option>
                        ))}
                      </select>
                      <Input 
                        className="h-9 rounded-xl border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                        placeholder={t('invoices.col_description')} 
                        value={item.description} 
                        onChange={e => handleItemChange(index, 'description', e.target.value)} 
                        required 
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1 block">
                          {t('invoices.col_qty')}
                        </label>
                        <Input 
                          className="h-9 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                          type="number" min="1" 
                          value={item.quantity} 
                          onChange={e => handleItemChange(index, 'quantity', e.target.value)} 
                          required 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1 block">
                          {t('invoices.col_price')} (৳)
                        </label>
                        <Input 
                          className="h-9 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                          type="number" min="0" step="0.01" 
                          value={item.unit_price} 
                          onChange={e => handleItemChange(index, 'unit_price', e.target.value)} 
                          required 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1 block">
                          {t('invoices.col_tax')} (৳)
                        </label>
                        <Input 
                          className="h-9 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                          type="number" min="0" step="0.01" 
                          value={item.tax_amount} 
                          onChange={e => handleItemChange(index, 'tax_amount', e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1 block">
                          {t('invoices.col_discount')} (৳)
                        </label>
                        <Input 
                          className="h-9 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                          type="number" min="0" step="0.01" 
                          value={item.discount_amount} 
                          onChange={e => handleItemChange(index, 'discount_amount', e.target.value)} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Line Total & Remove */}
                  <div className="flex md:flex-col items-center justify-between w-full md:w-28 pt-2 md:pt-0 text-right">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('invoices.col_line_total')}</span>
                      <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                        ৳{((Number(item.quantity) * Number(item.unit_price)) + Number(item.tax_amount || 0) - Number(item.discount_amount || 0)).toFixed(2)}
                      </span>
                    </div>

                    <PermissionGuard permission="invoices:delete">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 h-8 w-8 rounded-lg mt-2"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </PermissionGuard>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal Calculations */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex flex-col items-end gap-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="w-64 flex justify-between">
                <span>{t('invoices.subtotal')}:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="w-64 flex justify-between">
                <span>{t('invoices.total_tax')}:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">+৳{totalTax.toFixed(2)}</span>
              </div>
              <div className="w-64 flex justify-between">
                <span>{t('invoices.col_discount')}:</span>
                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">-৳{totalDiscount.toFixed(2)}</span>
              </div>
              <div className="w-64 flex justify-between text-base font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 pt-2 mt-1">
                <span>{t('invoices.total_payable')}:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">৳{total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/invoices')}
            className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
          >
            {t('common.cancel')}
          </Button>
          <PermissionGuard permission="invoices:create">
            <Button 
              type="submit" 
              disabled={loading}
              className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-6 shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{loading ? t('invoices.generating') : t('invoices.submit_invoice')}</span>
            </Button>
          </PermissionGuard>
        </div>
      </form>
    </div>
  );
}
