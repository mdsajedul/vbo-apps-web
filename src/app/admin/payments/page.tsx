"use client"
import React, { useEffect, useState } from 'react';
import { superAdminApi } from '@/lib/api';
import {
  CreditCard,
  Plus,
  Loader2,
  Edit3,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Landmark,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

const GATEWAYS = ['STRIPE', 'BKASH', 'SSLCOMMERZ', 'NAGAD'];

export default function AdminPaymentsPage() {
  const [gateways, setGateways] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingGateway, setEditingGateway] = useState<any | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);

  // Form state
  const [gatewayName, setGatewayName] = useState('STRIPE');
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gw, rec] = await Promise.all([
        superAdminApi.getPlatformGateways(),
        superAdminApi.getPlatformPaymentRecords(),
      ]);
      setGateways(gw || []);
      setRecords(rec || []);
    } catch (err) {
      console.error('Failed to load platform payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openConfigure = (gw: any) => {
    setEditingGateway(gw);
    setGatewayName(gw?.gateway_name || 'STRIPE');
    setApiKey('');
    setSecretKey('');
    setWebhookSecret('');
    setIsLiveMode(gw?.is_live_mode || false);
    setIsEnabled(gw?.is_enabled ?? true);
    setShowSecrets(false);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !secretKey) {
      alert('API key and secret key are required.');
      return;
    }
    setSaving(true);
    try {
      await superAdminApi.configurePlatformGateway({
        gateway_name: gatewayName,
        api_key: apiKey,
        secret_key: secretKey,
        webhook_secret: webhookSecret || undefined,
        is_live_mode: isLiveMode,
        is_enabled: isEnabled,
      });
      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save gateway config');
    } finally {
      setSaving(false);
    }
  };

  const totalRevenue = records.reduce((sum, r) => sum + (r.status === 'SUCCESS' ? r.amount : 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Platform Payments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Platform-owned gateway config (collects subscription fees) and the platform revenue ledger.
          </p>
        </div>
        <button
          onClick={() => openConfigure(null)}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-purple-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Configure Gateway</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-2 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Total Subscription Revenue
          </span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">৳{(totalRevenue / 100).toFixed(2)}</span>
          <p className="text-[11px] text-slate-500">{records.length} payment record(s)</p>
        </div>
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-2 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Configured Gateways
          </span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{gateways.filter((g) => g.is_enabled).length} / {gateways.length}</span>
          <p className="text-[11px] text-slate-500">enabled platform gateways</p>
        </div>
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-2 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Not Configured
          </span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {GATEWAYS.filter((g) => !gateways.some((c) => c.gateway_name === g)).length}
          </span>
          <p className="text-[11px] text-slate-500">gateways with no platform config yet</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Gateway Configs */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Platform Gateway Configurations
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              These credentials collect <strong>subscription fees (tenant → platform)</strong>. Money lands in your account, not the tenant's.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GATEWAYS.map((g) => {
                const cfg = gateways.find((c) => c.gateway_name === g);
                return (
                  <div
                    key={g}
                    className={`border rounded-2xl p-5 flex items-start justify-between transition-all ${
                      cfg?.is_enabled
                        ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-500/5'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 dark:text-white">{g}</span>
                        {cfg ? (
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cfg.is_enabled ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                            {cfg.is_enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                            Not Configured
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                        {cfg ? (
                          <>
                            <p>API Key: <span className="font-mono text-slate-700 dark:text-slate-300">{cfg.api_key}</span></p>
                            <p>Secret: <span className="font-mono text-slate-700 dark:text-slate-300">{cfg.secret_key}</span></p>
                            <p>Webhook Secret: {cfg.has_webhook_secret ? 'configured' : 'none'}</p>
                            <p className="capitalize">Mode: {cfg.is_live_mode ? 'Live' : 'Sandbox'}</p>
                          </>
                        ) : (
                          <p>No platform credentials set. Configure to start collecting subscription fees via this gateway.</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => openConfigure(cfg)}
                      className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                      title={cfg ? 'Edit Config' : 'Configure'}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue Ledger */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Platform Billing Ledger (Subscription Revenue)
            </h3>
            {records.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No subscription payments collected yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Tenant</th>
                      <th className="p-3">Gateway</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Paid At</th>
                      <th className="p-3">Transaction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {records.map((r) => (
                      <tr key={r.id}>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          {r.tenant?.name || r.tenant_id}
                        </td>
                        <td className="p-3">{r.gateway}</td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          ৳{(r.amount / 100).toFixed(2)}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
                          }`}>
                            {r.status === 'SUCCESS' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3">{new Date(r.paid_at).toLocaleString()}</td>
                        <td className="p-3 font-mono text-[10px] text-slate-500 truncate max-w-[160px]">{r.gateway_transaction_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Configure Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingGateway ? `Edit Gateway: ${editingGateway.gateway_name}` : 'Configure Platform Gateway'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Gateway</label>
                <select
                  value={gatewayName}
                  onChange={(e) => setGatewayName(e.target.value)}
                  disabled={!!editingGateway}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 disabled:opacity-60"
                >
                  {GATEWAYS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">API Key</label>
                <input
                  type={showSecrets ? 'text' : 'password'}
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={editingGateway ? 'Leave blank to keep existing' : 'sk_live_... / sandbox key'}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Secret Key</label>
                <input
                  type={showSecrets ? 'text' : 'password'}
                  required
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder={editingGateway ? 'Leave blank to keep existing' : 'sk_...'}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Webhook Signing Secret</label>
                <input
                  type={showSecrets ? 'text' : 'password'}
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="whsec_... (optional)"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
                <span className="text-[10px] text-slate-500">Required for Stripe webhook signature verification.</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSecrets}
                    onChange={(e) => setShowSecrets(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="flex items-center gap-1">{showSecrets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />} Show secrets</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLiveMode}
                    onChange={(e) => setIsLiveMode(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Live mode</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Enabled</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-purple-600/20"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingGateway ? 'Save Changes' : 'Save Config'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
