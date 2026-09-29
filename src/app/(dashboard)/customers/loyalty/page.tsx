'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { loyaltyApi, customersApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { 
  Sparkles, Users, Gift, Check, Coins, 
  ShoppingCart, RotateCcw, UserCheck, Zap, 
  TrendingUp, Calculator, ShieldCheck, Crown,
  Search, Plus, Minus, ArrowRight, Star
} from 'lucide-react';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useTranslation } from '@/i18n';

export default function LoyaltyDashboardPage() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Customer Point Lookup & Adjustment State
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerPoints, setCustomerPoints] = useState<number | null>(null);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [pointsChange, setPointsChange] = useState<string>('50');
  const [adjustType, setAdjustType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Reward Simulator State
  const [simulatedSpend, setSimulatedSpend] = useState<number>(1000);

  useEffect(() => {
    fetchConfig();
    fetchCustomersList();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await loyaltyApi.getConfig();
      setConfig(res.data || res || {});
    } catch (err) {
      console.error(err);
      toast.error('Failed to load loyalty configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersList = async () => {
    try {
      const res = await customersApi.getAll({ limit: 50 });
      setCustomers(res.data || res || []);
    } catch (err) {
      console.error('Failed to load customer list for lookup', err);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await loyaltyApi.updateConfig({
        spend_amount_per_point: Number(config.spend_amount_per_point || 0),
        point_redemption_value: Number(config.point_redemption_value || 0),
        is_active: config.is_active ?? true
      });
      toast.success('Loyalty configuration saved successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectCustomer = async (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (!customerId) {
      setCustomerPoints(null);
      return;
    }
    setPointsLoading(true);
    try {
      const data = await loyaltyApi.getCustomerPoints(customerId);
      setCustomerPoints(data?.points ?? data?.balance ?? 0);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch customer points balance');
    } finally {
      setPointsLoading(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error('Please select a customer first');
      return;
    }
    const numPoints = Math.abs(Number(pointsChange));
    if (isNaN(numPoints) || numPoints <= 0) {
      toast.error('Please enter a valid positive number of points');
      return;
    }

    const finalDelta = adjustType === 'CREDIT' ? numPoints : -numPoints;

    setIsAdjusting(true);
    try {
      await loyaltyApi.adjustPoints(selectedCustomerId, {
        points_change: finalDelta,
        reason: adjustReason.trim() || (adjustType === 'CREDIT' ? 'Manual goodwill credit' : 'Manual adjustment')
      });
      toast.success(`Successfully ${adjustType === 'CREDIT' ? 'credited' : 'debited'} ${numPoints} points`);
      setAdjustModalOpen(false);
      setAdjustReason('');
      // Refresh points
      handleSelectCustomer(selectedCustomerId);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to adjust points balance');
    } finally {
      setIsAdjusting(false);
    }
  };

  // Calculations for Metrics & Simulator
  const spendPerPt = (config?.spend_amount_per_point || 10000) / 100; // in BDT
  const redeemValuePerPt = (config?.point_redemption_value || 100) / 100; // in BDT
  const effectiveCashbackPct = spendPerPt > 0 ? ((redeemValuePerPt / spendPerPt) * 100).toFixed(2) : '1.00';

  const simPointsEarned = spendPerPt > 0 ? Math.floor(simulatedSpend / spendPerPt) : 0;
  const simDiscountValue = simPointsEarned * redeemValuePerPt;

  const selectedCustomerObj = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20 shadow-2xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('customers.loyalty_title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('customers.loyalty_subtitle')}
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
          <Link href="/customers/gift-cards">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-indigo-500/30"
            >
              <Gift className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('customers.gift_cards_title')}</span>
            </Button>
          </Link>
          <PermissionGuard permission="loyalty:update">
            <Button 
              onClick={() => setAdjustModalOpen(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
            >
              <Coins className="w-4 h-4" />
              <span>{t('customers.btn_adjust_points')}</span>
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Program Status
              </p>
              <div className="flex items-center gap-2 mt-1">
                {config?.is_active ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active & Accruing
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    Disabled
                  </span>
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-2xs">
              <Zap className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Accrual Rate */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Accrual Rule
              </p>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 font-mono">
                ৳{spendPerPt.toFixed(0)} <span className="text-xs font-normal text-slate-400">/ 1 pt</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xs">
              <Coins className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Redemption Value */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Redemption Value
              </p>
              <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                ৳{redeemValuePerPt.toFixed(2)} <span className="text-xs font-normal text-slate-400">/ point</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Effective Return */}
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Effective Reward Rate
              </p>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 font-mono">
                {effectiveCashbackPct}% <span className="text-xs font-normal text-slate-400">cashback</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-2xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-16 text-center text-slate-500">
            <div className="inline-flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              <span>Loading loyalty settings...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Main Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Form & Simulator */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Card 1: Configuration Form */}
              <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
                <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Program Rules & Point Rates
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Define spending thresholds and currency value per point for retail & restaurant checkouts.
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>

                <form onSubmit={handleSaveConfig}>
                  <div className="p-6 space-y-5">
                    {/* Enable Program Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50/60 dark:bg-slate-800/30 rounded-xl border border-slate-200/80 dark:border-slate-800">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Enable Loyalty Program
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {config?.is_active 
                            ? 'Active: points accrue automatically on completed invoices'
                            : 'Inactive: points will not accrue on sales'}
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-3">
                        <input
                          type="checkbox"
                          checked={config?.is_active ?? false}
                          onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 dark:peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Spend Amount per Point */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Spend Amount per Point <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                            ৳
                          </span>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={config?.spend_amount_per_point != null ? config.spend_amount_per_point / 100 : ''}
                            onChange={(e) => setConfig({ ...config, spend_amount_per_point: Math.round(Number(e.target.value) * 100) })}
                            placeholder="100"
                            className="pl-8 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          Customer spends this amount to earn 1 reward point.
                        </p>
                      </div>

                      {/* Point Redemption Value */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Redemption Value (৳) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                            ৳
                          </span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={config?.point_redemption_value != null ? config.point_redemption_value / 100 : ''}
                            onChange={(e) => setConfig({ ...config, point_redemption_value: Math.round(Number(e.target.value) * 100) })}
                            placeholder="1.00"
                            className="pl-8 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          Discount value applied per 1 point redeemed.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Form Footer */}
                  <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Changes take effect on all upcoming transactions.
                    </span>
                    <PermissionGuard permission="loyalty:update">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {isSaving ? 'Saving...' : 'Save configuration'}
                      </Button>
                    </PermissionGuard>
                  </div>
                </form>
              </Card>

              {/* Card 2: Interactive Reward Calculator & Simulator */}
              <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
                <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                      <Calculator className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Live Reward Simulator
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Test how points and discounts calculate on custom spend amounts.
                      </p>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Sample Purchase Subtotal:
                      </span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                        ৳ {simulatedSpend.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {[500, 1000, 2500, 5000, 10000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setSimulatedSpend(amt)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            simulatedSpend === amt
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          ৳{amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Realtime Simulation Output */}
                  <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Points Earned</p>
                      <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                        +{simPointsEarned} <span className="text-xs font-medium">pts</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Discount Value</p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                        ৳{simDiscountValue.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Customer Yield</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                        {effectiveCashbackPct}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: VIP Membership Tiers & How It Works */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Card 3: VIP Membership Tiers */}
              <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
                <div className="px-5 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-2xs">
                      <Crown className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      VIP Membership Tiers
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    Tiered Boosters
                  </span>
                </div>

                <CardContent className="p-4 space-y-2.5">
                  {/* Bronze */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-700/10 text-amber-700 dark:text-amber-500 font-bold flex items-center justify-center text-xs border border-amber-700/20">
                        🥉
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">Bronze Member</h4>
                        <p className="text-[11px] text-slate-400">Entry level (0 - 499 pts)</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      1.0x standard
                    </span>
                  </div>

                  {/* Silver */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-300/20 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center text-xs border border-slate-400/20">
                        🥈
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">Silver VIP</h4>
                        <p className="text-[11px] text-slate-400">500+ lifetime pts</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      1.25x booster
                    </span>
                  </div>

                  {/* Gold */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                        🥇
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">Gold VIP</h4>
                        <p className="text-[11px] text-slate-400">1,500+ lifetime pts</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                      1.50x booster
                    </span>
                  </div>

                  {/* Platinum */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 font-bold flex items-center justify-center text-xs border border-purple-500/30">
                        💎
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">Platinum Elite</h4>
                        <p className="text-[11px] text-slate-400">5,000+ lifetime pts</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                      2.00x booster
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Operational Workflow Rules */}
              <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
                <div className="px-5 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Program Safety & Best Practices
                  </h3>
                </div>

                <CardContent className="p-4 space-y-3.5 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-500/20 mt-0.5">
                      <ShoppingCart className="w-3 h-3" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Automated POS Accrual</h4>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Points are computed from invoice subtotal after item discounts and tax exclusions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-500/20 mt-0.5">
                      <Coins className="w-3 h-3" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">1-Click POS Redemption</h4>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Cashiers can redeem available points directly on the POS payment modal.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center flex-shrink-0 border border-rose-500/20 mt-0.5">
                      <RotateCcw className="w-3 h-3" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Safe Return Adjustments</h4>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Points awarded from refunded orders are automatically reversed upon approval.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Section: Customer Points Lookup & Quick Adjustment */}
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
            <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-2xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Member Point Balance Lookup
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Search any customer to check live loyalty point balances and credit or debit points.
                  </p>
                </div>
              </div>

              {selectedCustomerId && (
                <PermissionGuard permission="loyalty:update">
                  <Button
                    size="sm"
                    onClick={() => setAdjustModalOpen(true)}
                    className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Adjust this member</span>
                  </Button>
                </PermissionGuard>
              )}
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                
                {/* Select Customer */}
                <div className="lg:col-span-6 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Select Customer Profile
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full px-3.5 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Choose a customer to view balance --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : c.email ? `(${c.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Live Balance Display */}
                <div className="lg:col-span-6">
                  {selectedCustomerId ? (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          {selectedCustomerObj?.name || 'Customer'}&apos;s Live Balance
                        </p>
                        {pointsLoading ? (
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                            <span>Fetching balance...</span>
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                              {(customerPoints ?? 0).toLocaleString()}
                            </span>
                            <span className="text-xs font-medium text-slate-500">points</span>
                            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold ml-2">
                              (Worth ৳{((customerPoints ?? 0) * redeemValuePerPt).toFixed(2)})
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAdjustType('CREDIT');
                            setAdjustModalOpen(true);
                          }}
                          className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:text-emerald-600 px-3 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Credit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAdjustType('DEBIT');
                            setAdjustModalOpen(true);
                          }}
                          className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:text-rose-600 px-3 shadow-2xs"
                        >
                          <Minus className="w-3.5 h-3.5 mr-1" />
                          Debit
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                      Select a customer profile from the dropdown to see their point balance and discount equity.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          MANUAL POINT ADJUSTMENT MODAL
      ──────────────────────────────────────────────────────────────────────── */}
      <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
        <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          {/* Header */}
          <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                  <Coins className="w-3.5 h-3.5" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('customers.adjust_modal_title')}
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('customers.adjust_modal_subtitle')}
              </p>
            </div>
          </div>

          <form onSubmit={handleAdjustSubmit}>
            <div className="px-6 py-5 space-y-4">
              
              {/* Customer Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('customers.col_name')} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  className="w-full px-3.5 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">{t('customers.lookup_placeholder')}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Type Toggle (Credit vs Debit) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('customers.adjust_type')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('CREDIT')}
                    className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      adjustType === 'CREDIT'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t('customers.type_credit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('DEBIT')}
                    className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      adjustType === 'DEBIT'
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-700 dark:text-rose-300 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    {t('customers.type_debit')}
                  </button>
                </div>
              </div>

              {/* Points Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('customers.points_amount')} <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={pointsChange}
                  onChange={(e) => setPointsChange(e.target.value)}
                  placeholder={t('customers.points_amount_placeholder')}
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('customers.adjust_reason')}
                </label>
                <Input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder={t('customers.adjust_reason_placeholder')}
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdjustModalOpen(false)}
                className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isAdjusting || !selectedCustomerId}
                className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isAdjusting ? t('customers.btn_adjusting') : t('customers.btn_confirm_adjustment')}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
