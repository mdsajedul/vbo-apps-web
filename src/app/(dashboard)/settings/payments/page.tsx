'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { paymentsApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormError } from '@/components/ui/form-error';
import { 
  CreditCard, Shield, Lock, Key, Check, 
  ExternalLink, Eye, EyeOff, AlertCircle 
} from 'lucide-react';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useLanguage } from '@/i18n';

// ── REAL BRAND LOGOS ─────────────────────────────────────────────────────────

function GatewayIcon({ name, className = "w-11 h-11" }: { name: string; className?: string }) {
  const iconMap: Record<string, string> = {
    BKASH: '/icons/gateways/bkash.svg',
    NAGAD: '/icons/gateways/nagad.svg',
    SSLCOMMERZ: '/icons/gateways/sslcommerz.svg',
    STRIPE: '/icons/gateways/stripe.svg',
  };

  return (
    <div className={`rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs flex-shrink-0 flex items-center justify-center p-1 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={iconMap[name]} 
        alt={name} 
        className="w-full h-full object-contain" 
      />
    </div>
  );
}

const GATEWAYS_META: Record<'BKASH' | 'SSLCOMMERZ' | 'STRIPE' | 'NAGAD', {
  name: string;
  type: string;
  currency: string;
  renderLogo: (cls?: string) => React.ReactNode;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  secretKeyLabel: string;
  secretKeyPlaceholder: string;
  docsUrl: string;
  note?: string;
}> = {
  BKASH: {
    name: 'bKash Direct Merchant',
    type: 'Mobile Financial Service (MFS)',
    currency: 'BDT',
    renderLogo: (cls) => <GatewayIcon name="BKASH" className={cls} />,
    apiKeyLabel: 'App Key / Username',
    apiKeyPlaceholder: 'e.g. bkash_app_key_prod',
    secretKeyLabel: 'Secret Key / Password',
    secretKeyPlaceholder: '••••••••••••••••',
    docsUrl: 'https://developer.bkash.com/',
    note: 'Requires a registered bKash Merchant account with Checkout Tokenized API enabled.',
  },
  NAGAD: {
    name: 'Nagad Online Pay',
    type: 'Mobile Financial Service (MFS)',
    currency: 'BDT',
    renderLogo: (cls) => <GatewayIcon name="NAGAD" className={cls} />,
    apiKeyLabel: 'Merchant ID',
    apiKeyPlaceholder: 'e.g. 680012345678',
    secretKeyLabel: 'Private Key / Password',
    secretKeyPlaceholder: '••••••••••••••••',
    docsUrl: 'https://nagad.com.bd/',
    note: 'Supports direct PG redirect and Instant IPN confirmation.',
  },
  SSLCOMMERZ: {
    name: 'SSLCommerz Aggregator',
    type: 'Cards, NetBanking & MFS',
    currency: 'BDT, USD',
    renderLogo: (cls) => <GatewayIcon name="SSLCOMMERZ" className={cls} />,
    apiKeyLabel: 'Store ID',
    apiKeyPlaceholder: 'e.g. yourstore_live',
    secretKeyLabel: 'Store Password',
    secretKeyPlaceholder: '••••••••••••••••',
    docsUrl: 'https://sslcommerz.com/developer/',
    note: 'Accepts Visa, Mastercard, AMEX, bKash, Nagad, Rocket, and 30+ bank channels.',
  },
  STRIPE: {
    name: 'Stripe Payments',
    type: 'Global Cards & Wallets',
    currency: 'USD, EUR, GBP',
    renderLogo: (cls) => <GatewayIcon name="STRIPE" className={cls} />,
    apiKeyLabel: 'Publishable Key / Account ID',
    apiKeyPlaceholder: 'pk_live_...',
    secretKeyLabel: 'Secret Key',
    secretKeyPlaceholder: 'sk_live_...',
    docsUrl: 'https://stripe.com/docs',
    note: 'Stripe handles international credit cards & Apple/Google Pay. Note: Stripe does not natively support BDT.',
  }
};

const gatewaySchema = z.object({
  gateway_name: z.enum(['BKASH', 'SSLCOMMERZ', 'STRIPE', 'NAGAD']),
  api_key: z.string().min(1, 'API Key / Store ID is required'),
  secret_key: z.string().min(1, 'Secret Key / Signature is required'),
  is_live_mode: z.boolean(),
  is_enabled: z.boolean(),
  webhook_secret: z.string().optional(),
});

type GatewayFormValues = z.infer<typeof gatewaySchema>;

export default function PaymentSettingsPage() {
  const { t } = useLanguage();
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGateway, setActiveGateway] = useState<'BKASH' | 'SSLCOMMERZ' | 'STRIPE' | 'NAGAD'>('BKASH');
  const [showSecret, setShowSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<GatewayFormValues>({
    resolver: zodResolver(gatewaySchema),
    defaultValues: {
      gateway_name: 'BKASH',
      api_key: '',
      secret_key: '',
      is_live_mode: false,
      is_enabled: true,
      webhook_secret: '',
    },
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const data = await paymentsApi.getGateways();
      setConfigs(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load payment configurations');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: GatewayFormValues) => {
    setIsSaving(true);
    try {
      await paymentsApi.configureGateway(data);
      toast.success(`${GATEWAYS_META[data.gateway_name].name} configured successfully`);
      fetchConfigs();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save gateway configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectGateway = (gw: 'BKASH' | 'SSLCOMMERZ' | 'STRIPE' | 'NAGAD') => {
    setActiveGateway(gw);
    form.setValue('gateway_name', gw);
    
    // Check if configuration already exists
    const existing = configs.find(c => c.gateway_name === gw);
    if (existing) {
      form.reset({
        gateway_name: gw,
        api_key: existing.api_key || '',
        secret_key: '',
        is_live_mode: existing.is_live_mode ?? false,
        is_enabled: existing.is_enabled ?? true,
        webhook_secret: existing.webhook_secret || '',
      });
    } else {
      form.reset({
        gateway_name: gw,
        api_key: '',
        secret_key: '',
        is_live_mode: false,
        is_enabled: true,
        webhook_secret: '',
      });
    }
  };

  const currentMeta = GATEWAYS_META[activeGateway];

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/20 shadow-2xs">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('settings.payments.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('settings.payments.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Gateway Selector Cards */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
            {t('settings.payments.available_channels')}
          </div>

          {(['BKASH', 'NAGAD', 'SSLCOMMERZ', 'STRIPE'] as const).map(gw => {
            const meta = GATEWAYS_META[gw];
            const existing = configs.find(c => c.gateway_name === gw);
            const isSelected = activeGateway === gw;

            return (
              <div
                key={gw}
                onClick={() => handleSelectGateway(gw)}
                className={`w-full text-left p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-xs ring-1 ring-indigo-500/20'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {meta.renderLogo('w-11 h-11')}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {meta.name}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {meta.type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                  <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    {meta.currency}
                  </span>

                  {existing ? (
                    existing.is_enabled ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {t('settings.payments.active')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {t('settings.payments.disabled')}
                      </span>
                    )
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      {t('settings.payments.not_configured')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Gateway Configuration Card */}
        <div className="lg:col-span-8">
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {currentMeta.renderLogo('w-11 h-11')}
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                      {t('settings.payments.configure_title', { name: currentMeta.name })}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {currentMeta.type} • Currency: {currentMeta.currency}
                    </p>
                  </div>
                </div>

                <a 
                  href={currentMeta.docsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs"
                >
                  <span>{t('settings.payments.developer_docs')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {currentMeta.note && (
                <div className="flex items-start gap-2 mt-4 p-3 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                  <AlertCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  <span>{currentMeta.note}</span>
                </div>
              )}
            </div>

            {/* Form Body */}
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="p-6 space-y-5">
                
                {/* API Key / Username */}
                <div className="space-y-1.5">
                  <Label htmlFor="api_key" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {currentMeta.apiKeyLabel} <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      id="api_key" 
                      {...form.register('api_key')} 
                      placeholder={currentMeta.apiKeyPlaceholder}
                      className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 font-mono text-xs focus:ring-2 focus:ring-indigo-500" 
                    />
                  </div>
                  <FormError message={form.formState.errors.api_key?.message} />
                </div>

                {/* Secret Key */}
                <div className="space-y-1.5">
                  <Label htmlFor="secret_key" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {currentMeta.secretKeyLabel} <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      id="secret_key" 
                      type={showSecret ? "text" : "password"} 
                      {...form.register('secret_key')} 
                      placeholder={currentMeta.secretKeyPlaceholder}
                      className="pl-10 pr-10 rounded-xl border-slate-200 dark:border-slate-800 font-mono text-xs focus:ring-2 focus:ring-indigo-500" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FormError message={form.formState.errors.secret_key?.message} />
                </div>

                {/* Webhook Secret */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="webhook_secret" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {t('settings.payments.webhook_secret_label')}
                    </Label>
                  </div>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      id="webhook_secret" 
                      type={showWebhookSecret ? "text" : "password"} 
                      {...form.register('webhook_secret')} 
                      placeholder={t('settings.payments.webhook_secret_placeholder')}
                      className="pl-10 pr-10 rounded-xl border-slate-200 dark:border-slate-800 font-mono text-xs focus:ring-2 focus:ring-indigo-500" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FormError message={form.formState.errors.webhook_secret?.message} />
                </div>

                {/* Toggles Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  
                  {/* Enable Gateway Toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50/60 dark:bg-slate-800/30 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        {t('settings.payments.enable_gateway')}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {t('settings.payments.enable_gateway_hint')}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-3">
                      <input
                        type="checkbox"
                        checked={form.watch('is_enabled')}
                        onChange={(e) => form.setValue('is_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 dark:peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {/* Live / Sandbox Mode Toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50/60 dark:bg-slate-800/30 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        {t('settings.payments.live_mode')}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {form.watch('is_live_mode') ? t('settings.payments.live_mode_hint_live') : t('settings.payments.live_mode_hint_sandbox')}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-3">
                      <input
                        type="checkbox"
                        checked={form.watch('is_live_mode')}
                        onChange={(e) => form.setValue('is_live_mode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t('settings.payments.footer_note')}
                </span>

                <PermissionGuard permission="payments:create">
                  <Button 
                    type="submit" 
                    disabled={isSaving}
                    className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs flex items-center gap-2"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {isSaving ? t('settings.payments.saving') : t('settings.payments.btn_save', { name: activeGateway })}
                  </Button>
                </PermissionGuard>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
