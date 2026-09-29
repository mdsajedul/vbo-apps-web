"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { platformApi, PlatformSubscription } from "@/lib/platform-api";
import { toast } from "sonner";
import {
  CreditCard,
  Boxes,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  Lock,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PlanTierOption {
  tier: string;
  name: string;
  priceMonthly: string;
  priceAnnual: string;
  description: string;
  features: string[];
}

const ERP_PLAN_TIERS: PlanTierOption[] = [
  {
    tier: "STARTER",
    name: "ERP Starter",
    priceMonthly: "৳999/mo",
    priceAnnual: "৳9,990/yr",
    description: "Ideal for single retail shops starting cloud operations",
    features: [
      "1 Store / Branch",
      "Up to 3 Staff Users",
      "Retail POS Register",
      "Product Catalog & Barcodes",
      "Stock Inventory Bins",
    ],
  },
  {
    tier: "GROWTH",
    name: "ERP Growth",
    priceMonthly: "৳2,999/mo",
    priceAnnual: "৳29,990/yr",
    description: "For growing businesses and dining establishments",
    features: [
      "Up to 5 Store Branches",
      "Up to 15 Staff Users",
      "Retail POS & Restaurant KDS",
      "Double-Entry Accounting",
      "Batch & Expiry Tracking",
      "Mushak VAT & BI Analytics",
    ],
  },
  {
    tier: "ENTERPRISE",
    name: "ERP Enterprise",
    priceMonthly: "৳9,999/mo",
    priceAnnual: "৳99,990/yr",
    description: "Unlimited scale for multi-branch retail and restaurant chains",
    features: [
      "Unlimited Branches & Warehouses",
      "Unlimited Cashiers & Staff",
      "Custom Roles & Permissions",
      "API Webhooks & Export",
      "Priority 24/7 SLA Support",
    ],
  },
];

const CONNECT_PLAN_TIERS: PlanTierOption[] = [
  {
    tier: "STARTER",
    name: "Connect Starter",
    priceMonthly: "৳1,499/mo",
    priceAnnual: "৳14,990/yr",
    description: "Essential WhatsApp customer support for SMEs",
    features: [
      "1 WhatsApp Business Number",
      "Shared Omnichannel Inbox",
      "Up to 3 Support Agents",
      "1,000 Free Marketing Messages",
      "Contact Tagging & CRM Sync",
    ],
  },
  {
    tier: "GROWTH",
    name: "Connect Growth",
    priceMonthly: "৳3,999/mo",
    priceAnnual: "৳39,990/yr",
    description: "High-volume broadcast campaigns and event automations",
    features: [
      "Up to 3 Channel Numbers",
      "Unlimited Support Agents",
      "Fairness Broadcast Queue",
      "Visual Chatbot Automations",
      "POS Automated Receipt SMS",
      "Lead Pipeline Kanban",
    ],
  },
  {
    tier: "ENTERPRISE",
    name: "Connect Enterprise",
    priceMonthly: "৳11,999/mo",
    priceAnnual: "৳119,990/yr",
    description: "Dedicated infrastructure, high-throughput Meta TPM queues",
    features: [
      "Unlimited Channel Numbers",
      "Custom AI Support Agent",
      "Webhook Event Triggers",
      "Dedicated IP & Cloud Proxy",
      "Custom SLA & Dedicated Mgr",
    ],
  },
];

export default function BillingSettingsPage() {
  const { user } = useAuthStore();
  const currentTenantId = user?.vbo_tenant_id || user?.tenant_id || "";
  const [subscriptions, setSubscriptions] = useState<PlatformSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Upgrade Modal State
  const [upgradeProduct, setUpgradeProduct] = useState<"erp" | "connect" | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [updatingTier, setUpdatingTier] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    if (!currentTenantId) return;
    try {
      setRefreshing(true);
      const data = await platformApi.getSubscriptions(currentTenantId);
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load subscriptions:", err);
      toast.error(err.message || "Failed to fetch active subscriptions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [currentTenantId]);

  const erpSub = subscriptions.find((s) => s.product_id === "erp");
  const connectSub = subscriptions.find((s) => s.product_id === "connect");

  const handleUpdatePlan = async (productId: string, planTier: string) => {
    setUpdatingTier(planTier);
    try {
      toast.loading(`Updating ${productId.toUpperCase()} to ${planTier}...`, {
        id: "plan-update",
      });
      await platformApi.updateSubscription(currentTenantId, productId, {
        plan_tier: planTier,
        billing_cycle: selectedCycle,
      });

      toast.success(`Successfully updated ${productId.toUpperCase()} plan to ${planTier}!`, {
        id: "plan-update",
      });
      setUpgradeProduct(null);
      await fetchSubscriptions();
    } catch (err: any) {
      console.error("Failed to update plan:", err);
      toast.error(err.message || "Plan update could not be completed", {
        id: "plan-update",
      });
    } finally {
      setUpdatingTier(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <CreditCard className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Billing & Subscriptions
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Centralized Platform
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage plans, entitlement quotas, and commercial licensing across all your active VBO products.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSubscriptions}
            disabled={refreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
            Active Workspace
          </span>
          <span className="text-base font-bold text-slate-900 dark:text-white truncate block">
            {user?.tenant_name || "Current Organization"}
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {user?.tenant_slug ? `${user.tenant_slug}.vbotech.com` : "ID: " + currentTenantId.slice(0, 14) + "..."}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
            Active Product Subscriptions
          </span>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {subscriptions.length} Products
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Single unified monthly invoice
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
            Authentication & Security
          </span>
          <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>RS256 Central SSO Active</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Role: {user?.role || "OWNER"}
          </span>
        </div>
      </div>

      {/* Product Subscription Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
          Subscribed Products & Entitlements
        </h2>

        {/* 1. VBO ERP CARD */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  VBO ERP (Cloud BOS)
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {erpSub?.plan_tier || "GROWTH"}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {erpSub?.status || "ACTIVE"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                POS registers, product catalog, barcode printing, double-entry accounting, stock transfers, and Mushak VAT analytics.
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Retail Vertical
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Restaurant KDS
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Multi-Branch Sync
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
            <Button
              onClick={() => setUpgradeProduct("erp")}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Manage / Change Plan
            </Button>
          </div>
        </div>

        {/* 2. VBO CONNECT CARD */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  VBO Connect (Customer Hub)
                </h3>
                {connectSub ? (
                  <>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      {connectSub.plan_tier}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {connectSub.status}
                    </span>
                  </>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Ready for Activation
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                WhatsApp Business Cloud API, shared team inbox, broadcast campaign fairness queues, customer tag segments, and visual drip automations.
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Meta WhatsApp Cloud
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  POS Customer Sync
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Shared Real-Time Inbox
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
            <Button
              onClick={() => setUpgradeProduct("connect")}
              className="text-xs bg-purple-600 hover:bg-purple-500 text-white gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {connectSub ? "Manage Plan" : "Activate VBO Connect"}
            </Button>
          </div>
        </div>

        {/* 3. VBO PLATFORM CARD */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  VBO Platform Identity & Multi-Tenancy
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  INCLUDED
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                Central identity provider, RS256 JWKS token issuance, Google OAuth federation, tenant isolation, and automated cross-service provisioning.
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 italic">Always Active</span>
        </div>
      </div>

      {/* PLAN SELECTION MODAL */}
      <Dialog
        open={Boolean(upgradeProduct)}
        onOpenChange={(open) => !open && setUpgradeProduct(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span>
                Select {upgradeProduct === "erp" ? "VBO ERP" : "VBO Connect"} Plan Tier
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Upgrade or modify your plan tier. New feature entitlements are automatically updated in your JWT token.
            </DialogDescription>
          </DialogHeader>

          {/* Billing Cycle Switch */}
          <div className="flex justify-center my-2">
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <button
                onClick={() => setSelectedCycle("MONTHLY")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  selectedCycle === "MONTHLY"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setSelectedCycle("ANNUAL")}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  selectedCycle === "ANNUAL"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>Annual Billing</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-1 rounded">
                  2 Months Free
                </span>
              </button>
            </div>
          </div>

          {/* Tier Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            {(upgradeProduct === "erp" ? ERP_PLAN_TIERS : CONNECT_PLAN_TIERS).map(
              (plan) => {
                const isCurrent =
                  (upgradeProduct === "erp" && erpSub?.plan_tier === plan.tier) ||
                  (upgradeProduct === "connect" && connectSub?.plan_tier === plan.tier);
                const isThisUpdating = updatingTier === plan.tier;

                return (
                  <div
                    key={plan.tier}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isCurrent
                        ? "border-blue-500 bg-blue-50/40 dark:bg-blue-500/10 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {plan.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-600 text-white">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-black text-slate-900 dark:text-white mb-1">
                        {selectedCycle === "MONTHLY" ? plan.priceMonthly : plan.priceAnnual}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 min-h-[32px]">
                        {plan.description}
                      </p>
                      <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                        {plan.features.map((feat, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleUpdatePlan(upgradeProduct!, plan.tier)}
                      disabled={Boolean(updatingTier) || isCurrent}
                      className={`w-full mt-4 text-xs font-bold ${
                        isCurrent
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-400"
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                      }`}
                    >
                      {isThisUpdating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isCurrent ? (
                        "Active Plan"
                      ) : (
                        `Select ${plan.tier}`
                      )}
                    </Button>
                  </div>
                );
              }
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
