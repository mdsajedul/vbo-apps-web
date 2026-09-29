"use client"
import React, { useEffect, useState } from 'react';
import { superAdminApi } from '@/lib/api';
import { Flag, ToggleLeft, ToggleRight, Building2, CheckCircle2, ShieldAlert, Loader2, Sparkles } from 'lucide-react';

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [tenantFlags, setTenantFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  const loadGlobalData = async () => {
    setLoading(true);
    try {
      const [flagsData, tenantsData] = await Promise.all([
        superAdminApi.getAllFeatureFlags(),
        superAdminApi.getTenants(),
      ]);
      setFlags(flagsData);
      setTenants(tenantsData);
      if (tenantsData.length > 0 && !selectedTenantId) {
        setSelectedTenantId(tenantsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load feature flag data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTenantFlags = async (tenantId: string) => {
    if (!tenantId) return;
    try {
      const tenantDetails = await superAdminApi.getTenantDetails(tenantId);
      setTenantFlags(tenantDetails.featureFlags || {});
    } catch (err) {
      console.error('Failed to load tenant flags', err);
    }
  };

  useEffect(() => {
    loadGlobalData();
  }, []);

  useEffect(() => {
    if (selectedTenantId) {
      loadTenantFlags(selectedTenantId);
    }
  }, [selectedTenantId]);

  const handleGlobalToggle = async (key: string, currentStatus: boolean) => {
    setUpdatingKey(`global-${key}`);
    try {
      await superAdminApi.toggleGlobalFlag(key, !currentStatus);
      await loadGlobalData();
      if (selectedTenantId) {
        await loadTenantFlags(selectedTenantId);
      }
    } catch (err) {
      console.error('Failed to toggle global feature flag', err);
    } finally {
      setUpdatingKey(null);
    }
  };

  const handleTenantOverrideToggle = async (key: string, currentStatus: boolean) => {
    if (!selectedTenantId) return;
    setUpdatingKey(`tenant-${key}`);
    try {
      await superAdminApi.setTenantFlagOverride(selectedTenantId, key, !currentStatus);
      await loadTenantFlags(selectedTenantId);
      await loadGlobalData();
    } catch (err) {
      console.error('Failed to set tenant flag override', err);
    } finally {
      setUpdatingKey(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Feature Flag Control Center</h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Control system module availability globally or configure custom tenant plan overrides.</p>
      </div>

      {/* Global Feature Flags Control Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Flag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Global Feature Registry
        </h2>

        {loading ? (
          <div className="flex items-center justify-center p-12 bg-white/90 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flags.map((f) => (
              <div
                key={f.id}
                className="bg-white/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl flex items-start justify-between space-x-4 shadow-2xs hover:border-indigo-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 dark:text-white text-base">{f.name}</span>
                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      key: {f.key}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{f.description || 'System module feature flag'}</p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 pt-1 font-semibold">
                    {f._count?.tenantOverrides || 0} custom tenant override(s) active
                  </p>
                </div>

                <button
                  onClick={() => handleGlobalToggle(f.key, f.is_enabled)}
                  disabled={updatingKey === `global-${f.key}`}
                  className="pt-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  title="Toggle Global Default"
                >
                  {updatingKey === `global-${f.key}` ? (
                    <Loader2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  ) : f.is_enabled ? (
                    <ToggleRight className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-300 dark:text-slate-600" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tenant Feature Overrides Matrix */}
      <div className="bg-white/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl space-y-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              Tenant Custom Feature Overrides
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select a tenant organization to override global defaults and custom license features.
            </p>
          </div>

          {/* Tenant Selector Dropdown */}
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-bold"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.slug})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Feature Switches for Selected Tenant */}
        {selectedTenantId && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {flags.map((f) => {
              const isEnabledForTenant = tenantFlags[f.key] ?? f.is_enabled;
              return (
                <div
                  key={f.id}
                  className="bg-slate-50/70 dark:bg-slate-950/80 border border-slate-200/70 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{f.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">key: {f.key}</p>
                  </div>

                  <button
                    onClick={() => handleTenantOverrideToggle(f.key, isEnabledForTenant)}
                    disabled={updatingKey === `tenant-${f.key}`}
                    className="transition-colors"
                  >
                    {updatingKey === `tenant-${f.key}` ? (
                      <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin" />
                    ) : isEnabledForTenant ? (
                      <ToggleRight className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
