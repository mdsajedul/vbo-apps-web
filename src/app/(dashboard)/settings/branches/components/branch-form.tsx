'use client';

import { useState, useEffect, useCallback } from 'react';
import { branchesApi, organizationsApi, geoApi, masterDataApi, subscriptionsApi } from '@/lib/api';
import { useBranchStore } from '@/lib/branch-store';

const ALL_TIMEZONES = typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function'
  ? Intl.supportedValuesOf('timeZone')
  : [
      'Asia/Dhaka',
      'UTC',
      'America/New_York',
      'Europe/London',
      'Asia/Dubai',
      'Asia/Singapore',
      'Asia/Tokyo',
      'Asia/Kolkata',
      'Australia/Sydney',
    ];
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormError } from '@/components/ui/form-error';
import { toast } from 'sonner';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useLanguage } from '@/i18n';
import { 
  Building2, Store, Hash, Globe, Check, 
  Lock, Utensils, ShoppingBag, Layers, Building,
  MapPin, Navigation, Loader2
} from 'lucide-react';

const branchSchema = z.object({
  name: z.string().min(1, 'Branch name is required'),
  code: z.string().min(1, 'Branch code is required'),
  industry_type: z.string().min(1, 'Industry type is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  organization_id: z.string().min(1, 'Organization is required'),
  country_id: z.string().optional(),
  division_id: z.string().optional(),
  district_id: z.string().optional(),
  upazila_id: z.string().optional(),
  street_address: z.string().optional(),
  postal_code: z.string().optional(),
  latitude: z.any().optional(),
  longitude: z.any().optional(),
});

type BranchFormValues = z.infer<typeof branchSchema>;

interface BranchFormProps {
  branch?: any;
  onClose: () => void;
}

export default function BranchForm({ branch, onClose }: BranchFormProps) {
  const { t } = useLanguage();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [allowedIndustries, setAllowedIndustries] = useState<{ label: string; value: string }[]>([]);
  const [isSingleVertical, setIsSingleVertical] = useState(false);
  const [saving, setSaving] = useState(false);

  // Geo states
  const [countries, setCountries] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [subdistricts, setSubdistricts] = useState<any[]>([]);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSubdistricts, setLoadingSubdistricts] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const existingAddress = branch?.address;

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: branch?.name || '',
      code: branch?.code || '',
      industry_type: branch?.industry_type || '',
      timezone: branch?.timezone || 'Asia/Dhaka',
      organization_id: branch?.organization_id || '',
      country_id: existingAddress?.country_id || '',
      division_id: existingAddress?.division_id || '',
      district_id: existingAddress?.district_id || '',
      upazila_id: existingAddress?.upazila_id || '',
      street_address: existingAddress?.street_address || '',
      postal_code: existingAddress?.postal_code || '',
      latitude: existingAddress?.latitude ?? '',
      longitude: existingAddress?.longitude ?? '',
    }
  });

  const selectedCountryId = form.watch('country_id');
  const selectedCountry = countries.find(c => c.id === selectedCountryId);

  // Load initial organizations, subscription plan & countries
  useEffect(() => {
    async function loadData() {
      try {
        const [orgs, subRes, countryList, verticalsRes] = await Promise.allSettled([
          organizationsApi.getAll(),
          subscriptionsApi.getMy(),
          geoApi.getCountries(),
          masterDataApi.getByType('INDUSTRY_VERTICAL'),
        ]);

        let matchedOrgDefaultVertical = '';
        if (orgs.status === 'fulfilled') {
          const orgList = orgs.value || [];
          setOrganizations(orgList);
          const currentOrgId = form.getValues('organization_id');
          const targetOrgId = currentOrgId || (orgList.length > 0 ? orgList[0].id : null);
          if (targetOrgId) {
            if (!currentOrgId) {
              form.setValue('organization_id', targetOrgId, { shouldValidate: true });
            }
            const matchedOrg = orgList.find((o: any) => o.id === targetOrgId);
            if (matchedOrg?.default_industry_type) {
              matchedOrgDefaultVertical = matchedOrg.default_industry_type;
              if (!branch?.id && !form.getValues('industry_type')) {
                form.setValue('industry_type', matchedOrg.default_industry_type);
              }
            }
          }
        }

        // Determine allowed industry types based on platform master data + tenant plan permissions
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
          form.setValue('industry_type', mappedIndustries[0].value);
        } else if (!branch?.id) {
          if (matchedOrgDefaultVertical && mappedIndustries.some(m => m.value === matchedOrgDefaultVertical)) {
            form.setValue('industry_type', matchedOrgDefaultVertical);
          } else if (!form.getValues('industry_type') && mappedIndustries.length > 0) {
            form.setValue('industry_type', mappedIndustries[0].value);
          }
        }

        if (countryList.status === 'fulfilled') {
          const list = countryList.value || [];
          setCountries(list);

          // If no country selected, default to BD (Bangladesh) or first available
          const currentCountryId = form.getValues('country_id');
          let targetCountryId = currentCountryId;
          if (!targetCountryId && list.length > 0) {
            const bd = list.find((c: any) => c.code === 'BD');
            targetCountryId = bd ? bd.id : list[0].id;
            form.setValue('country_id', targetCountryId);
          }

          // If we have a country id, load divisions
          if (targetCountryId) {
            setLoadingDivisions(true);
            try {
              const divs = await geoApi.getDivisions(targetCountryId);
              setDivisions(divs || []);

              // Pre-load districts and upazilas if editing existing address
              const currentDivId = form.getValues('division_id');
              if (currentDivId) {
                setLoadingDistricts(true);
                const dists = await geoApi.getDistricts(currentDivId);
                setDistricts(dists || []);

                const currentDistId = form.getValues('district_id');
                if (currentDistId) {
                  setLoadingSubdistricts(true);
                  const subdist = await geoApi.getSubdistricts(currentDistId);
                  setSubdistricts(subdist || []);
                }
              }
            } finally {
              setLoadingDivisions(false);
              setLoadingDistricts(false);
              setLoadingSubdistricts(false);
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, [form, branch]);

  // Handle Country selection change
  const handleCountryChange = async (countryId: string) => {
    form.setValue('country_id', countryId);
    form.setValue('division_id', '');
    form.setValue('district_id', '');
    form.setValue('upazila_id', '');
    setDivisions([]);
    setDistricts([]);
    setSubdistricts([]);

    if (!countryId) return;

    setLoadingDivisions(true);
    try {
      const data = await geoApi.getDivisions(countryId);
      setDivisions(data || []);
    } catch (e) {
      console.error('Failed to load divisions:', e);
      toast.error('Failed to load divisions');
    } finally {
      setLoadingDivisions(false);
    }
  };

  // Handle Division selection change
  const handleDivisionChange = async (divisionId: string) => {
    form.setValue('division_id', divisionId);
    form.setValue('district_id', '');
    form.setValue('upazila_id', '');
    setDistricts([]);
    setSubdistricts([]);

    if (!divisionId) return;

    setLoadingDistricts(true);
    try {
      const data = await geoApi.getDistricts(divisionId);
      setDistricts(data || []);
    } catch (e) {
      console.error('Failed to load districts:', e);
      toast.error('Failed to load districts');
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Handle District selection change
  const handleDistrictChange = async (districtId: string) => {
    form.setValue('district_id', districtId);
    form.setValue('upazila_id', '');
    setSubdistricts([]);

    if (!districtId) return;

    setLoadingSubdistricts(true);
    try {
      const data = await geoApi.getSubdistricts(districtId);
      setSubdistricts(data || []);
    } catch (e) {
      console.error('Failed to load sub-districts:', e);
      toast.error('Failed to load sub-districts');
    } finally {
      setLoadingSubdistricts(false);
    }
  };

  // GPS Location detection
  const handleDetectLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        form.setValue('latitude', lat);
        form.setValue('longitude', lng);
        setDetectingLocation(false);
        toast.success(`GPS coordinates captured: ${lat}, ${lng}`);
      },
      (error) => {
        setDetectingLocation(false);
        console.warn('Geolocation error:', error);
        toast.error('Could not determine your GPS location. Please check browser permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onSubmit = async (values: BranchFormValues) => {
    setSaving(true);
    try {
      const payload: any = {
        name: values.name,
        code: values.code,
        industry_type: form.getValues('industry_type') || values.industry_type,
        timezone: values.timezone,
        organization_id: values.organization_id,
        country_id: values.country_id || undefined,
        division_id: values.division_id || undefined,
        district_id: values.district_id || undefined,
        upazila_id: values.upazila_id || undefined,
        street_address: values.street_address || undefined,
        postal_code: values.postal_code || undefined,
        latitude: values.latitude ? Number(values.latitude) : undefined,
        longitude: values.longitude ? Number(values.longitude) : undefined,
      };

      if (branch?.id) {
        await branchesApi.update(branch.id, payload);
        toast.success('Branch updated successfully');
      } else {
        await branchesApi.create(payload);
        toast.success('Branch created successfully');
      }
      // Instantly synchronize global branch store
      await useBranchStore.getState().fetchAccessibleBranches().catch(() => null);
      onClose();
    } catch (error: any) {
      console.error('Failed to save branch:', error);
      toast.error(error.response?.data?.message || 'Failed to save branch details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] flex flex-col p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10 flex-shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/20">
                <Store className="w-3.5 h-3.5" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {branch ? t('settings.branch_form.title_edit') : t('settings.branch_form.title_add')}
              </DialogTitle>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('settings.branch_form.subtitle')}
            </p>
          </div>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
            
            {/* Organization */}
            <div className="space-y-1.5">
              <Label htmlFor="org" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('settings.branch_form.org_label')} <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select 
                  id="org"
                  {...form.register('organization_id')}
                  onChange={(e) => {
                    const newOrgId = e.target.value;
                    form.setValue('organization_id', newOrgId, { shouldValidate: true });
                    if (!isSingleVertical && !branch?.id) {
                      const matchedOrg = organizations.find((o) => o.id === newOrgId);
                      if (matchedOrg?.default_industry_type) {
                        form.setValue('industry_type', matchedOrg.default_industry_type);
                      }
                    }
                  }}
                  className={`flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    form.formState.errors.organization_id ? 'border-rose-500' : ''
                  }`}
                >
                  <option value="">{t('settings.branch_form.org_placeholder')}</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
              <FormError message={form.formState.errors.organization_id?.message} />
            </div>

            {/* Grid: Branch Name & Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('settings.branch_form.name_label')} <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="name" 
                    {...form.register('name')} 
                    placeholder={t('settings.branch_form.name_placeholder')}
                    className={`pl-10 rounded-xl border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 ${
                      form.formState.errors.name ? 'border-rose-500' : ''
                    }`}
                  />
                </div>
                <FormError message={form.formState.errors.name?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('settings.branch_form.code_label')} <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input 
                    id="code" 
                    {...form.register('code')} 
                    placeholder={t('settings.branch_form.code_placeholder')}
                    className={`pl-8 rounded-xl border-slate-200 dark:border-slate-800 font-mono text-xs uppercase focus:ring-2 focus:ring-indigo-500 ${
                      form.formState.errors.code ? 'border-rose-500' : ''
                    }`}
                  />
                </div>
                <FormError message={form.formState.errors.code?.message} />
              </div>
            </div>

            {/* Grid: Industry Type & Timezone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Industry Type selection */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="industry_type" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('settings.branch_form.vertical_label')} <span className="text-rose-500">*</span>
                  </Label>
                  {isSingleVertical && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-200/50 dark:border-indigo-500/20">
                      <Lock className="w-2.5 h-2.5" /> {t('settings.branch_form.plan_locked')}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <select
                    id="industry_type"
                    {...form.register('industry_type')}
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
              </div>

              {/* Timezone */}
              <div className="space-y-1.5">
                <Label htmlFor="timezone" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('settings.branch_form.timezone_label')}
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    id="timezone"
                    {...form.register('timezone')}
                    className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 transition-colors"
                  >
                    {ALL_TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Geolocation & Address Section */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      {t('settings.branch_form.geo_section_title')}
                    </h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {t('settings.branch_form.geo_section_subtitle')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/60 dark:border-indigo-800/50 transition-colors"
                  title="Detect current GPS coordinates"
                >
                  {detectingLocation ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Navigation className="w-3 h-3" />
                  )}
                  <span>{detectingLocation ? t('settings.branch_form.detecting_gps') : t('settings.branch_form.btn_detect_gps')}</span>
                </button>
              </div>

              {/* 4-Tier Cascading Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Country */}
                <div className="space-y-1.5">
                  <Label htmlFor="country" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('settings.branch_form.country_label')}
                  </Label>
                  <select
                    id="country"
                    value={form.watch('country_id') || ''}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 transition-colors"
                  >
                    <option value="">{t('settings.branch_form.country_placeholder')}</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level 1: Division / State */}
                <div className="space-y-1.5">
                  <Label htmlFor="division" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {selectedCountry?.level1_label || t('settings.branch_form.division_label')}
                  </Label>
                  <select
                    id="division"
                    value={form.watch('division_id') || ''}
                    onChange={(e) => handleDivisionChange(e.target.value)}
                    disabled={loadingDivisions || divisions.length === 0}
                    className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                  >
                    <option value="">
                      {loadingDivisions ? t('common.loading') : `${t('settings.branch_form.division_placeholder')}`}
                    </option>
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.bn_name ? `(${d.bn_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level 2: District / County */}
                <div className="space-y-1.5">
                  <Label htmlFor="district" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {selectedCountry?.level2_label || t('settings.branch_form.district_label')}
                  </Label>
                  <select
                    id="district"
                    value={form.watch('district_id') || ''}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    disabled={loadingDistricts || districts.length === 0}
                    className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                  >
                    <option value="">
                      {loadingDistricts ? t('common.loading') : `${t('settings.branch_form.district_placeholder')}`}
                    </option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.bn_name ? `(${d.bn_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level 3: Upazila / Sub-district */}
                <div className="space-y-1.5">
                  <Label htmlFor="upazila" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {selectedCountry?.level3_label || t('settings.branch_form.upazila_label')}
                  </Label>
                  <select
                    id="upazila"
                    {...form.register('upazila_id')}
                    disabled={loadingSubdistricts || subdistricts.length === 0}
                    className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                  >
                    <option value="">
                      {loadingSubdistricts ? t('common.loading') : `${t('settings.branch_form.upazila_placeholder')}`}
                    </option>
                    {subdistricts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.bn_name ? `(${s.bn_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Street Address & Postal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="street_address" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('settings.branch_form.address_label')}
                  </Label>
                  <Input
                    id="street_address"
                    {...form.register('street_address')}
                    placeholder={t('settings.branch_form.address_placeholder')}
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="postal_code" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('settings.branch_form.postal_label')}
                  </Label>
                  <Input
                    id="postal_code"
                    {...form.register('postal_code')}
                    placeholder={t('settings.branch_form.postal_placeholder')}
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* GPS Coordinates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="latitude" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('settings.branch_form.lat_label')}
                  </Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    {...form.register('latitude')}
                    placeholder="23.8103"
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="longitude" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('settings.branch_form.lng_label')}
                  </Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    {...form.register('longitude')}
                    placeholder="90.4125"
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-2.5 flex-shrink-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={saving}
              className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
            >
              {t('settings.branch_form.btn_cancel')}
            </Button>
            <PermissionGuard permission={branch ? "branches:update" : "branches:create"}>
              <Button 
                type="submit" 
                disabled={saving}
                className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                {saving ? t('settings.branch_form.saving') : branch ? t('settings.branch_form.btn_save_changes') : t('settings.branch_form.btn_create')}
              </Button>
            </PermissionGuard>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
