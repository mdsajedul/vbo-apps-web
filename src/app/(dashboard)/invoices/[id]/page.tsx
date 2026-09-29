'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { invoicesApi, paymentsApi } from '@/lib/api';
import { useMasterData } from '@/hooks/useMasterData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, CreditCard, Link2, Copy, ExternalLink, 
  Receipt, User, CheckCircle2, AlertCircle, Clock, Check
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PermissionGuard } from "@/components/auth/PermissionGuard";

export default function InvoiceDetailPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Master data hook for payment methods
  const { data: paymentMethods, getLabel: getPaymentMethodLabel } = useMasterData('PAYMENT_METHOD');

  // Payment state
  const [payFormOpen, setPayFormOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payProcessing, setPayProcessing] = useState(false);

  // Payment link state
  const [linkFormOpen, setLinkFormOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'BKASH' | 'SSLCOMMERZ'>('BKASH');
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkProcessing, setLinkProcessing] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      const res = await invoicesApi.getOne(params.id as string);
      setInvoice(res.data || res);
    } catch (err) {
      toast.error('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayProcessing(true);
    try {
      await invoicesApi.pay(invoice.id, {
        amount: Math.round(Number(payAmount) * 100),
        method: payMethod
      });
      toast.success('Payment recorded successfully');
      setPayFormOpen(false);
      fetchInvoice();
    } catch (err) {
      toast.error('Failed to record payment');
    } finally {
      setPayProcessing(false);
    }
  };

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkProcessing(true);
    try {
      const remainingBalance = invoice.total_amount - invoice.paid_amount;
      const res = await paymentsApi.generateLink({
        invoice_id: invoice.id,
        gateway: selectedGateway,
        amount: remainingBalance / 100
      });
      setGeneratedLink(res.payment_link);
      toast.success('Payment link generated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate payment link. Make sure the gateway is configured.');
    } finally {
      setLinkProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
        <span>Loading invoice details...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 rounded-2xl">
        <CardContent className="p-16 text-center text-slate-500">
          Invoice not found or deleted.
        </CardContent>
      </Card>
    );
  }

  const remainingBalance = invoice.total_amount - invoice.paid_amount;

  return (
    <div className="space-y-6 max-w-5xl pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <Link href="/invoices">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs">
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </Button>
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20 shadow-2xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight font-mono">
                {invoice.invoice_number}
              </h2>
              {/* Status Badge */}
              {invoice.status === 'PAID' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Paid
                </span>
              ) : invoice.status === 'PARTIALLY_PAID' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20">
                  <Clock className="w-3 h-3 text-indigo-500" />
                  Partially Paid
                </span>
              ) : invoice.status === 'OVERDUE' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20">
                  <AlertCircle className="w-3 h-3 text-rose-500" />
                  Overdue
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20">
                  {invoice.status || 'Pending'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Issued {format(new Date(invoice.created_at || Date.now()), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>

        {remainingBalance > 0 && (
          <div className="flex items-center gap-2.5">
            <PermissionGuard permission="invoices:update">
              <Button 
                onClick={() => {
                  setPayAmount((remainingBalance / 100).toString());
                  setPayFormOpen(!payFormOpen);
                  setLinkFormOpen(false);
                }} 
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                <CreditCard className="w-3.5 h-3.5" /> 
                <span>Record payment</span>
              </Button>
            </PermissionGuard>
            <Button 
              onClick={() => {
                setLinkFormOpen(!linkFormOpen);
                setPayFormOpen(false);
                setGeneratedLink('');
              }} 
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              <Link2 className="w-3.5 h-3.5" /> 
              <span>Payment link</span>
            </Button>
          </div>
        )}
      </div>

      {/* Record Payment Form Panel */}
      {payFormOpen && (
        <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-emerald-100/50 dark:bg-emerald-900/30 border-b border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Record Manual Payment</h3>
          </div>
          <CardContent className="p-6">
            <form onSubmit={handlePay} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Payment Amount (৳) *
                </label>
                <Input 
                  type="number" min="1" max={remainingBalance / 100} step="0.01" required
                  value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Payment Method
                </label>
                <select 
                  className="w-full px-3 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  value={payMethod} onChange={e => setPayMethod(e.target.value)}
                >
                  {paymentMethods.length > 0 ? (
                    paymentMethods.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.label} {m.label_bn ? `(${m.label_bn})` : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="BKASH">bKash</option>
                      <option value="NAGAD">Nagad</option>
                      <option value="ROCKET">Rocket</option>
                    </>
                  )}
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setPayFormOpen(false)} className="rounded-xl text-xs font-semibold">
                  Cancel
                </Button>
                <Button type="submit" disabled={payProcessing} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs">
                  {payProcessing ? 'Recording...' : 'Submit payment'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Payment Link Generator Panel */}
      {linkFormOpen && (
        <Card className="border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-xs rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-indigo-100/50 dark:bg-indigo-900/30 border-b border-indigo-200 dark:border-indigo-900/50 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Generate Online Payment Link</h3>
          </div>
          <CardContent className="p-6">
            {!generatedLink ? (
              <form onSubmit={handleGenerateLink} className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Payment Gateway
                  </label>
                  <select 
                    className="w-full px-3 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedGateway} onChange={e => setSelectedGateway(e.target.value as any)}
                  >
                    <option value="BKASH">bKash Direct Merchant</option>
                    <option value="SSLCOMMERZ">SSLCommerz Aggregator</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setLinkFormOpen(false)} className="rounded-xl text-xs font-semibold">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={linkProcessing} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs">
                    {linkProcessing ? 'Generating...' : 'Generate link'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 break-all">
                  {generatedLink}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink);
                      toast.success('Link copied to clipboard');
                    }}
                    variant="outline"
                    className="rounded-xl text-xs font-semibold gap-1.5 shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Link
                  </Button>
                  <Button 
                    onClick={() => window.open(generatedLink, '_blank')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Checkout Portal
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setLinkFormOpen(false)}
                    className="rounded-xl text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overview Grid: Billed To vs Invoice Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Recipient */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Billed Recipient</h3>
          </div>
          <CardContent className="p-6 space-y-1.5 text-xs">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">{invoice.customer?.name || 'Walk-in Customer'}</h4>
            <p className="text-slate-500">{invoice.customer?.email || 'No email provided'}</p>
            <p className="text-slate-500">{invoice.customer?.phone || 'No phone provided'}</p>
            {invoice.customer?.address && <p className="text-slate-400 mt-2">{invoice.customer.address}</p>}
          </CardContent>
        </Card>

        {/* Invoice Summary */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Invoice Balances</h3>
          </div>
          <CardContent className="p-6 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Terms:</span> 
              <span className="font-semibold text-slate-700 dark:text-slate-300">{invoice.terms || 'Due on receipt'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Due Date:</span> 
              <span className="font-semibold text-slate-700 dark:text-slate-300">{invoice.due_date ? format(new Date(invoice.due_date), 'MMM dd, yyyy') : 'Immediate'}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Grand Total:</span> 
              <span className="font-mono font-bold text-slate-900 dark:text-white">৳{((invoice.total_amount || 0) / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Amount Paid:</span> 
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">৳{((invoice.paid_amount || 0) / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800 text-sm">
              <span className="font-bold text-slate-900 dark:text-white">Remaining Balance:</span> 
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">৳{(remainingBalance / 100).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items Table Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white">
          Billed Line Items
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                <tr>
                  <th className="px-6 py-3 font-semibold">DESCRIPTION</th>
                  <th className="px-6 py-3 text-right font-semibold">QUANTITY</th>
                  <th className="px-6 py-3 text-right font-semibold">UNIT PRICE</th>
                  <th className="px-6 py-3 text-right font-semibold">LINE TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {invoice.items?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white text-xs">
                      {item.product?.name || item.description}
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

      {/* Payment History Table Card */}
      {invoice.payments && invoice.payments.length > 0 && (
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
          <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white">
            Recorded Payment Receipts
          </div>
          <CardContent className="p-0">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                <tr>
                  <th className="px-6 py-3 font-semibold">DATE & TIME</th>
                  <th className="px-6 py-3 font-semibold">METHOD</th>
                  <th className="px-6 py-3 font-semibold">TRANSACTION ID</th>
                  <th className="px-6 py-3 text-right font-semibold">AMOUNT RECEIVED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {invoice.payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {format(new Date(p.created_at), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                        {getPaymentMethodLabel(p.method, p.method)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {p.transaction_id || '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      ৳{((p.amount || 0) / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
