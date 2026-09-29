'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { paymentsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, CheckCircle2, RefreshCw, Smartphone, 
  Lock, CreditCard, ArrowRight, Building2, Zap 
} from 'lucide-react';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      loadAttempt();
    }
  }, [token]);

  const loadAttempt = async () => {
    setLoading(true);
    try {
      const data = await paymentsApi.resolveLink(token);
      setAttempt(data);
      if (data.status === 'SUCCESS') {
        setSuccess(true);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to resolve checkout link');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    setProcessing(true);
    try {
      const data = await paymentsApi.initiate(token);
      toast.success(`Redirecting to ${data.gateway}...`);
      window.location.href = data.redirect_url;
    } catch (err) {
      console.error(err);
      toast.error('Payment processing failed. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-500"></div>
          <span className="text-xs font-mono">Verifying secure payment session...</span>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <Card className="p-8 max-w-md w-full text-center space-y-3 shadow-2xl border-slate-800 bg-slate-900 text-white rounded-3xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Invalid or Expired Payment Link</h2>
          <p className="text-slate-400 text-xs">This transaction link has either already been fulfilled or expired.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-emerald-600/10 blur-[130px] pointer-events-none" />

      <Card className="max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl text-white rounded-3xl z-10">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto border border-indigo-500/20 shadow-2xs">
            <img src="/logo.png" alt="VBO" className="w-7 h-7 object-contain" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white pt-1">VBO ERP Secure Checkout</h1>
          <p className="text-xs text-slate-400">Encrypted transactional gateway</p>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-white">Payment Received!</h2>
            <p className="text-xs text-slate-400">
              Your payment of <strong className="font-mono text-white font-bold">{Number(attempt.amount)} {attempt.currency}</strong> was verified and recorded.
            </p>
            <div className="bg-slate-950 p-4 rounded-2xl text-left border border-slate-800 text-xs space-y-1.5 text-slate-400 font-mono">
              <div>TxID: <span className="text-slate-200">{attempt.gateway_transaction_id}</span></div>
              <div>Gateway: <span className="text-slate-200">{attempt.gateway}</span></div>
              {attempt.invoice && <div>Invoice: <span className="text-slate-200">{attempt.invoice.invoice_number}</span></div>}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Invoice Info */}
            <div className="bg-indigo-950/30 p-4 rounded-2xl border border-indigo-900/40 space-y-3">
              <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                <span>PAYMENT DUE</span>
                <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-mono">
                  Pending
                </span>
              </div>

              <div className="flex justify-between items-end border-b border-indigo-900/40 pb-3">
                <div>
                  <h3 className="text-[11px] text-slate-400 uppercase font-semibold">Total Amount</h3>
                  <span className="text-2xl font-bold font-mono text-white">
                    {Number(attempt.amount)} {attempt.currency}
                  </span>
                </div>
                {attempt.invoice && (
                  <div className="text-right">
                    <h3 className="text-[11px] text-slate-400 uppercase font-semibold">Invoice #</h3>
                    <span className="font-mono text-xs text-slate-200 font-bold">{attempt.invoice.invoice_number}</span>
                  </div>
                )}
              </div>

              {attempt.invoice?.customer && (
                <div className="text-xs space-y-0.5 pt-1 text-slate-400">
                  <div>Customer: <strong className="text-slate-200">{attempt.invoice.customer.name}</strong></div>
                  {attempt.invoice.customer.phone && <div>Phone: <span className="font-mono text-slate-300">{attempt.invoice.customer.phone}</span></div>}
                </div>
              )}
            </div>

            {/* Payment Method Selected */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">Payment Method</span>
              <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">{attempt.gateway} Hosted Checkout</h4>
                    <p className="text-[10px] text-slate-400">Secure automated redirection</p>
                  </div>
                </div>
                <CreditCard className="w-4 h-4 text-slate-500" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <Button
                onClick={handlePay}
                disabled={processing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 rounded-xl shadow-md shadow-indigo-600/20 text-xs flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting to Gateway...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize & Pay {Number(attempt.amount)} {attempt.currency}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
