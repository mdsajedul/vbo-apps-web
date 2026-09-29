'use client';

import { useState, useEffect } from 'react';
import { Download, Calendar, ArrowLeft, Package, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function SalesByProductPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const today = new Date();
  const [startDate, setStartDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/sales/products?startDate=${startDate}&endDate=${endDate}`);
      setData(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch product report', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const url = `http://localhost:3001/reports/sales/products?startDate=${startDate}&endDate=${endDate}&format=csv`;
    const token = localStorage.getItem('token');
    
    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const a = document.createElement('a');
      const objectUrl = window.URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = `sales_by_product_${startDate}_to_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
    });
  };

  return (
    <div className="space-y-6 max-w-6xl pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <Link href="/reports/sales">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs">
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </Button>
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0 border border-sky-500/20 shadow-2xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Product Sales Performance
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rank top-performing menu items & retail SKUs by volume, gross revenue, and discounts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-2xs text-xs font-mono">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="outline-none bg-transparent text-slate-800 dark:text-slate-200"
            />
            <span className="mx-2 text-slate-400">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="outline-none bg-transparent text-slate-800 dark:text-slate-200"
            />
          </div>

          <Button 
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center text-slate-500">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                <span>Aggregating product sales records...</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                  <tr>
                    <th className="px-6 py-4 font-semibold">PRODUCT ITEM</th>
                    <th className="px-6 py-4 font-semibold">SKU CODE</th>
                    <th className="px-6 py-4 font-semibold text-right">QUANTITY SOLD</th>
                    <th className="px-6 py-4 font-semibold text-right">GROSS REVENUE (৳)</th>
                    <th className="px-6 py-4 font-semibold text-right">DISCOUNTS (৳)</th>
                    <th className="px-6 py-4 font-semibold text-right">NET REVENUE (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                        No sales transactions recorded for products in this date period.
                      </td>
                    </tr>
                  ) : (
                    data.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-white">
                          {row.name}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-400">
                          {row.sku}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono font-bold text-slate-900 dark:text-white text-right">
                          {row.quantity}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-600 dark:text-slate-400 text-right">
                          ৳{(row.gross_revenue / 100).toLocaleString('en-BD', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-rose-600 dark:text-rose-400 text-right">
                          ৳{(row.discounts / 100).toLocaleString('en-BD', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right">
                          ৳{(row.net_revenue / 100).toLocaleString('en-BD', {minimumFractionDigits: 2})}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
