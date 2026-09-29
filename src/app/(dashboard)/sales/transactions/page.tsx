'use client';

import { useState, useEffect } from 'react';
import { salesApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { 
  Receipt, Search, Eye, RotateCcw, ChevronLeft, 
  ChevronRight, ArrowLeft, ShoppingCart, CheckCircle2 
} from 'lucide-react';

export default function TransactionsListPage() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters and Pagination
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const data = await salesApi.getAll();
      setSales(data.data || data || []);
    } catch (error) {
      toast.error('Failed to load sales transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSales = (Array.isArray(sales) ? sales : []).filter(sale => {
    const term = search.toLowerCase();
    return !search || 
      (sale.receipt_number || '').toLowerCase().includes(term) || 
      (sale.customer?.name || '').toLowerCase().includes(term);
  });

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage) || 1;
  const paginatedSales = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20 shadow-2xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Sales transactions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review individual customer receipts, payment methods, and line-item details.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/sales">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-indigo-500/30"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-indigo-500" />
              <span>Sales & reports</span>
            </Button>
          </Link>
          <Link href="/sales/returns">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-rose-500/30"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span>Returns & refunds</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4 bg-slate-50/40 dark:bg-slate-800/20">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search receipt # or customer name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-10 h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Showing {paginatedSales.length} of {filteredSales.length} receipts
          </div>
        </div>

        {/* Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                <tr>
                  <th className="px-6 py-4 font-semibold">RECEIPT #</th>
                  <th className="px-6 py-4 font-semibold">DATE & TIME</th>
                  <th className="px-6 py-4 font-semibold">CUSTOMER</th>
                  <th className="px-6 py-4 text-right font-semibold">TOTAL AMOUNT</th>
                  <th className="px-6 py-4 font-semibold">PAYMENT METHOD</th>
                  <th className="px-6 py-4 text-right font-semibold">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        <span>Loading sales transactions...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">No transactions found</p>
                        <p className="text-xs text-slate-400 max-w-sm">
                          {search ? `No receipts matching "${search}".` : 'Complete sales at the POS terminal to see transaction records.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      {/* Receipt */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                          {sale.receipt_number}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {sale.created_at ? format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm') : '-'}
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          {sale.customer?.name || 'Walk-in Customer'}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        ৳{((sale.grand_total || 0) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Payment */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-500/20">
                          {sale.payment_method || 'CASH'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5 items-center">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => router.push(`/sales/${sale.id}`)}
                            className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600 px-3 shadow-2xs gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </Button>
                          <PermissionGuard permission="sales_returns:create">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 rounded-xl text-xs font-semibold border-amber-200 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 px-2.5 shadow-2xs gap-1" 
                              onClick={() => router.push(`/sales/${sale.id}/return`)}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Return</span>
                            </Button>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredSales.length)} of {filteredSales.length} receipts
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="outline" size="icon" className="h-8 w-8 rounded-xl border-slate-200 dark:border-slate-700" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" size="icon" className="h-8 w-8 rounded-xl border-slate-200 dark:border-slate-700" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
