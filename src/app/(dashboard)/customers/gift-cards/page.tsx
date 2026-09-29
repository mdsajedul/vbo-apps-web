'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { giftCardsApi, api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { 
  Gift, Users, Sparkles, Plus, CreditCard, 
  User, Check, AlertCircle, Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useTranslation } from '@/i18n';

export default function GiftCardsPage() {
  const { t } = useTranslation();
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchGiftCards();
  }, []);

  const fetchGiftCards = async () => {
    setLoading(true);
    try {
      const res = await giftCardsApi.getAll();
      setGiftCards(res.data || res || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load gift cards');
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let customer_id = undefined;
      
      if (customerEmail.trim()) {
        const custRes = await api.get('/customers');
        const customers = custRes.data?.data || custRes.data || [];
        const cust = customers.find((c: any) => c.email?.toLowerCase() === customerEmail.trim().toLowerCase());
        if (cust) {
          customer_id = cust.id;
        } else {
          toast.error(t('customers.customer_not_found'));
          setIsSubmitting(false);
          return;
        }
      }

      await giftCardsApi.issue({
        amount: Math.round(Number(amount) * 100),
        customer_id
      });
      
      toast.success(t('customers.issue_success'));
      setIssueModalOpen(false);
      setAmount('');
      setCustomerEmail('');
      fetchGiftCards();
    } catch (err) {
      console.error(err);
      toast.error(t('customers.issue_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalIssuedCount = giftCards.length;
    const activeCards = giftCards.filter(
      c => c.is_active && (!c.expiry_date || new Date(c.expiry_date) > new Date())
    );
    const activeBalanceSum = activeCards.reduce((sum, c) => sum + (c.current_balance || 0), 0);
    return {
      total: totalIssuedCount,
      active: activeCards.length,
      balance: activeBalanceSum,
    };
  }, [giftCards]);

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20 shadow-2xs">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('customers.gift_cards_title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('customers.gift_cards_subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/customers">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-rose-500/30"
            >
              <Users className="w-3.5 h-3.5 text-rose-500" />
              <span>{t('customers.title')}</span>
            </Button>
          </Link>
          <Link href="/customers/loyalty">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-amber-500/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('customers.loyalty_title')}</span>
            </Button>
          </Link>
          <PermissionGuard permission="gift_cards:create">
            <Button 
              onClick={() => setIssueModalOpen(true)} 
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t('customers.btn_issue_card')}</span>
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('customers.stat_active_cards')}
              </p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {stats.total.toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xs">
              <Gift className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('customers.stat_redeemed_total')}
              </p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {stats.active.toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-2xs">
              <Check className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('customers.stat_circulating_balance')}
              </p>
              <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                ৳ {(stats.balance / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-2xs">
              <Wallet className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/40 dark:bg-slate-800/20">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t('customers.gift_cards_title')}
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {giftCards.length} {t('customers.stat_active_cards')}
          </span>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                <tr>
                  <th className="px-6 py-4 font-semibold">{t('customers.col_card_code')}</th>
                  <th className="px-6 py-4 font-semibold">{t('customers.card_amount')}</th>
                  <th className="px-6 py-4 font-semibold">{t('customers.col_card_balance')}</th>
                  <th className="px-6 py-4 font-semibold">{t('customers.col_card_customer')}</th>
                  <th className="px-6 py-4 font-semibold">{t('customers.col_card_created')}</th>
                  <th className="px-6 py-4 font-semibold text-right">{t('customers.col_card_status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        <span>Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : giftCards.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                          <Gift className="w-5 h-5" />
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{t('customers.no_gift_cards')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  giftCards.map((card) => {
                    const isActive = card.is_active && (!card.expiry_date || new Date(card.expiry_date) > new Date());

                    return (
                      <tr key={card.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        {/* Code */}
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-md font-mono text-xs font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                            {card.code}
                          </span>
                        </td>

                        {/* Initial Value */}
                        <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                          ৳ {((card.initial_balance || 0) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Current Balance */}
                        <td className="px-6 py-4 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          ৳ {((card.current_balance || 0) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Assigned Customer */}
                        <td className="px-6 py-4">
                          {card.customer?.name ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px] flex items-center justify-center border border-rose-500/20">
                                {card.customer.name.slice(0, 1).toUpperCase()}
                              </div>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                                {card.customer.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Unassigned</span>
                          )}
                        </td>

                        {/* Issue Date */}
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                          {card.created_at ? format(new Date(card.created_at), 'MMM dd, yyyy') : '-'}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-right">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Inactive
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ────────────────────────────────────────────────────────────────────────
          ISSUE GIFT CARD MODAL
      ──────────────────────────────────────────────────────────────────────── */}
      <Dialog open={issueModalOpen} onOpenChange={setIssueModalOpen}>
        <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          {/* Header */}
          <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                  <Gift className="w-3.5 h-3.5" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('customers.issue_modal_title')}
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('customers.issue_modal_subtitle')}
              </p>
            </div>
          </div>

          <form onSubmit={handleIssue}>
            <div className="px-6 py-5 space-y-4">
              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('customers.card_amount')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                    ৳
                  </span>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t('customers.card_amount_placeholder')}
                    className="pl-8 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Customer Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('customers.assign_customer_email')}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder={t('customers.assign_customer_placeholder')}
                    className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIssueModalOpen(false)}
                className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
              >
                {t('common.cancel')}
              </Button>
              <PermissionGuard permission="gift_cards:create">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? t('customers.btn_issuing') : t('customers.btn_issue_submit')}</span>
                </Button>
              </PermissionGuard>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
