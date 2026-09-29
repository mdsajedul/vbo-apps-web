'use client';

import React, { useState, useEffect } from 'react';
import { restaurantApi } from '@/lib/restaurant-api';
import { branchesApi } from '@/lib/api';
import { useMasterData } from '@/hooks/useMasterData';
import {
  Settings, Building2, UtensilsCrossed, ChefHat, LayoutGrid,
  Percent, DollarSign, CheckCircle2, Save, RefreshCw, Shield,
  CreditCard, Smartphone, HelpCircle, ArrowLeft, Tag, Check, Plus, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { cn } from '@/lib/utils';
import { PageLoader, Spinner } from '@/components/ui/spinner';

export default function RestaurantSettingsPage() {
  const { data: masterPaymentMethods } = useMasterData('PAYMENT_METHOD');
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('TENANT_DEFAULT');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [config, setConfig] = useState<any>({
    kot_enabled: true,
    table_management_enabled: true,
    course_firing_enabled: false,
    customer_capture_mode: 'optional',
    takeaway_enabled: true,
    delivery_enabled: true,
    service_charge_enabled: false,
    service_charge_pct: 0,
    tax_rate_pct: 5,
    default_order_type: 'DINE_IN',
    enabled_payment_methods: JSON.stringify(['CASH', 'CARD', 'BKASH', 'NAGAD', 'ROCKET']),
    void_reasons_json: JSON.stringify(['Customer Changed Mind', 'Order Error', 'Quality Issue', 'Duplicate Entry']),
    comp_reasons_json: JSON.stringify(['VIP Guest', 'Management Courtesy', 'Delay Compensation', 'Promo']),
  });

  const [paymentMethods, setPaymentMethods] = useState<string[]>(['CASH', 'CARD', 'BKASH', 'NAGAD', 'ROCKET']);
  const [newVoidReason, setNewVoidReason] = useState('');
  const [voidReasons, setVoidReasons] = useState<string[]>([]);
  const [newCompReason, setNewCompReason] = useState('');
  const [compReasons, setCompReasons] = useState<string[]>([]);

  // Load Branches
  useEffect(() => {
    async function loadBranches() {
      try {
        const branchData = await branchesApi.getAll().catch(() => []);
        const list = Array.isArray(branchData.data || branchData) ? (branchData.data || branchData) : [];
        setBranches(list);
      } catch (err) {
        console.error('Failed to load branches', err);
      }
    }
    loadBranches();
  }, []);

  // Load Config when branch selection changes
  useEffect(() => {
    async function loadConfig() {
      setLoading(true);
      try {
        const branchQuery = selectedBranchId === 'TENANT_DEFAULT' ? undefined : selectedBranchId;
        const res = await restaurantApi.getConfig(branchQuery);
        if (res) {
          setConfig(res);
          try {
            setPaymentMethods(res.enabled_payment_methods ? JSON.parse(res.enabled_payment_methods) : ['CASH', 'CARD', 'BKASH', 'NAGAD', 'ROCKET']);
          } catch (e) {
            setPaymentMethods(['CASH', 'CARD', 'BKASH', 'NAGAD', 'ROCKET']);
          }

          try {
            setVoidReasons(res.void_reasons_json ? JSON.parse(res.void_reasons_json) : ['Customer Changed Mind', 'Order Error', 'Quality Issue', 'Duplicate Entry']);
          } catch (e) {
            setVoidReasons(['Customer Changed Mind', 'Order Error', 'Quality Issue', 'Duplicate Entry']);
          }

          try {
            setCompReasons(res.comp_reasons_json ? JSON.parse(res.comp_reasons_json) : ['VIP Guest', 'Management Courtesy', 'Delay Compensation', 'Promo']);
          } catch (e) {
            setCompReasons(['VIP Guest', 'Management Courtesy', 'Delay Compensation', 'Promo']);
          }
        }
      } catch (err) {
        console.error('Failed to load restaurant config', err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [selectedBranchId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const branchQuery = selectedBranchId === 'TENANT_DEFAULT' ? undefined : selectedBranchId;
      const {
        id,
        tenant_id,
        organization_id,
        branch_id,
        created_at,
        updated_at,
        deleted_at,
        ...cleanConfig
      } = config || {};

      const payload = {
        ...cleanConfig,
        service_charge_pct: Number(config.service_charge_pct ?? 0),
        tax_rate_pct: Number(config.tax_rate_pct ?? 0),
        enabled_payment_methods: JSON.stringify(paymentMethods),
        void_reasons_json: JSON.stringify(voidReasons),
        comp_reasons_json: JSON.stringify(compReasons),
      };

      await restaurantApi.updateConfig(payload, branchQuery);
      toast.success('Restaurant operating settings saved successfully!');
    } catch (err: any) {
      console.error('Failed to save config', err);
      toast.error(err?.response?.data?.message || 'Failed to save restaurant settings');
    } finally {
      setSaving(false);
    }
  };

  const togglePaymentMethod = (method: string) => {
    if (paymentMethods.includes(method)) {
      if (paymentMethods.length === 1) {
        toast.error('At least one payment method must remain active');
        return;
      }
      setPaymentMethods(paymentMethods.filter((m) => m !== method));
    } else {
      setPaymentMethods([...paymentMethods, method]);
    }
  };

  const addVoidReason = () => {
    if (!newVoidReason.trim()) return;
    if (voidReasons.includes(newVoidReason.trim())) return;
    setVoidReasons([...voidReasons, newVoidReason.trim()]);
    setNewVoidReason('');
  };

  const removeVoidReason = (index: number) => {
    setVoidReasons(voidReasons.filter((_, i) => i !== index));
  };

  const addCompReason = () => {
    if (!newCompReason.trim()) return;
    if (compReasons.includes(newCompReason.trim())) return;
    setCompReasons([...compReasons, newCompReason.trim()]);
    setNewCompReason('');
  };

  const removeCompReason = (index: number) => {
    setCompReasons(compReasons.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20 shadow-2xs">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Restaurant operating settings
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure branch POS behavior, KOT routing, service charges, VAT rates, and payment methods.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PermissionGuard permission="settings:update">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-4 shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save operating settings'}</span>
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Scope Selector Card */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200/60 dark:border-slate-700">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Configuring Scope</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Apply settings tenant-wide or override for a specific branch location.</p>
            </div>
          </div>

          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="h-10 px-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-colors min-w-[240px]"
          >
            <option value="TENANT_DEFAULT">🌐 Tenant-wide Defaults (All Branches)</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                📍 Branch: {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Settings Grid */}
      {loading ? (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-16 flex flex-col items-center justify-center">
          <Spinner className="w-8 h-8 text-slate-900 dark:text-white mb-2" />
          <span className="text-xs text-slate-500">Loading branch configuration...</span>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Card 1: Core POS Workflow Toggles */}
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex items-center gap-2.5">
                <LayoutGrid className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">POS Workflows & Channels</h3>
              </div>
            </div>

            <CardContent className="p-6 space-y-4">
              {/* Table Management */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50/80 dark:bg-slate-800/30 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="space-y-0.5">
                  <Label htmlFor="table-mgmt" className="text-xs font-bold text-slate-900 dark:text-white block cursor-pointer">
                    Dining Room & Floor Plan
                  </Label>
                  <p className="text-[11px] text-slate-400">Enable physical table layout, seating, and live occupancy grid</p>
                </div>
                <Switch
                  id="table-mgmt"
                  checked={config.table_management_enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, table_management_enabled: checked })}
                />
              </div>

              {/* Kitchen KOT */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50/80 dark:bg-slate-800/30 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="space-y-0.5">
                  <Label htmlFor="kot-mgmt" className="text-xs font-bold text-slate-900 dark:text-white block cursor-pointer">
                    Kitchen Order Ticket (KOT)
                  </Label>
                  <p className="text-[11px] text-slate-400">Enable "Fire KOT" action and route tickets to KDS stations</p>
                </div>
                <Switch
                  id="kot-mgmt"
                  checked={config.kot_enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, kot_enabled: checked })}
                />
              </div>

              {/* Takeaway Service */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50/80 dark:bg-slate-800/30 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="space-y-0.5">
                  <Label htmlFor="takeaway-mgmt" className="text-xs font-bold text-slate-900 dark:text-white block cursor-pointer">
                    Takeaway / Counter Service
                  </Label>
                  <p className="text-[11px] text-slate-400">Allow takeaway order creation in POS terminal</p>
                </div>
                <Switch
                  id="takeaway-mgmt"
                  checked={config.takeaway_enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, takeaway_enabled: checked })}
                />
              </div>

              {/* Delivery Service */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50/80 dark:bg-slate-800/30 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="space-y-0.5">
                  <Label htmlFor="delivery-mgmt" className="text-xs font-bold text-slate-900 dark:text-white block cursor-pointer">
                    Delivery Service Dispatch
                  </Label>
                  <p className="text-[11px] text-slate-400">Allow delivery order dispatch and driver assignment</p>
                </div>
                <Switch
                  id="delivery-mgmt"
                  checked={config.delivery_enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, delivery_enabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Financials, Taxes & Service Charges */}
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex items-center gap-2.5">
                <Percent className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Taxes & Service Fees</h3>
              </div>
            </div>

            <CardContent className="p-6 space-y-4">
              {/* Service Charge Toggle & Rate */}
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/30 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sc-mgmt" className="text-xs font-bold text-slate-900 dark:text-white block cursor-pointer">
                      Service Charge Calculation
                    </Label>
                    <p className="text-[11px] text-slate-400">Automatically calculate dining service fee on bills</p>
                  </div>
                  <Switch
                    id="sc-mgmt"
                    checked={config.service_charge_enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, service_charge_enabled: checked })}
                  />
                </div>

                {config.service_charge_enabled && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Service Fee Percentage (%):</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={config.service_charge_pct}
                      onChange={(e) => setConfig({ ...config, service_charge_pct: e.target.value })}
                      className="w-24 h-8 rounded-lg text-xs font-mono font-bold text-right"
                    />
                  </div>
                )}
              </div>

              {/* VAT / Tax Rate */}
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/30 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-900 dark:text-white block">
                    Mushak VAT / Tax Rate (%)
                  </Label>
                  <p className="text-[11px] text-slate-400">Default tax computed on check settlement</p>
                </div>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={config.tax_rate_pct}
                  onChange={(e) => setConfig({ ...config, tax_rate_pct: e.target.value })}
                  className="w-24 h-8 rounded-lg text-xs font-mono font-bold text-right"
                />
              </div>

              {/* Default Order Type */}
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/30 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-900 dark:text-white block">
                    Default Terminal Mode
                  </Label>
                  <p className="text-[11px] text-slate-400">Initial active tab when POS terminal opens</p>
                </div>
                <select
                  value={config.default_order_type}
                  onChange={(e) => setConfig({ ...config, default_order_type: e.target.value })}
                  className="h-8 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="DINE_IN">Dine-in</option>
                  <option value="TAKEAWAY">Takeaway</option>
                  <option value="DELIVERY">Delivery</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Accepted POS Payment Methods */}
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden md:col-span-2">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active POS Payment Channels</h3>
              </div>
            </div>

            <CardContent className="p-6 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click any payment method to enable or disable it on cashiers' settlement screens:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {(masterPaymentMethods.length > 0
                  ? masterPaymentMethods.map((m) => ({
                      id: m.code,
                      label: `${m.label}${m.label_bn ? ` (${m.label_bn})` : ''}`,
                    }))
                  : [
                      { id: 'CASH', label: 'Cash Currency' },
                      { id: 'CARD', label: 'Credit / Debit Card' },
                      { id: 'BKASH', label: 'bKash MFS' },
                      { id: 'NAGAD', label: 'Nagad MFS' },
                      { id: 'ROCKET', label: 'Rocket DBBL' },
                    ]
                ).map((method) => {
                  const isSelected = paymentMethods.includes(method.id);
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => togglePaymentMethod(method.id)}
                      className={cn(
                        "p-4 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer select-none",
                        isSelected
                          ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/60 shadow-xs"
                          : "border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 opacity-60 hover:opacity-100"
                      )}
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{method.label}</span>
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border",
                        isSelected
                          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/50"
                          : "text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-emerald-500" : "bg-slate-400")}></span>
                        {isSelected ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Audit & Exception Reasons */}
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden md:col-span-2">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Audit Reason Codes (Void & Comp Discretion)</h3>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Void Reasons */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Order / Item Void Reasons
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newVoidReason}
                      onChange={(e) => setNewVoidReason(e.target.value)}
                      placeholder="e.g. Guest Changed Order"
                      className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addVoidReason(); } }}
                    />
                    <Button
                      type="button"
                      onClick={addVoidReason}
                      className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {voidReasons.map((r, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300">
                        {r}
                        <button type="button" onClick={() => removeVoidReason(i)} className="text-slate-400 hover:text-rose-600 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Comp Reasons */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Complimentary (Comp) Discount Reasons
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newCompReason}
                      onChange={(e) => setNewCompReason(e.target.value)}
                      placeholder="e.g. Management Courtesy"
                      className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCompReason(); } }}
                    />
                    <Button
                      type="button"
                      onClick={addCompReason}
                      className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {compReasons.map((r, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300">
                        {r}
                        <button type="button" onClick={() => removeCompReason(i)} className="text-slate-400 hover:text-rose-600 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
