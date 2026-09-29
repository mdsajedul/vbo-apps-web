"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { platformAdminApi, superAdminApi } from '@/lib/api';
import { Loader2, ArrowLeft, Save, Building2, Users, Receipt, Server, Info, Target, Sparkles, Settings2, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';

export default function CreatePlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');

  const [products, setProducts] = useState<any[]>([]);
  const [masterDataVerticals, setMasterDataVerticals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [priceBdt, setPriceBdt] = useState(0);
  const [priceUsd, setPriceUsd] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isTrial, setIsTrial] = useState(false);
  const [trialDays, setTrialDays] = useState(14);
  const [allowedVerticals, setAllowedVerticals] = useState<string[]>([]);
  const [featureIds, setFeatureIds] = useState<string[]>([]);
  const [quotas, setQuotas] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, verticalsData] = await Promise.all([
          platformAdminApi.getProducts(),
          superAdminApi.getMasterData({ type: 'INDUSTRY_VERTICAL' }).catch(() => []),
        ]);
        setProducts(productsData || []);
        const activeVerts = (verticalsData || []).filter((v: any) => v.is_active);
        setMasterDataVerticals(activeVerts);
      } catch (err) {
        console.error('Failed to load products or master data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeProduct = products.find(p => p.id === productId) || products[0];

  useEffect(() => {
    if (activeProduct?.quotas && Object.keys(quotas).length === 0) {
      const initial: Record<string, number> = {};
      activeProduct.quotas.forEach((q: any) => {
        initial[q.id] = 0;
      });
      setQuotas(initial);
    }
  }, [activeProduct]);

  const toggleVertical = (vert: string) => {
    setAllowedVerticals(prev => prev.includes(vert) ? prev.filter(v => v !== vert) : [...prev, vert]);
  };

  const toggleFeature = (featId: string) => {
    setFeatureIds(prev => prev.includes(featId) ? prev.filter(id => id !== featId) : [...prev, featId]);
  };

  const handleQuotaChange = (quotaId: string, val: number) => {
    setQuotas(prev => ({ ...prev, [quotaId]: val }));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;
    setSaving(true);
    try {
      const payload = {
        name,
        code: code.trim().toUpperCase(),
        price_bdt: priceBdt,
        price_usd: priceUsd,
        is_active: isActive,
        is_trial: isTrial,
        trial_days: trialDays,
        allowed_verticals: allowedVerticals,
        feature_ids: featureIds,
        quotas: Object.entries(quotas).map(([quota_id, limit]) => ({ quota_id, limit })),
      };

      await platformAdminApi.createPlan(activeProduct.id, payload);
      router.push('/admin/plans');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create plan');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
      </div>
    );
  }

  const getQuotaIcon = (key: string) => {
    if (key.includes('branch')) return <Building2 className="w-4 h-4" />;
    if (key.includes('user')) return <Users className="w-4 h-4" />;
    if (key.includes('pos')) return <Receipt className="w-4 h-4" />;
    return <Server className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link href="/admin/plans" className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors active:scale-95">
            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Create Subscription Plan</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">For product: <strong className="text-indigo-600 dark:text-indigo-400">{activeProduct?.name}</strong></p>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-3">
          <button type="button" onClick={() => router.push('/admin/plans')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-colors">
            Cancel
          </button>
          <button onClick={handleSavePlan} disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Plan</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSavePlan} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Core Data */}
        <div className="xl:col-span-2 space-y-6">
          
          <div className="bg-white/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-5 md:p-6 rounded-2xl shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Plan Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Enterprise Pro" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-medium transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Plan Code (Unique)</label>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. ERP_ENTERPRISE" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-mono uppercase transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Monthly Price (BDT)</label>
                <input type="number" required value={priceBdt} onChange={(e) => setPriceBdt(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-medium transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Monthly Price (USD)</label>
                <input type="number" required value={priceUsd} onChange={(e) => setPriceUsd(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-medium transition-colors" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-5 md:p-6 rounded-2xl shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Target Audience (Verticals)
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">Select which business verticals can purchase this plan. Leave all unchecked for universal access.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {masterDataVerticals.map((vert) => (
                <label key={vert.code} className={`flex items-center space-x-3 text-sm font-bold cursor-pointer p-3 rounded-xl border transition-all ${allowedVerticals.includes(vert.code) ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300 hover:border-indigo-200 dark:hover:border-indigo-800'}`}>
                  <input type="checkbox" checked={allowedVerticals.includes(vert.code)} onChange={() => toggleVertical(vert.code)} className="hidden" />
                  <div className={`w-4 h-4 rounded-sm flex items-center justify-center border ${allowedVerticals.includes(vert.code) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-700'}`}>
                    {allowedVerticals.includes(vert.code) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span>{vert.icon === 'Store' ? '🛍️ ' : vert.icon === 'UtensilsCrossed' ? '🍽️ ' : ''}{vert.label}</span>
                </label>
              ))}
            </div>
          </div>

          {activeProduct?.features?.length > 0 && (
            <div className="bg-white/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-5 md:p-6 rounded-2xl shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Features & Modules
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">Select the modules that will be unlocked for tenants on this plan.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeProduct.features.map((pf: any) => {
                  const feat = pf.feature || pf;
                  const isChecked = featureIds.includes(feat.id);
                  return (
                    <label key={feat.id} className={`flex items-start space-x-3 cursor-pointer p-3 rounded-xl border transition-all ${isChecked ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/5 shadow-sm' : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-indigo-200 dark:hover:border-slate-700'}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleFeature(feat.id)} className="hidden" />
                      <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-sm flex items-center justify-center border ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                        {isChecked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div>
                        <span className={`block text-sm font-bold ${isChecked ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-300'}`}>{feat.name}</span>
                        {feat.code && <span className="block text-[10px] text-slate-500 font-mono mt-0.5">key: {feat.code}</span>}
                        {feat.description && <span className="block text-[11px] text-slate-500 mt-1 leading-relaxed">{feat.description}</span>}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Settings & Quotas */}
        <div className="space-y-6">
          
          <div className="bg-white/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-2xs space-y-5">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <Settings2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Plan Settings
            </h2>
            
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <span className="block text-sm font-bold text-slate-800 dark:text-white">Active Status</span>
                <span className="block text-[11px] font-medium text-slate-500 mt-0.5">Is this plan available for purchase?</span>
              </div>
              <div className={`w-9 h-5 rounded-full transition-colors relative ${isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="hidden" />
              </div>
            </label>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60">
              <label className="flex items-center justify-between cursor-pointer group mb-3">
                <div>
                  <span className="block text-sm font-bold text-slate-800 dark:text-white">Free Trial Mode</span>
                  <span className="block text-[11px] font-medium text-slate-500 mt-0.5">Allow users to try before buying</span>
                </div>
                <div className={`w-9 h-5 rounded-full transition-colors relative ${isTrial ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${isTrial ? 'translate-x-4' : 'translate-x-0'}`} />
                  <input type="checkbox" checked={isTrial} onChange={(e) => setIsTrial(e.target.checked)} className="hidden" />
                </div>
              </label>

              {isTrial && (
                <div className="bg-slate-50/70 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 mt-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Trial Duration (Days)</label>
                  <input type="number" min="1" value={trialDays} onChange={(e) => setTrialDays(Number(e.target.value))} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500" />
                </div>
              )}
            </div>
          </div>

          {activeProduct?.quotas?.length > 0 && (
            <div className="bg-white/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Quotas & Limits
              </h2>
              
              <div className="space-y-3">
                {activeProduct.quotas.map((q: any) => {
                  const quota = q.quota || q;
                  return (
                    <div key={quota.id} className="bg-slate-50/70 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
                      <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                        <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/50 p-1.5 rounded-lg">{getQuotaIcon(quota.key)}</span>
                        <span>{quota.name}</span>
                      </label>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="number" 
                          min="0"
                          value={quotas[quota.id] ?? 0} 
                          onChange={(e) => handleQuotaChange(quota.id, Number(e.target.value))} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors" 
                        />
                        <span className="text-[10px] text-slate-500 font-bold w-16 shrink-0 uppercase tracking-wider">{quota.unit}</span>
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 mt-1.5">Set to 0 for unlimited.</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mobile bottom CTA */}
          <div className="sm:hidden pt-4">
            <button type="submit" onClick={handleSavePlan} disabled={saving} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex justify-center items-center space-x-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Plan</span>
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
