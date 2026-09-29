"use client"

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { superAdminApi, platformAdminApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { 
  Building2, 
  ArrowLeft, 
  Users, 
  Store, 
  Package, 
  ShieldCheck, 
  KeyRound, 
  UserCheck, 
  PauseCircle, 
  PlayCircle, 
  Sliders, 
  Copy, 
  Check, 
  RefreshCw, 
  Mail, 
  Calendar, 
  Sparkles, 
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  ExternalLink,
  Briefcase,
  X,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface TenantDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function TenantDetailsPage({ params }: TenantDetailsPageProps) {
  const resolvedParams = use(params);
  const tenantId = resolvedParams.id;
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [tenant, setTenant] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'branches' | 'flags'>('users');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Feature Flags Modal / Drawer State
  const [allGlobalFlags, setAllGlobalFlags] = useState<any[]>([]);
  const [tenantFlags, setTenantFlags] = useState<Record<string, boolean>>({});
  const [togglingFlag, setTogglingFlag] = useState<string | null>(null);

  // Password Reset Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetCustomPassword, setResetCustomPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // Change Plan Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<'erp' | 'connect'>('erp');
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const openChangePlanModal = async (initialProduct: 'erp' | 'connect' = 'erp') => {
    setSelectedProduct(initialProduct);
    setIsPlanModalOpen(true);
    setLoadingProducts(true);
    try {
      const prods = await platformAdminApi.getProducts();
      setProductsList(prods || []);

      const sub = (tenant?.allSubscriptions || []).find((s: any) => s.product_id === initialProduct);
      if (sub) {
        setSelectedPlanCode(sub.plan?.code || sub.plan_tier || '');
        setSelectedStatus(sub.status || 'ACTIVE');
      } else {
        const prod = prods?.find((p: any) => p.id === initialProduct);
        setSelectedPlanCode(prod?.plans?.[0]?.code || '');
        setSelectedStatus('ACTIVE');
      }
    } catch (e) {
      console.error('Failed to load products for plan modal', e);
      toast.error('Failed to load available plans');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleProductChange = (prodId: 'erp' | 'connect') => {
    setSelectedProduct(prodId);
    const sub = (tenant?.allSubscriptions || []).find((s: any) => s.product_id === prodId);
    if (sub) {
      setSelectedPlanCode(sub.plan?.code || sub.plan_tier || '');
      setSelectedStatus(sub.status || 'ACTIVE');
    } else {
      const prod = productsList.find((p: any) => p.id === prodId);
      setSelectedPlanCode(prod?.plans?.[0]?.code || '');
      setSelectedStatus('ACTIVE');
    }
  };

  const handleSavePlan = async () => {
    const targetVboTenantId = tenant?.vbo_tenant_id || (tenantId.startsWith('ten_') ? tenantId : null);
    if (!targetVboTenantId) {
      toast.error('No VBO Platform tenant ID associated with this workspace');
      return;
    }
    if (!selectedPlanCode) {
      toast.error('Please select a plan');
      return;
    }

    setUpdatingPlan(true);
    try {
      await platformAdminApi.updateTenantSubscription(targetVboTenantId, selectedProduct, {
        plan_tier: selectedPlanCode,
        status: selectedStatus as any,
      });
      toast.success(`Subscription updated for ${selectedProduct.toUpperCase()}!`);
      setIsPlanModalOpen(false);
      await fetchTenantDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update subscription');
    } finally {
      setUpdatingPlan(false);
    }
  };

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      const [details, globalFlags] = await Promise.all([
        superAdminApi.getTenantDetails(tenantId),
        superAdminApi.getAllFeatureFlags()
      ]);

      const targetVboTenantId = details.vbo_tenant_id || (tenantId.startsWith('ten_') ? tenantId : null);
      let platformSubs: any[] = [];
      if (targetVboTenantId) {
        try {
          const res = await platformAdminApi.getTenantSubscriptions(targetVboTenantId);
          platformSubs = Array.isArray(res) ? res : (res?.subscriptions || []);
        } catch (e) {
          console.error("Failed to fetch platform subscriptions", e);
        }
      }

      details.allSubscriptions = platformSubs;

      // Merge ERP subscription plan details
      const erpSub = platformSubs.find((s: any) => s.product_id === 'erp') || platformSubs[0];
      if (erpSub && erpSub.plan) {
        details.plan = erpSub.plan;
        details.subscription = erpSub;

        const BASELINE_LIMITS: Record<string, number> = {
          max_branches: 1,
          max_users: 1,
          max_products: 50,
          max_organizations: 1,
        };

        const getQuotaInfo = (key: string) => {
          const q = erpSub.plan.quotas?.find((item: any) => item.quota?.key === key);
          if (q) {
            return {
              max: q.limit,
              unlimited: q.limit === -1,
            };
          }
          const fallback = BASELINE_LIMITS[key] ?? 1;
          return {
            max: fallback,
            unlimited: false,
          };
        };

        const qUsers = getQuotaInfo('max_users');
        const qBranches = getQuotaInfo('max_branches');
        const qOrgs = getQuotaInfo('max_organizations');
        const qProducts = getQuotaInfo('max_products');

        details.quotas = {
          users: { used: details.metrics?.userCount || 0, max: qUsers.max, unlimited: qUsers.unlimited },
          branches: { used: details.metrics?.branchCount || 0, max: qBranches.max, unlimited: qBranches.unlimited },
          organizations: { used: details.metrics?.organizationCount || 0, max: qOrgs.max, unlimited: qOrgs.unlimited },
          products: { used: details.metrics?.productCount || 0, max: qProducts.max, unlimited: qProducts.unlimited },
        };
      }

      setTenant(details);
      setTenantFlags(details.featureFlags || {});
      setAllGlobalFlags(globalFlags || []);
    } catch (err: any) {
      console.error('Failed to load tenant details', err);
      toast.error('Failed to load tenant details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchTenantDetails();
    }
  }, [tenantId]);

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading('status');
    try {
      await superAdminApi.updateTenantStatus(tenantId, newStatus);
      await fetchTenantDetails();
      toast.success(`Tenant status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update tenant status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleImpersonate = async () => {
    setActionLoading('impersonate');
    try {
      const res = await superAdminApi.impersonateTenant(tenantId);
      setAuth(res.user, res.access_token);
      toast.success(`Impersonating ${tenant.name}`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to impersonate tenant');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFlag = async (key: string, currentVal: boolean) => {
    setTogglingFlag(key);
    try {
      await superAdminApi.setTenantFlagOverride(tenantId, key, !currentVal);
      setTenantFlags((prev) => ({ ...prev, [key]: !currentVal }));
      toast.success(`Feature '${key}' updated to ${!currentVal ? 'ENABLED' : 'DISABLED'}`);
    } catch (err) {
      toast.error(`Failed to update feature '${key}'`);
    } finally {
      setTogglingFlag(null);
    }
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    const pwd = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setResetCustomPassword(pwd);
  };

  const handleExecutePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      const targetVboTenantId = tenant?.vbo_tenant_id || (tenantId.startsWith('ten_') ? tenantId : null);

      let res;
      if (targetVboTenantId) {
        // Direct call to VBO Platform via platformAdminApi
        res = await platformAdminApi.resetOwnerPassword(targetVboTenantId, resetCustomPassword.trim() || undefined);
      } else {
        // Fallback to ERP SuperAdmin API (which also proxies to Platform if auth_provider is vbo_platform)
        res = await superAdminApi.resetOwnerPassword(tenantId, resetCustomPassword.trim() || undefined);
      }
      setResetResult(res);
      toast.success('Owner password successfully reset via VBO Platform SSO!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to reset owner password');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCopyNewPassword = () => {
    if (!resetResult) return;
    const text = `🔑 VBO Tech Account Credentials
Tenant: ${tenant?.name || 'Workspace'}
Owner Email: ${resetResult.email}
New Password: ${resetResult.temporary_password}
Platform SSO Login: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400" />
        <p className="text-sm font-semibold text-slate-500">Loading Tenant Supervision Overview...</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-12 text-center space-y-4">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tenant Not Found</h2>
        <p className="text-sm text-slate-500">The requested tenant could not be retrieved.</p>
        <Link 
          href="/admin/tenants"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>
      </div>
    );
  }

  const isActive = tenant.status === 'ACTIVE';
  const isSuspended = tenant.status === 'SUSPENDED';
  const owner = tenant.owner;
  const plan = tenant.subscription?.plan;
  const quotas = tenant.quotas || {};
  const otherSubs = (tenant.allSubscriptions || []).filter((s: any) => s.product_id !== 'erp');

  const getQuotaColor = (used: number, max: number, unlimited: boolean) => {
    if (unlimited || max === 0) return 'bg-purple-500 text-purple-500';
    const percent = (used / max) * 100;
    if (percent >= 90) return 'bg-rose-500 text-rose-500';
    if (percent >= 75) return 'bg-amber-500 text-amber-500';
    return 'bg-emerald-500 text-emerald-500';
  };

  const getQuotaPercentage = (used: number, max: number, unlimited: boolean) => {
    if (unlimited || max === 0) return 100;
    const p = Math.round((used / max) * 100);
    return Math.min(p, 100);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link 
          href="/admin/tenants"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tenant Directory
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">ID: {tenant.id}</span>
        </div>
      </div>

      {/* Tenant Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold shadow-xs">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{tenant.name}</h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                    : isSuspended
                    ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 border border-red-300 dark:border-red-500/30'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                }`}
              >
                {tenant.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="font-mono">slug: {tenant.slug}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Created: {new Date(tenant.created_at).toLocaleDateString()}
              </span>
              <span>•</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {plan?.name || 'Standard Tier'}
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
          <button
            onClick={() => {
              setResetCustomPassword('');
              setResetResult(null);
              setIsResetModalOpen(true);
            }}
            className="bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <KeyRound className="w-4 h-4 text-amber-600" />
            <span>Reset Owner Password</span>
          </button>

          <button
            onClick={handleImpersonate}
            disabled={actionLoading === 'impersonate'}
            className="bg-purple-100 dark:bg-purple-600/20 hover:bg-purple-200 dark:hover:bg-purple-600/40 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <UserCheck className="w-4 h-4" />
            <span>Impersonate</span>
          </button>

          {isActive ? (
            <button
              onClick={() => handleStatusChange('SUSPENDED')}
              disabled={actionLoading === 'status'}
              className="bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <PauseCircle className="w-4 h-4 text-red-600" />
              <span>Suspend</span>
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange('ACTIVE')}
              disabled={actionLoading === 'status'}
              className="bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <PlayCircle className="w-4 h-4 text-emerald-600" />
              <span>Activate</span>
            </button>
          )}
        </div>
      </div>

      {/* Quota Supervision Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" /> Subscription Quota Supervision
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Live operational resource consumption vs tier allocation limits.</p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg">
            Tier: {plan?.name || 'Custom'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Users Quota */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">User Accounts</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  {quotas.users?.used || 0}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  / {quotas.users?.unlimited ? '∞' : quotas.users?.max || 0} max
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2.5">
                <div 
                  className={`h-full transition-all duration-500 ${
                    quotas.users?.unlimited 
                      ? 'bg-purple-500 w-full' 
                      : (quotas.users?.used / (quotas.users?.max || 1)) >= 0.9 
                      ? 'bg-rose-500' 
                      : (quotas.users?.used / (quotas.users?.max || 1)) >= 0.75 
                      ? 'bg-amber-500' 
                      : 'bg-purple-600'
                  }`}
                  style={{ width: `${getQuotaPercentage(quotas.users?.used || 0, quotas.users?.max || 1, quotas.users?.unlimited)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Utilization:</span>
              <span className="font-bold font-mono">
                {quotas.users?.unlimited ? 'Unlimited' : `${Math.round(((quotas.users?.used || 0) / (quotas.users?.max || 1)) * 100)}%`}
              </span>
            </div>
          </div>

          {/* 2. Branches Quota */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Branches</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  {quotas.branches?.used || 0}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  / {quotas.branches?.unlimited ? '∞' : quotas.branches?.max || 0} max
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2.5">
                <div 
                  className={`h-full transition-all duration-500 ${
                    quotas.branches?.unlimited 
                      ? 'bg-blue-500 w-full' 
                      : (quotas.branches?.used / (quotas.branches?.max || 1)) >= 0.9 
                      ? 'bg-rose-500' 
                      : (quotas.branches?.used / (quotas.branches?.max || 1)) >= 0.75 
                      ? 'bg-amber-500' 
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${getQuotaPercentage(quotas.branches?.used || 0, quotas.branches?.max || 1, quotas.branches?.unlimited)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Utilization:</span>
              <span className="font-bold font-mono">
                {quotas.branches?.unlimited ? 'Unlimited' : `${Math.round(((quotas.branches?.used || 0) / (quotas.branches?.max || 1)) * 100)}%`}
              </span>
            </div>
          </div>

          {/* 3. Product Catalog Quota */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Products</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  {quotas.products?.used || 0}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  / {quotas.products?.unlimited ? '∞' : quotas.products?.max || 0} max
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2.5">
                <div 
                  className={`h-full transition-all duration-500 ${
                    quotas.products?.unlimited 
                      ? 'bg-emerald-500 w-full' 
                      : (quotas.products?.used / (quotas.products?.max || 1)) >= 0.9 
                      ? 'bg-rose-500' 
                      : (quotas.products?.used / (quotas.products?.max || 1)) >= 0.75 
                      ? 'bg-amber-500' 
                      : 'bg-emerald-600'
                  }`}
                  style={{ width: `${getQuotaPercentage(quotas.products?.used || 0, quotas.products?.max || 1, quotas.products?.unlimited)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Catalog Stock:</span>
              <span className="font-bold font-mono">
                {quotas.products?.unlimited ? 'Unlimited' : `${Math.round(((quotas.products?.used || 0) / (quotas.products?.max || 1)) * 100)}%`}
              </span>
            </div>
          </div>

          {/* 4. Organizations Quota */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Organizations</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  {quotas.organizations?.used || 0}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  / {quotas.organizations?.unlimited ? '∞' : quotas.organizations?.max || 1} max
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2.5">
                <div 
                  className={`h-full transition-all duration-500 bg-teal-600`}
                  style={{ width: `${getQuotaPercentage(quotas.organizations?.used || 0, quotas.organizations?.max || 1, quotas.organizations?.unlimited)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Multi-Org Setup:</span>
              <span className="font-bold font-mono">{quotas.organizations?.used || 0} Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Owner Information & Subscription Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Owner Information Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" /> Tenant Owner Information
            </h3>
            {owner ? (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                owner.is_active 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' 
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
              }`}>
                {owner.is_active ? 'Active' : 'Inactive'}
              </span>
            ) : null}
          </div>

          {owner ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-900 dark:text-white">{owner.full_name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {owner.email}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {owner.roles?.map((r: any) => (
                    <span key={r.role?.id || r.role_id} className="text-[11px] font-bold bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-md">
                      {r.role?.name || 'Owner'}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-50 dark:border-slate-800/80">
                <span className="text-xs text-slate-400">Account ID: <span className="font-mono">{owner.id}</span></span>
                <button
                  onClick={() => {
                    setResetCustomPassword('');
                    setResetResult(null);
                    setIsResetModalOpen(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 shadow-2xs transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Reset Password</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs">
              No owner user currently assigned to this tenant account.
            </div>
          )}
        </div>

        {/* Subscription & Plan Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" /> Subscription & Tier Plan
            </h3>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  tenant.subscription?.status === 'TRIAL'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                    : tenant.subscription?.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300'
                }`}
              >
                {tenant.subscription?.status || 'ACTIVE'}
              </span>
              <button
                type="button"
                onClick={() => openChangePlanModal('erp')}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold px-2.5 py-1 flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Change Plan</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 uppercase font-semibold text-[10px]">Plan Name</p>
              <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{plan?.name || 'Standard Tier'}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-semibold text-[10px]">Billing Frequency</p>
              <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                {plan?.is_trial
                  ? `${plan.trial_days || 14}-Day Free Trial`
                  : plan?.price_bdt && Number(plan.price_bdt) > 0
                  ? `৳${plan.price_bdt} / ${(plan.billing_interval || 'monthly').toLowerCase()}`
                  : plan?.billing_interval
                  ? plan.billing_interval.charAt(0).toUpperCase() + plan.billing_interval.slice(1).toLowerCase()
                  : 'Monthly'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-semibold text-[10px]">Current Period</p>
              <p className="font-mono text-slate-700 dark:text-slate-300 mt-0.5">
                {tenant.subscription?.expires_at 
                  ? `Expires: ${new Date(tenant.subscription.expires_at).toLocaleDateString()}`
                  : tenant.subscription?.current_period_end 
                  ? new Date(tenant.subscription.current_period_end).toLocaleDateString()
                  : 'Ongoing'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-semibold text-[10px]">Allowed Verticals</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {(plan?.allowed_verticals && plan.allowed_verticals.length > 0 ? plan.allowed_verticals : ['ALL']).map((v: string) => (
                  <span key={v} className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded font-mono text-[10px] font-semibold">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Connected Ecosystem Subscriptions (e.g. VBO Connect) */}
          {otherSubs.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-purple-500" /> Connected Ecosystem Services
              </p>
              <div className="grid grid-cols-1 gap-2">
                {otherSubs.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-bold text-xs">
                        {sub.product?.name ? sub.product.name.charAt(0) : 'C'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">
                          {sub.product?.name || sub.product_id?.toUpperCase()}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {sub.plan?.name || sub.plan_tier}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300">
                        {sub.status}
                      </span>
                      {sub.expires_at ? (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Exp: {new Date(sub.expires_at).toLocaleDateString()}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openChangePlanModal(sub.product_id as any)}
                        className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 font-semibold ml-1.5 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabbed Detailed View */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 px-6 pt-3 gap-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Accounts ({tenant.users?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('branches')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'branches'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Organizations & Branches ({quotas.branches?.used || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('flags')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'flags'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Feature Flags Matrix ({allGlobalFlags.length})</span>
          </button>
        </div>

        {/* Tab 1: Users */}
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 dark:bg-slate-800/20 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                <tr>
                  <th className="py-3.5 px-6">User Name</th>
                  <th className="py-3.5 px-6">Email Address</th>
                  <th className="py-3.5 px-6">Assigned Roles</th>
                  <th className="py-3.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {tenant.users?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">No users found.</td>
                  </tr>
                ) : (
                  tenant.users?.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{u.full_name}</span>
                        {u.is_super_admin && (
                          <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950/80 px-1.5 py-0.5 rounded font-bold">
                            SUPER ADMIN
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-500 font-mono">{u.email}</td>
                      <td className="py-3.5 px-6">
                        <div className="flex flex-wrap gap-1">
                          {u.roles?.map((r: any) => (
                            <span key={r.role?.id || r.role_id} className="text-[10px] font-bold bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded">
                              {r.role?.name || 'Staff'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          u.is_active 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' 
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
                        }`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Organizations & Branches */}
        {activeTab === 'branches' && (
          <div className="p-6 space-y-6">
            {tenant.organizations?.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-8">No organizations provisioned.</p>
            ) : (
              tenant.organizations?.map((org: any) => (
                <div key={org.id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Briefcase className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{org.name}</span>
                      <span className="text-xs font-mono text-slate-400">({org.slug})</span>
                    </div>
                    <span className="text-[11px] font-semibold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 rounded-full">
                      Vertical: {org.default_industry_type || 'GENERAL'}
                    </span>
                  </div>

                  <div className="p-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Branches</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {org.branches?.length === 0 ? (
                        <p className="text-xs text-slate-400">No branches configured.</p>
                      ) : (
                        org.branches?.map((b: any) => (
                          <div key={b.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-3">
                            <Store className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{b.name}</p>
                              <p className="text-[11px] font-mono text-slate-400">Code: {b.code || 'MAIN'}</p>
                              <span className="inline-block text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                                {b.industry_type || 'RETAIL'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Feature Flags */}
        {activeTab === 'flags' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allGlobalFlags.map((flag: any) => {
                const isEnabled = tenantFlags[flag.key] ?? flag.is_enabled_globally;
                const isOverridden = tenantFlags[flag.key] !== undefined;

                return (
                  <div key={flag.key} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between bg-slate-50/40 dark:bg-slate-800/20">
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">{flag.key}</span>
                        {isOverridden && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950/80 px-1.5 py-0.2 rounded font-bold">
                            OVERRIDDEN
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{flag.description || 'Module feature flag'}</p>
                    </div>

                    <button
                      onClick={() => handleToggleFlag(flag.key, isEnabled)}
                      disabled={togglingFlag === flag.key}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* --- Reset Owner Password Modal --- */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" /> Reset Owner Password (SSO)
              </h3>
              <button 
                onClick={() => setIsResetModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {!resetResult ? (
              <form onSubmit={handleExecutePasswordReset} className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> VBO Platform Central SSO Notice
                  </div>
                  <p>Resetting the password updates the central SSO credentials in <strong>VBO Platform</strong> and immediately terminates all active refresh tokens for <strong>{owner?.email || tenant?.owner_email || 'the owner'}</strong>.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    New Password (Optional - leave blank to auto-generate)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={resetCustomPassword}
                      onChange={(e) => setResetCustomPassword(e.target.value)}
                      placeholder="e.g. TempPass2026!"
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateRandomPassword}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
                    >
                      Random
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    {resetLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>Confirm Reset</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Password Successfully Reset in VBO Platform!
                  </div>
                  <div className="space-y-1 font-mono text-xs text-slate-800 dark:text-slate-200">
                    <p><strong>Owner:</strong> {resetResult.email}</p>
                    <p><strong>New Password:</strong> <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 text-purple-600 dark:text-purple-400 font-bold">{resetResult.temporary_password}</span></p>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans pt-1">
                    The owner can now sign in immediately using these SSO credentials across VBO Platform, ERP, and connected products.
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={handleCopyNewPassword}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                  </button>
                  <button
                    onClick={() => setIsResetModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Change Subscription Plan Modal --- */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 space-y-5 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span>Change Subscription Plan</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tenant: <span className="font-semibold text-slate-700 dark:text-slate-300">{tenant.name}</span>
                </p>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Switcher Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
              <button
                type="button"
                onClick={() => handleProductChange('erp')}
                className={`px-4 py-2 text-xs font-bold uppercase rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
                  selectedProduct === 'erp'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/30'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>VBO ERP (BOS)</span>
              </button>
              <button
                type="button"
                onClick={() => handleProductChange('connect')}
                className={`px-4 py-2 text-xs font-bold uppercase rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
                  selectedProduct === 'connect'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>VBO Connect</span>
              </button>
            </div>

            {/* Body */}
            {loadingProducts ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                <span className="text-xs">Loading available subscription plans...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Select Available Plan
                  </label>
                  {(() => {
                    const activeProd = productsList.find((p: any) => p.id === selectedProduct);
                    const plans = activeProd?.plans || [];

                    if (plans.length === 0) {
                      return (
                        <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                          No plans configured for {selectedProduct.toUpperCase()}.
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {plans.map((p: any) => {
                          const isSelected = selectedPlanCode === p.code || selectedPlanCode === p.id;
                          return (
                            <div
                              key={p.id}
                              onClick={() => setSelectedPlanCode(p.code)}
                              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all space-y-2 ${
                                isSelected
                                  ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 shadow-xs'
                                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</p>
                                  <p className="text-[10px] font-mono text-slate-500">{p.code}</p>
                                </div>
                                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  isSelected ? 'border-purple-600 bg-purple-600' : 'border-slate-300 dark:border-slate-600'
                                }`}>
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </span>
                              </div>

                              <div className="text-xs font-bold text-purple-700 dark:text-purple-300">
                                {p.is_trial
                                  ? `Free Trial (${p.trial_days || 14} Days)`
                                  : Number(p.price_bdt) > 0
                                  ? `৳${p.price_bdt} / ${(p.billing_interval || 'monthly').toLowerCase()}`
                                  : 'Free'}
                              </div>

                              {p.quotas && p.quotas.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1 text-[11px] text-slate-500">
                                  {p.quotas.map((q: any) => (
                                    <span key={q.id || q.quota?.key} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">
                                      {q.quota?.name || q.quota?.key}: <strong>{q.limit === -1 ? '∞' : q.limit}</strong>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Subscription Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subscription Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="ACTIVE">ACTIVE — Normal operational status</option>
                    <option value="TRIAL">TRIAL — Free trial mode</option>
                    <option value="PAST_DUE">PAST_DUE — Payment overdue</option>
                    <option value="SUSPENDED">SUSPENDED — Locked from system operations</option>
                    <option value="CANCELLED">CANCELLED — Subscription terminated</option>
                  </select>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingPlan || loadingProducts}
                onClick={handleSavePlan}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {updatingPlan ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Save Plan Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
