'use client';

import { useEffect, useState } from 'react';
import { organizationsApi, masterDataApi, subscriptionsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormError } from '@/components/ui/form-error';
import { toast } from 'sonner';
import { 
  Building2, Check, Globe, Building, 
  FileText, Coins, Lock, Link2, AlertCircle 
} from 'lucide-react';
import { PageLoader } from '@/components/ui/spinner';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useLanguage } from '@/i18n';

const orgSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  slug: z.string().min(1, 'Organization slug is required'),
  default_industry_type: z.string().min(1, 'Default industry type is required'),
  bin_number: z.string().optional(),
  currency: z.string().min(1, 'Currency is required'),
});

type OrgFormValues = z.infer<typeof orgSchema>;

export default function OrganizationSettingsPage() {
  const { t } = useLanguage();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allowedIndustries, setAllowedIndustries] = useState<{ label: string; value: string }[]>([]);
  const [isSingleVertical, setIsSingleVertical] = useState(false);

  const form = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: '',
      slug: '',
      default_industry_type: '',
      bin_number: '',
      currency: 'BDT',
    }
  });

  useEffect(() => {
    async function fetchOrg() {
      try {
        const [orgsRes, subRes, verticalsRes] = await Promise.allSettled([
          organizationsApi.getAll(),
          subscriptionsApi.getMy(),
          masterDataApi.getByType('INDUSTRY_VERTICAL'),
        ]);

        let currentOrgIndustry = '';
        if (orgsRes.status === 'fulfilled' && orgsRes.value && orgsRes.value.length > 0) {
          const org = orgsRes.value[0];
          setOrgId(org.id);
          currentOrgIndustry = org.default_industry_type || '';
          form.reset({
            name: org.name || '',
            slug: org.slug || '',
            default_industry_type: currentOrgIndustry,
            bin_number: org.bin_number || '',
            currency: org.currency || 'BDT',
          });
        }

        // Determine allowed default industry types based on platform master data + plan permissions
        const allVerticals = verticalsRes.status === 'fulfilled' && Array.isArray(verticalsRes.value)
          ? verticalsRes.value
          : [];

        const planData = subRes.status === 'fulfilled' ? subRes.value?.plan : null;
        const planVerticals: string[] = planData?.allowed_verticals && planData.allowed_verticals.length > 0
          ? planData.allowed_verticals
          : (planData?.industry_type ? [planData.industry_type] : ['ALL']);

        let availableVerticals = allVerticals;
        if (!planVerticals.includes('ALL')) {
          availableVerticals = allVerticals.filter(v => planVerticals.includes(v.code));
        }

        if (availableVerticals.length === 0 && allVerticals.length > 0) {
          availableVerticals = allVerticals;
        }

        const mappedIndustries = availableVerticals.map(v => ({
          label: v.label,
          value: v.code,
        }));

        setAllowedIndustries(mappedIndustries);
        const single = mappedIndustries.length === 1;
        setIsSingleVertical(single);

        if (single) {
          form.setValue('default_industry_type', mappedIndustries[0].value);
        } else if (mappedIndustries.length > 1) {
          const existing = currentOrgIndustry || form.getValues('default_industry_type');
          if (!existing || !mappedIndustries.some(i => i.value === existing)) {
            form.setValue('default_industry_type', mappedIndustries[0].value);
          }
        }
      } catch (error) {
        console.error('Failed to fetch organization or subscription:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrg();
  }, [form]);

  const onSubmit = async (data: OrgFormValues) => {
    if (!orgId) return;
    
    setSaving(true);
    try {
      const payload = {
        ...data,
        default_industry_type: form.getValues('default_industry_type') || data.default_industry_type,
      };
      await organizationsApi.update(orgId, payload);
      toast.success('Organization profile updated successfully');
    } catch (error: any) {
      console.error('Failed to update organization:', error);
      toast.error(error.response?.data?.message || 'Failed to update organization settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!orgId) {
    return (
      <div className="space-y-6 pb-16 w-full">
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-16 text-center text-slate-500">
            {t('settings.organization.no_org')}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/20 shadow-2xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('settings.organization.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('settings.organization.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t('settings.organization.card_title')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('settings.organization.card_subtitle')}
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Organization Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('settings.organization.name_label')} <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="name" 
                    {...form.register('name')} 
                    placeholder={t('settings.organization.name_placeholder')}
                    className={`pl-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs ${
                      form.formState.errors.name ? 'border-rose-500' : ''
                    }`}
                  />
                </div>
                <FormError message={form.formState.errors.name?.message} />
              </div>

              {/* Default Industry Type */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="default_industry_type" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('settings.organization.vertical_label')} <span className="text-rose-500">*</span>
                  </Label>
                  {isSingleVertical && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-500/20">
                      <Lock className="w-2.5 h-2.5" /> {t('settings.organization.plan_locked')}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <select
                    id="default_industry_type"
                    {...form.register('default_industry_type')}
                    disabled={isSingleVertical}
                    className={`flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 transition-colors ${
                      isSingleVertical ? 'bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed opacity-80' : ''
                    }`}
                  >
                    {allowedIndustries.map(ind => (
                      <option key={ind.value} value={ind.value}>
                        {ind.label || (ind.value === 'RESTAURANT' ? t('settings.branches.vertical_restaurant') : ind.value === 'RETAIL' ? t('settings.branches.vertical_retail') : ind.value)}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {isSingleVertical
                    ? t('settings.organization.single_vertical_hint')
                    : t('settings.organization.multi_vertical_hint')}
                </p>
              </div>
              
              {/* Slug */}
              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('settings.organization.slug_label')} <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="slug" 
                    {...form.register('slug')} 
                    placeholder={t('settings.organization.slug_placeholder')}
                    className={`pl-10 rounded-xl border-slate-200 dark:border-slate-800 font-mono text-xs ${
                      form.formState.errors.slug ? 'border-rose-500' : ''
                    }`}
                  />
                </div>
                <FormError message={form.formState.errors.slug?.message} />
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {t('settings.organization.slug_hint')}
                </p>
              </div>

              {/* BIN Number */}
              <div className="space-y-1.5">
                <Label htmlFor="bin" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('settings.organization.bin_label')}
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="bin" 
                    {...form.register('bin_number')} 
                    placeholder={t('settings.organization.bin_placeholder')}
                    className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 font-mono text-xs" 
                  />
                </div>
                <FormError message={form.formState.errors.bin_number?.message} />
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {t('settings.organization.bin_hint')}
                </p>
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <Label htmlFor="currency" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('settings.organization.currency_label')} <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="currency" 
                    {...form.register('currency')} 
                    placeholder={t('settings.organization.currency_placeholder')}
                    className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 font-mono text-xs uppercase" 
                  />
                </div>
                <FormError message={form.formState.errors.currency?.message} />
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {t('settings.organization.currency_hint')}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t('settings.organization.footer_note')}
            </span>

            <PermissionGuard permission="organizations:update">
              <Button 
                type="submit" 
                disabled={saving}
                className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs flex items-center gap-2"
              >
                <Check className="w-3.5 h-3.5" />
                {saving ? t('settings.organization.saving') : t('settings.organization.btn_save')}
              </Button>
            </PermissionGuard>
          </div>
        </form>
      </Card>
    </div>
  );
}
