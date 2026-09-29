'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { Download, FileText, Calendar as CalendarIcon, ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function Mushak61Page() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  const fetchData = async () => {
    if (!date?.from || !date?.to) return;
    setLoading(true);
    try {
      const res = await api.get('/reports/mushak-6-1', {
        params: {
          startDate: date.from.toISOString(),
          endDate: date.to.toISOString()
        }
      });
      setData(res.data?.data || res.data || []);
    } catch (e) {
      toast.error('Failed to load Mushak 6.1 report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [date]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 print:p-0 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1 print:hidden">
        <div className="flex items-center gap-3.5">
          <Link href="/reports/sales">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs">
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </Button>
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0 border border-sky-500/20 shadow-2xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Mushak 6.1 Purchase Register
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              NBR Compliant (ক্রয় হিসাব পুস্তক) under Clauses (1) of Sub-Rule (1) of Rule 40.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "h-9 px-3.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-400" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "dd MMM yyyy")} - {format(date.to, "dd MMM yyyy")}
                    </>
                  ) : (
                    format(date.from, "dd MMM yyyy")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Button 
            onClick={handlePrint} 
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
          >
            <FileText className="w-4 h-4" />
            <span>Print Official Form</span>
          </Button>
        </div>
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70 shadow-xs print:border-none print:shadow-none">
        {/* Print Header */}
        <div className="hidden print:block text-center mb-6 pt-8">
          <h1 className="text-xl font-bold">Government of the People's Republic of Bangladesh</h1>
          <h2 className="text-lg font-bold">National Board of Revenue</h2>
          <h3 className="text-md font-bold mt-2">Purchase Register (Mushak 6.1)</h3>
          <p className="mt-1 text-xs">[See Clauses (1) of Sub-Rule (1) of Rule 40]</p>
          <div className="text-left mt-4 text-xs font-mono">
            <p><strong>Name of Registered Entity:</strong> BOS Commercial Platform</p>
            <p><strong>Business Identification Number (BIN):</strong> 00000000-0000</p>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse print:text-xs">
              <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60 print:bg-transparent print:border-b-2 print:border-black print:text-black">
                <tr>
                  <th className="px-5 py-3.5 font-semibold border-r border-slate-100 dark:border-slate-800/60 print:border-black">DATE</th>
                  <th className="px-5 py-3.5 font-semibold border-r border-slate-100 dark:border-slate-800/60 print:border-black">CHALLAN / GRN NO</th>
                  <th className="px-5 py-3.5 font-semibold border-r border-slate-100 dark:border-slate-800/60 print:border-black">SUPPLIER NAME</th>
                  <th className="px-5 py-3.5 font-semibold border-r border-slate-100 dark:border-slate-800/60 print:border-black">SUPPLIER BIN</th>
                  <th className="px-5 py-3.5 font-semibold border-r border-slate-100 dark:border-slate-800/60 print:border-black">ITEM DESCRIPTION</th>
                  <th className="px-5 py-3.5 font-semibold border-r border-slate-100 dark:border-slate-800/60 print:border-black text-right">QUANTITY</th>
                  <th className="px-5 py-3.5 font-semibold border-r border-slate-100 dark:border-slate-800/60 print:border-black text-right">VALUE (EXCL. VAT)</th>
                  <th className="px-5 py-3.5 text-right font-semibold print:border-black">VAT AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 print:divide-black">
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-xs">Loading Mushak 6.1 registry records...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-xs">No registered procurement records found for this period.</td></tr>
                ) : (
                  data.map((grn) => (
                    <tr key={grn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-5 py-3.5 text-xs font-mono border-r border-slate-100 dark:border-slate-800/60 print:border-black">{format(new Date(grn.created_at), 'dd-MM-yyyy')}</td>
                      <td className="px-5 py-3.5 text-xs font-mono font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800/60 print:border-black">{grn.grn_number}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/60 print:border-black">{grn.supplier?.name || 'Registered Vendor'}</td>
                      <td className="px-5 py-3.5 text-xs font-mono text-slate-400 border-r border-slate-100 dark:border-slate-800/60 print:border-black">{grn.supplier?.bin || 'N/A'}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/60 print:border-black">
                         {grn.items?.length || 0} items
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800/60 print:border-black text-right">
                        {grn.items?.reduce((sum: number, i: any) => sum + Number(i.quantity_received), 0)}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono border-r border-slate-100 dark:border-slate-800/60 print:border-black text-right">
                        ৳0.00
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right print:border-black">
                        ৳0.00
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
