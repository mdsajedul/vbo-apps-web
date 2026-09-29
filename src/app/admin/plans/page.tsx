"use client"
import React, { useEffect, useState } from 'react';
import { platformAdminApi, superAdminApi } from '@/lib/api';
import { Plus, Loader2, Settings2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminPlansPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [activeProductId, setActiveProductId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchProductsAndData = async () => {
    setLoading(true);
    try {
      const [productsData] = await Promise.all([
        platformAdminApi.getProducts(),
      ]);
      setProducts(productsData || []);
      if (productsData?.length > 0 && !activeProductId) {
        setActiveProductId(productsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndData();
  }, []);

  const activeProduct = products.find(p => p.id === activeProductId);
  const plans = activeProduct?.plans || [];

  const handleToggleActive = async (plan: any) => {
    try {
      await platformAdminApi.updatePlan(activeProductId, plan.id, { is_active: !plan.is_active });
      await fetchProductsAndData();
    } catch (err) {
      console.error('Failed to toggle plan status', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Global SaaS Plans</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage cross-product subscriptions, features, and allowed industry verticals.</p>
        </div>
        {activeProductId && (
          <Link
            href={`/admin/plans/create?productId=${activeProductId}`}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-purple-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Plan</span>
          </Link>
        )}
      </div>

      {/* Product Tabs */}
      <div className="flex space-x-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl w-fit border border-slate-200/50 dark:border-slate-700/50">
        {products.map(p => (
          <button
            key={p.id}
            onClick={() => setActiveProductId(p.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeProductId === p.id
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm border border-slate-200/50 dark:border-slate-600/50'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Plans List Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((p: any) => {
            const priceBdtStr = Number(p.price_bdt).toFixed(2);
            
            return (
              <div
                key={p.id}
                className={`bg-white dark:bg-slate-900/60 border rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all shadow-sm ${
                  p.is_active ? 'border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-500/50' : 'border-red-300 dark:border-red-900/40 opacity-70'
                }`}
              >
                <div className="space-y-4">
                  {/* Plan Name & Status */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {p.name}
                        {p.is_trial && <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-bold">Trial</span>}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{p.code}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        p.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30' : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 border border-red-300 dark:border-red-500/30'
                      }`}
                    >
                      {p.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  {/* Vertical Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.allowed_verticals && p.allowed_verticals.length > 0 ? (
                      p.allowed_verticals.map((vert: string) => (
                        <span
                          key={vert}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                            vert === 'RESTAURANT'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : vert === 'RETAIL'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                          }`}
                        >
                          {vert === 'RESTAURANT' ? '🍽️ Restaurant' : vert === 'RETAIL' ? '🛍️ Retail' : vert}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                        🌐 Universal / None
                      </span>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-2xl font-extrabold text-slate-900 dark:text-white">৳{priceBdtStr}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">/ {p.billing_interval?.toLowerCase() || 'month'}</span>
                    </div>
                  </div>

                  {/* Limits & Features (Readonly view) */}
                  <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60 pb-1 mb-2">Quotas & Limits</div>
                    {p.quotas?.map((pq: any) => (
                      <div key={pq.id} className="flex items-center justify-between py-1">
                        <span className="text-slate-500 dark:text-slate-400">{pq.quota?.name}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{pq.limit}</span>
                      </div>
                    ))}
                    {(!p.quotas || p.quotas.length === 0) && <div className="text-slate-400 italic">No quotas defined</div>}
                    
                    <div className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60 pb-1 mb-2 mt-4">Features Included</div>
                    <div className="flex flex-wrap gap-1">
                      {p.features?.filter((f: any) => f.is_included).map((f: any) => (
                         <span key={f.id} className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2 py-1 rounded-md">
                           ✓ {f.feature?.name}
                         </span>
                      ))}
                      {(!p.features || p.features.length === 0) && <div className="text-slate-400 italic">No features defined</div>}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                  <Link
                    href={`/admin/plans/${p.id}/edit?productId=${activeProductId}`}
                    className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Edit Plan Settings"
                  >
                    <Settings2 className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleToggleActive(p)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                      p.is_active ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                    }`}
                  >
                    {p.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            );
          })}
          {plans.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              No plans configured for this product yet.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
