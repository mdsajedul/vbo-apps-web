"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { platformApi, PlatformTenant } from "@/lib/platform-api";
import { toast } from "sonner";
import {
  Building2,
  Palette,
  Globe,
  Save,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function WorkspaceSettingsPage() {
  const { user } = useAuthStore();
  const currentTenantId = user?.vbo_tenant_id || user?.tenant_id || "";
  const [tenant, setTenant] = useState<PlatformTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [brandName, setBrandName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563EB");
  const [accentColor, setAccentColor] = useState("#4F46E5");
  const [logoUrl, setLogoUrl] = useState("");
  const [currency, setCurrency] = useState("BDT");
  const [timezone, setTimezone] = useState("Asia/Dhaka");
  const [country, setCountry] = useState("BD");

  const fetchTenant = async () => {
    if (!currentTenantId) return;
    try {
      setLoading(true);
      const data = await platformApi.getTenant(currentTenantId);
      setTenant(data);
      setBrandName(data.brand_name || data.name || "");
      setPrimaryColor(data.primary_color || "#2563EB");
      setAccentColor(data.accent_color || "#4F46E5");
      setLogoUrl(data.logo_url || "");
      setCurrency(data.currency || "BDT");
      setTimezone(data.timezone || "Asia/Dhaka");
      setCountry(data.country || "BD");
    } catch (err: any) {
      console.error("Failed to load workspace settings:", err);
      toast.error(err.message || "Failed to load workspace details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, [currentTenantId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      toast.loading("Saving workspace configuration...", { id: "save-ws" });

      await Promise.all([
        platformApi.updateBranding(currentTenantId, {
          brand_name: brandName,
          primary_color: primaryColor,
          accent_color: accentColor,
          logo_url: logoUrl || undefined,
        }),
        platformApi.updateRegionalSettings(currentTenantId, {
          currency,
          timezone,
          country,
        }),
      ]);

      toast.success("Workspace settings updated successfully!", { id: "save-ws" });
      await fetchTenant();
    } catch (err: any) {
      console.error("Save failed:", err);
      toast.error(err.message || "Could not save workspace settings", { id: "save-ws" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Workspace & Organization Settings
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure white-label branding, regional settings, currency, and multi-tenant identifiers.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchTenant}
          disabled={loading}
          className="text-xs gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Reload
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Branding Section */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Palette className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Brand Identity & Theme
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="brand-name" className="text-xs font-semibold">
                Brand / Display Name
              </Label>
              <Input
                id="brand-name"
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Acme Retailers"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="logo-url" className="text-xs font-semibold">
                Logo URL (Optional)
              </Label>
              <Input
                id="logo-url"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="primary-color" className="text-xs font-semibold">
                Primary Brand Color
              </Label>
              <div className="flex items-center gap-2">
                <input
                  id="primary-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-8 rounded cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="accent-color" className="text-xs font-semibold">
                Accent Color
              </Label>
              <div className="flex items-center gap-2">
                <input
                  id="accent-color"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-10 h-8 rounded cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                />
                <Input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Regional Section */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Globe className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Regional & Fiscal Settings
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="currency" className="text-xs font-semibold">
                Operating Currency
              </Label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-xs text-slate-900 dark:text-slate-100 shadow-sm"
              >
                <option value="BDT">BDT (৳) — Bangladeshi Taka</option>
                <option value="USD">USD ($) — US Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
                <option value="GBP">GBP (£) — British Pound</option>
                <option value="INR">INR (₹) — Indian Rupee</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="timezone" className="text-xs font-semibold">
                Timezone
              </Label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-xs text-slate-900 dark:text-slate-100 shadow-sm"
              >
                <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                <option value="Europe/London">Europe/London (GMT+0)</option>
                <option value="America/New_York">America/New_York (GMT-5)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-xs font-semibold">
                Primary Country
              </Label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-xs text-slate-900 dark:text-slate-100 shadow-sm"
              >
                <option value="BD">Bangladesh</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="AE">United Arab Emirates</option>
                <option value="SG">Singapore</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white gap-1.5 px-6"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
