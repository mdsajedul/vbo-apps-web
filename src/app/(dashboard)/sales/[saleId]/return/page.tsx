'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { salesApi, returnsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, RotateCcw, Check, ShoppingBag, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PermissionGuard } from "@/components/auth/PermissionGuard";

export default function CreateReturnPage() {
  const params = useParams();
  const router = useRouter();
  const saleId = params.saleId as string;

  const [sale, setSale] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [refundMethod, setRefundMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (saleId) {
      fetchSale();
    }
  }, [saleId]);

  const fetchSale = async () => {
    try {
      const data = await salesApi.getOne(saleId);
      const saleObj = data.data || data;
      setSale(saleObj);
      // Initialize returnItems state mapping
      const initialItems = (saleObj.items || []).map((item: any) => ({
        sale_item_id: item.id,
        name: item.product?.name || item.product_name,
        purchased_qty: Number(item.quantity),
        price: item.unit_price,
        line_total: item.line_total || (item.quantity * item.unit_price),
        return_qty: 0,
        reason: 'CUSTOMER_CHANGE_MIND',
        restock: true
      }));
      setReturnItems(initialItems);
    } catch (error) {
      toast.error('Failed to load sale details');
    }
  };

  const handleQtyChange = (index: number, val: string) => {
    const qty = Number(val);
    const newItems = [...returnItems];
    if (qty >= 0 && qty <= newItems[index].purchased_qty) {
      newItems[index].return_qty = qty;
      setReturnItems(newItems);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemsToReturn = returnItems
      .filter(item => item.return_qty > 0)
      .map(item => ({
        sale_item_id: item.sale_item_id,
        quantity: item.return_qty,
        reason: item.reason,
        restock: item.restock
      }));

    if (itemsToReturn.length === 0) {
      toast.error('Please specify return quantity for at least one item.');
      return;
    }

    setIsSubmitting(true);
    try {
      await returnsApi.create({
        sale_id: saleId,
        notes,
        refund_method: refundMethod,
        items: itemsToReturn
      });
      toast.success('Return request submitted successfully');
      router.push('/sales/returns');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit return request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sale) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
        <span>Loading receipt details...</span>
      </div>
    );
  }

  const totalRefundPreview = returnItems.reduce((acc, item) => {
    if (item.purchased_qty === 0) return acc;
    return acc + Math.floor((item.return_qty / item.purchased_qty) * item.line_total);
  }, 0);

  return (
    <div className="space-y-6 max-w-5xl pb-16 w-full">
      {/* Header */}
      <div className="flex items-center gap-4 pt-1">
        <Link href={`/sales/${saleId}`}>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs">
            <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-500/20 shadow-2xs">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Create return & refund
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Original Receipt: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">#{sale.receipt_number}</span>
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Table Card */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Select Items & Quantities to Return</h3>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                  <tr>
                    <th className="px-6 py-4 font-semibold">ITEM</th>
                    <th className="px-6 py-4 font-semibold">UNIT PRICE</th>
                    <th className="px-6 py-4 text-center font-semibold">PURCHASED</th>
                    <th className="px-6 py-4 font-semibold">RETURN QTY</th>
                    <th className="px-6 py-4 font-semibold">REASON</th>
                    <th className="px-6 py-4 text-center font-semibold">RESTOCK?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {returnItems.map((item, idx) => (
                    <tr key={item.sale_item_id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white text-xs">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        ৳{((item.price || 0) / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-xs text-slate-600 dark:text-slate-400">
                        {item.purchased_qty}
                      </td>
                      <td className="px-6 py-4">
                        <Input 
                          type="number" 
                          min="0" 
                          max={item.purchased_qty}
                          value={item.return_qty}
                          onChange={(e) => handleQtyChange(idx, e.target.value)}
                          className="w-20 h-9 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono text-center focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          className="h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                          value={item.reason}
                          onChange={(e) => {
                            const newItems = [...returnItems];
                            newItems[idx].reason = e.target.value;
                            setReturnItems(newItems);
                          }}
                        >
                          <option value="CUSTOMER_CHANGE_MIND">Customer Changed Mind</option>
                          <option value="DAMAGED">Damaged in Box</option>
                          <option value="DEFECTIVE">Defective / Malfunctioning</option>
                          <option value="WRONG_ITEM">Incorrect Item Billed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          checked={item.restock}
                          onChange={(e) => {
                            const newItems = [...returnItems];
                            newItems[idx].restock = e.target.checked;
                            setReturnItems(newItems);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Method & Estimated Refund Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl bg-white dark:bg-slate-900/70">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="refund_method" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Refund Method
                </Label>
                <select 
                  id="refund_method"
                  className="w-full px-3 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                >
                  <option value="CASH">Cash Refund</option>
                  <option value="CARD">Original Card Reversal</option>
                  <option value="MFS">Mobile Financial Services (bKash/Nagad)</option>
                  <option value="STORE_CREDIT">Store Credit / Customer Balance</option>
                  <option value="ORIGINAL_PAYMENT">Original Payment Method</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Return Notes & Observations (Optional)
                </Label>
                <Input 
                  id="notes" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Additional return reason, item condition, etc." 
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 flex flex-col justify-center items-center p-6">
            <CardContent className="p-0 text-center w-full space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Estimated Refund Amount
                </p>
                <div className="text-3xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
                  ৳{((totalRefundPreview || 0) / 100).toFixed(2)}
                </div>
              </div>
              <PermissionGuard permission="sales_returns:create">
                <Button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-5 text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5"
                  disabled={isSubmitting || totalRefundPreview === 0}
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit return request'}</span>
                </Button>
              </PermissionGuard>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
