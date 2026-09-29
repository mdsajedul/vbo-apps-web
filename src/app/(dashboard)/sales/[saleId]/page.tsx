'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { salesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, RefreshCcw, Receipt, User, ShoppingCart, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { PermissionGuard } from "@/components/auth/PermissionGuard";

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    salesApi.getOne(params.saleId as string).then(res => {
      setSale(res.data || res);
    }).catch(console.error).finally(() => setLoading(false));
  }, [params.saleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
        <span>Loading transaction receipt...</span>
      </div>
    );
  }

  if (!sale) {
    return (
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 rounded-2xl">
        <CardContent className="p-16 text-center text-slate-500">
          Receipt not found or deleted.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <Link href="/sales/transactions">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs">
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </Button>
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20 shadow-2xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight font-mono">
              {sale.receipt_number}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Completed on {format(new Date(sale.created_at || Date.now()), 'MMMM dd, yyyy HH:mm')}
            </p>
          </div>
        </div>

        <PermissionGuard permission="sales:create">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/sales/${sale.id}/return`)} 
            className="flex items-center gap-1.5 rounded-xl border-amber-200 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-xs font-semibold px-4 py-2 shadow-2xs"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Process return</span>
          </Button>
        </PermissionGuard>
      </div>

      {/* Grid: Customer vs Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Customer */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Customer Information</h3>
          </div>
          <CardContent className="p-6 space-y-1.5 text-xs">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">{sale.customer?.name || 'Walk-in Customer'}</h4>
            <p className="text-slate-500">{sale.customer?.email || 'No email associated'}</p>
            <p className="text-slate-500">{sale.customer?.phone || 'No phone associated'}</p>
          </CardContent>
        </Card>

        {/* Sale Summary */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Financial Summary</h3>
          </div>
          <CardContent className="p-6 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Subtotal:</span>
              <span className="font-mono font-medium text-slate-900 dark:text-white">৳{((sale.subtotal || 0) / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Discount:</span>
              <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">-৳{((sale.discount_amount || 0) / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Taxes:</span>
              <span className="font-mono font-medium text-slate-900 dark:text-white">+৳{((sale.tax_total || 0) / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Payment Method:</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{sale.payment_method || 'CASH'}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800 text-sm">
              <span className="font-bold text-slate-900 dark:text-white">Grand Total:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">৳{((sale.grand_total || 0) / 100).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Sold Table Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white">
          Purchased Items
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                <tr>
                  <th className="px-6 py-3 font-semibold">PRODUCT</th>
                  <th className="px-6 py-3 text-right font-semibold">QUANTITY</th>
                  <th className="px-6 py-3 text-right font-semibold">UNIT PRICE</th>
                  <th className="px-6 py-3 text-right font-semibold">LINE TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {sale.items?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white text-xs">
                      {item.product?.name || item.product_name} {item.variant?.name ? `(${item.variant.name})` : ''}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                      ৳{((item.unit_price || 0) / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white text-xs">
                      ৳{((item.line_total || (item.quantity * item.unit_price)) / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
