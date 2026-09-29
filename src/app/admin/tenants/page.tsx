"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { superAdminApi, platformAdminApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { 
  Building2, Search, Filter, UserCheck, ShieldAlert, CheckCircle, PauseCircle, PlayCircle, Loader2, Plus, X, Copy, Check, Sliders, Eye,
  Globe, RefreshCw, Layers, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminTenantsPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [activeTab, setActiveTab] = useState<'platform' | 'local'>('platform');
  const [globalTenants, setGlobalTenants] = useState<any[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [syncingTenantId, setSyncingTenantId] = useState<string | null>(null);


  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Feature Flags Modal state
  const [selectedTenantForFlags, setSelectedTenantForFlags] = useState<any | null>(null);
  const [tenantFlags, setTenantFlags] = useState<Record<string, boolean>>({});
  const [allGlobalFlags, setAllGlobalFlags] = useState<any[]>([]);
  const [loadingFlags, setLoadingFlags] = useState(false);
  const [togglingFlag, setTogglingFlag] = useState<string | null>(null);

  const openFlagsModal = async (tenant: any) => {
    setSelectedTenantForFlags(tenant);
    setLoadingFlags(true);
    try {
      const [tenantDetails, globalFlags] = await Promise.all([
        superAdminApi.getTenantDetails(tenant.id),
        superAdminApi.getAllFeatureFlags()
      ]);
      setTenantFlags(tenantDetails.featureFlags || {});
      setAllGlobalFlags(globalFlags || []);
    } catch (err) {
      toast.error('Failed to load tenant feature flags');
    } finally {
      setLoadingFlags(false);
    }
  };

  const handleToggleTenantFlag = async (key: string, currentVal: boolean) => {
    if (!selectedTenantForFlags) return;
    setTogglingFlag(key);
    try {
      await superAdminApi.setTenantFlagOverride(selectedTenantForFlags.id, key, !currentVal);
      setTenantFlags((prev) => ({ ...prev, [key]: !currentVal }));
      toast.success(`Feature '${key}' updated to ${!currentVal ? 'ENABLED' : 'DISABLED'}`);
    } catch (err) {
      toast.error(`Failed to update feature '${key}'`);
    } finally {
      setTogglingFlag(null);
    }
  };

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    plan_id: '',
    initial_vertical: '',
    owner_name: '',
    owner_email: '',
    password: 'BOSPass2026!',
  });

  // Success credentials dialog
  const [createdCredentials, setCreatedCredentials] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [masterDataVerticals, setMasterDataVerticals] = useState<any[]>([]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const data = await superAdminApi.getTenants({
        search: search || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setTenants(data);
    } catch (err) {
      console.error('Failed to load tenants', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalTenants = async () => {
    setLoadingGlobal(true);
    try {
      const data = await platformAdminApi.getGlobalTenants();
      setGlobalTenants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load global platform tenants', err);
    } finally {
      setLoadingGlobal(false);
    }
  };

  useEffect(() => {
    fetchGlobalTenants();
  }, []);

  const handleSyncTenant = async (tenantId: string) => {
    setSyncingTenantId(tenantId);
    try {
      await platformAdminApi.provisionTenant(tenantId);
      toast.success('Workspace services synchronized across ERP & Connect!');
      await Promise.all([fetchGlobalTenants(), fetchTenants()]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to sync workspace');
    } finally {
      setSyncingTenantId(null);
    }
  };


  useEffect(() => {
    fetchTenants();
  }, [search, statusFilter]);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [productsList, verticals] = await Promise.all([
          platformAdminApi.getProducts(),
          superAdminApi.getMasterData({ type: 'INDUSTRY_VERTICAL' }).catch(() => []),
        ]);
        
        // Flatten plans from all products
        const allPlans = (productsList || []).reduce((acc: any[], product: any) => {
          if (product.plans && Array.isArray(product.plans)) {
             return [...acc, ...product.plans.map((p: any) => ({ ...p, productName: product.name, product_id: product.id }))];
          }
          return acc;
        }, []);
        
        setPlans(allPlans);
        setMasterDataVerticals((verticals || []).filter((v: any) => v.is_active));
      } catch (err) {
        console.error('Failed to load plans or verticals', err);
      }
    }
    loadInitialData();
  }, []);

  const handleStatusChange = async (tenantId: string, newStatus: string) => {
    setActionLoading(tenantId);
    try {
      await superAdminApi.updateTenantStatus(tenantId, newStatus);
      await fetchTenants();
      toast.success(`Tenant status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update tenant status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleImpersonate = async (tenantId: string) => {
    setActionLoading(`impersonate-${tenantId}`);
    try {
      const res = await superAdminApi.impersonateTenant(tenantId);
      setAuth(res.user, res.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to impersonate tenant');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.owner_name || !formData.owner_email || !formData.plan_id) {
      toast.error('Please fill in all required fields including Subscription Plan');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || undefined,
        plan_id: formData.plan_id.trim(),
        initial_vertical: formData.initial_vertical.trim() || undefined,
        owner_name: formData.owner_name.trim(),
        owner_email: formData.owner_email.trim(),
        password: formData.password || undefined,
      };

      const res = await platformAdminApi.provisionWorkspace(payload);
      setIsCreateModalOpen(false);
      setCreatedCredentials(res);
      fetchTenants();
      fetchGlobalTenants();
      toast.success('Tenant account provisioned successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to provision tenant account');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `🎉 Welcome to BOS Operating System!
Your Tenant Account has been provisioned:
Company: ${createdCredentials.tenant.name}
Slug: ${createdCredentials.tenant.slug}
Login URL: ${createdCredentials.credentials.login_url}
Admin Email: ${createdCredentials.credentials.email}
Temporary Password: ${createdCredentials.credentials.temporary_password}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Tenant Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage subscribed tenant accounts, provision new tenants, and impersonate access.</p>
        </div>
        <button
          onClick={() => {
            const defaultPlan = plans[0];
            let defaultVertical = '';
            if (defaultPlan) {
              const verts = defaultPlan.allowed_verticals || [];
              if (verts.length === 1 && verts[0] !== 'ALL') {
                defaultVertical = verts[0];
              } else if (defaultPlan.industry_type && defaultPlan.industry_type !== 'ALL') {
                defaultVertical = defaultPlan.industry_type;
              }
            }
            setFormData({
              name: '',
              slug: '',
              plan_id: defaultPlan?.id || '',
              initial_vertical: defaultVertical,
              owner_name: '',
              owner_email: '',
              password: 'BOSPass2026!',
            });
            setIsCreateModalOpen(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Provision New Tenant
        </button>
      </div>

      {/* Platform vs Local Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('platform')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'platform'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Unified Platform Workspaces</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-white/20 dark:bg-slate-700 text-current font-mono">
            {globalTenants.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('local')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'local'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Local ERP Database Accounts</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-white/20 dark:bg-slate-700 text-current font-mono">
            {tenants.length}
          </span>
        </button>

        <div className="ml-auto">
          <button
            onClick={() => {
              fetchGlobalTenants();
              fetchTenants();
              toast.success('Directory refreshed');
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh All"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={activeTab === 'platform' ? 'Search workspace by name, slug, or ten_ ID...' : 'Search tenant by name or slug...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="TRIAL">TRIAL</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Unified Platform Table View */}
      {activeTab === 'platform' ? (
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {loadingGlobal ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : globalTenants.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm font-semibold">
              No unified platform workspaces found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-6">Workspace / Slug</th>
                    <th className="py-3.5 px-6">Global Products & Plans</th>
                    <th className="py-3.5 px-6">Team & Owner</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {globalTenants
                    .filter((gt) => {
                      if (!search) return true;
                      const q = search.toLowerCase();
                      return gt.name.toLowerCase().includes(q) || gt.slug.toLowerCase().includes(q) || gt.id.toLowerCase().includes(q);
                    })
                    .map((gt) => {
                      const erpSub = gt.subscriptions?.find((s: any) => s.product_id === 'erp');
                      const connectSub = gt.subscriptions?.find((s: any) => s.product_id === 'connect');
                      const ecomSub = gt.subscriptions?.find((s: any) => s.product_id === 'ecommerce');
                      const owner = gt.members?.find((m: any) => m.role === 'OWNER')?.user || gt.members?.[0]?.user;
                      const isSyncing = syncingTenantId === gt.id;

                      return (
                        <tr key={gt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                <Globe className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                  <span>{gt.name}</span>
                                  <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                                    {gt.id}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 font-mono">slug: {gt.slug}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1.5 items-center">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                                erpSub?.status === 'ACTIVE'
                                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                              }`}>
                                <span>📦 ERP:</span>
                                <span className="uppercase font-mono">{erpSub ? `${erpSub.plan_tier}` : 'None'}</span>
                              </span>

                              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                                connectSub?.status === 'ACTIVE'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                              }`}>
                                <span>💬 Connect:</span>
                                <span className="uppercase font-mono">{connectSub ? `${connectSub.plan_tier}` : 'None'}</span>
                              </span>

                              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                                ecomSub?.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                              }`}>
                                <span>🌐 Store:</span>
                                <span className="uppercase font-mono">{ecomSub ? `${ecomSub.plan_tier}` : 'Inactive'}</span>
                              </span>
                            </div>
                          </td>

                          <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-400">
                            <div className="font-semibold text-slate-900 dark:text-slate-200">{owner?.email || 'No owner email'}</div>
                            <div className="text-slate-400 dark:text-slate-500">{gt.members?.length || 0} workspace user(s)</div>
                          </td>

                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              gt.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                                : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 border border-red-300 dark:border-red-500/30'
                            }`}>
                              {gt.status}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right space-x-2">
                            <Link
                              href={`/admin/tenants/${gt.id}`}
                              className="bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center space-x-1"
                              title="View Tenant Details"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Details</span>
                            </Link>


                            <button
                              onClick={() => handleSyncTenant(gt.id)}
                              disabled={isSyncing}
                              className="bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center space-x-1"
                              title="Sync & Auto-Provision Databases"
                            >
                              {isSyncing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                              )}
                              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
      /* Local ERP Tenants Table */
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm font-semibold">No tenants found matching search criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Tenant / Org</th>
                  <th className="py-3.5 px-6">Subscription Plan</th>
                  <th className="py-3.5 px-6">Users & Orgs</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {tenants.map((t) => {
                  const isSuspended = t.status === 'SUSPENDED';
                  const isActive = t.status === 'ACTIVE';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-500/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <Link 
                              href={`/admin/tenants/${t.id}`}
                              className="font-bold text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1.5 group"
                            >
                              <span>{t.name}</span>
                            </Link>
                            <p className="text-xs text-slate-500 font-mono">slug: {t.slug}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-500/30 px-2.5 py-1 rounded-lg">
                          {t.subscription?.plan?.name || 'Standard Tier'}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-400">
                        <div className="font-semibold text-slate-900 dark:text-slate-200">{t._count?.users || 0} user account(s)</div>
                        <div className="text-slate-400 dark:text-slate-500">{t._count?.organizations || 0} organization(s)</div>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                              : isSuspended
                              ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 border border-red-300 dark:border-red-500/30'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right space-x-2">
                        <Link
                          href={`/admin/tenants/${t.id}`}
                          className="bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center space-x-1"
                          title="View Tenant Details & Quota Supervision"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Details</span>
                        </Link>

                        <button
                          onClick={() => openFlagsModal(t)}
                          className="bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center space-x-1"
                          title="Manage Tenant Features"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Features</span>
                        </button>

                        <button
                          onClick={() => handleImpersonate(t.id)}
                          disabled={actionLoading === `impersonate-${t.id}`}
                          className="bg-purple-100 dark:bg-purple-600/20 hover:bg-purple-200 dark:hover:bg-purple-600/40 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center space-x-1.5"
                          title="Impersonate Tenant"
                        >
                          {actionLoading === `impersonate-${t.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                          <span>Impersonate</span>
                        </button>

                        {isActive ? (
                          <button
                            onClick={() => handleStatusChange(t.id, 'SUSPENDED')}
                            disabled={actionLoading === t.id}
                            className="bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center space-x-1"
                          >
                            <PauseCircle className="w-3.5 h-3.5" />
                            <span>Suspend</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(t.id, 'ACTIVE')}
                            disabled={actionLoading === t.id}
                            className="bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center space-x-1"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Activate</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* --- Provision New Tenant Modal --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Provision New Tenant Account
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Company / Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Crimson Diner"
                    value={formData.name}
                    onChange={(e) => {
                      const nameVal = e.target.value;
                      const slugVal = nameVal.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                      setFormData({ ...formData, name: nameVal, slug: slugVal });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tenant Slug / Domain *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. crimson-diner"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subscription Plan *</label>
                  <select
                    required
                    value={formData.plan_id}
                    onChange={(e) => {
                      const selectedPlan = plans.find((p) => p.id === e.target.value);
                      let autoVertical = '';
                      if (selectedPlan) {
                        const verts = selectedPlan.allowed_verticals || [];
                        if (verts.length === 1 && verts[0] !== 'ALL') {
                          autoVertical = verts[0];
                        } else if (selectedPlan.industry_type && selectedPlan.industry_type !== 'ALL') {
                          autoVertical = selectedPlan.industry_type;
                        }
                      }
                      setFormData({
                        ...formData,
                        plan_id: e.target.value,
                        initial_vertical: autoVertical,
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="" disabled>Select a Plan *</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>[{p.productName}] {p.name} — ৳{p.price_monthly ? (p.price_monthly / 100).toFixed(0) : 0}/mo</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Primary Industry Vertical</label>
                  {(() => {
                    const selectedPlan = plans.find((p) => p.id === formData.plan_id);
                    const planVerts = selectedPlan?.allowed_verticals || (selectedPlan?.industry_type ? [selectedPlan.industry_type] : ['ALL']);
                    const isAll = planVerts.includes('ALL');

                    return (
                      <select
                        value={formData.initial_vertical}
                        onChange={(e) => setFormData({ ...formData, initial_vertical: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white"
                      >
                        <option value="">
                          {planVerts.length === 1 && !isAll
                            ? 'Auto-Configured by Plan'
                            : 'Auto-Detect (or Tenant Owner Chooses on First Login)'}
                        </option>
                        {masterDataVerticals
                          .filter((v) => isAll || planVerts.includes(v.code))
                          .map((v) => (
                            <option key={v.code} value={v.code}>
                              {v.icon === 'Store' ? '🛍️ ' : v.icon === 'UtensilsCrossed' ? '🍽️ ' : ''}{v.label}
                            </option>
                          ))}
                      </select>
                    );
                  })()}
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-4">
                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Initial Owner & Admin Access</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Owner Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahim Chowdhury"
                      value={formData.owner_name}
                      onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Owner Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="rahim@crimsondiner.com"
                      value={formData.owner_email}
                      onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Temporary Password</label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{creating ? 'Provisioning...' : 'Provision Tenant Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Credentials Created Box Modal --- */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Tenant Provisioned!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Copy and share these access credentials directly with the tenant owner.</p>
            </div>

            <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-left font-mono text-xs space-y-2 text-slate-800 dark:text-slate-200">
              <p><span className="text-slate-400">Company:</span> <strong className="text-purple-600 dark:text-purple-400">{createdCredentials.tenant.name}</strong></p>
              <p><span className="text-slate-400">Login URL:</span> {createdCredentials.credentials.login_url}</p>
              <p><span className="text-slate-400">Owner Email:</span> {createdCredentials.credentials.email}</p>
              <p><span className="text-slate-400">Temp Password:</span> <strong className="text-emerald-600 dark:text-emerald-400">{createdCredentials.credentials.temporary_password}</strong></p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleCopyCredentials}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Access Link & Credentials'}</span>
              </button>

              <button
                onClick={() => setCreatedCredentials(null)}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Feature Flags Override Modal --- */}
      {selectedTenantForFlags && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-500" />
                  <span>Feature Flags — {selectedTenantForFlags.name}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Override active feature toggles for this tenant independently of global defaults.
                </p>
              </div>
              <button
                onClick={() => setSelectedTenantForFlags(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {loadingFlags ? (
                <div className="flex items-center justify-center py-12 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading tenant feature flags...</span>
                </div>
              ) : allGlobalFlags.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No feature flags registered.</div>
              ) : (
                allGlobalFlags.map((flag) => {
                  const isEnabled = Boolean(tenantFlags[flag.key]);
                  const isToggling = togglingFlag === flag.key;
                  return (
                    <div
                      key={flag.key}
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-500/30 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{flag.name}</span>
                          <span className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                            {flag.key}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{flag.description || 'Module feature flag'}</p>
                      </div>

                      <button
                        onClick={() => handleToggleTenantFlag(flag.key, isEnabled)}
                        disabled={isToggling}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isEnabled
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                            : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isToggling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isEnabled ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : null}
                        <span>{isEnabled ? 'ENABLED' : 'DISABLED'}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-end">
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
