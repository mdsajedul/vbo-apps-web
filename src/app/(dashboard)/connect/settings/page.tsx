"use client";

import React, { useState, useEffect } from "react";
import { connectApi, ConnectChannelSettings } from "@/lib/connect-api";
import { toast } from "sonner";
import {
  Sliders,
  MessageSquare,
  Mail,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ConnectSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // WhatsApp form
  const [wabaId, setWabaId] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accessToken, setAccessToken] = useState("");

  // SMTP form
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:8080/webhooks/whatsapp`
      : "http://localhost:8080/webhooks/whatsapp";
  const verifyToken = "vbo_connect_webhook_verify_token";

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await connectApi.getChannelSettings();
      if (data?.whatsapp) {
        setWabaId(data.whatsapp.wabaId || "");
        setPhoneNumberId(data.whatsapp.phoneNumberId || "");
        setPhoneNumber(data.whatsapp.phoneNumber || "");
      }
      if (data?.smtp) {
        setSmtpHost(data.smtp.host || "");
        setSmtpPort(String(data.smtp.port || 587));
        setSmtpUser(data.smtp.username || "");
        setFromEmail(data.smtp.fromEmail || "");
        setFromName(data.smtp.fromName || "");
      }
    } catch (err: any) {
      console.warn("Could not load existing channel settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      toast.loading("Saving Meta WhatsApp configuration...", { id: "save-wa" });
      await connectApi.updateWhatsAppConfig({
        wabaId,
        phoneNumberId,
        phoneNumber,
        accessToken: accessToken || undefined,
      });
      toast.success("WhatsApp Cloud API settings saved successfully", { id: "save-wa" });
    } catch (err: any) {
      toast.error(err.message || "Failed to save WhatsApp settings", { id: "save-wa" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      toast.loading("Saving SMTP configuration...", { id: "save-smtp" });
      await connectApi.updateSmtpConfig({
        host: smtpHost,
        port: Number(smtpPort) || 587,
        username: smtpUser,
        password: smtpPassword || undefined,
        fromEmail,
        fromName,
      });
      toast.success("SMTP Email settings saved successfully", { id: "save-smtp" });
    } catch (err: any) {
      toast.error(err.message || "Failed to save SMTP settings", { id: "save-smtp" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-purple-600/10 text-purple-600 dark:text-purple-400">
              <Sliders className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Connect Channel & API Settings
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              Cloud Gateway
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure Meta WhatsApp Cloud API credentials, webhook endpoints, and SMTP newsletter servers.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchSettings}
          disabled={loading}
          className="text-xs gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Reload
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WhatsApp Cloud API Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <form onSubmit={handleSaveWhatsApp} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Meta WhatsApp Cloud API
                </h2>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Official API
              </span>
            </div>

            <div className="space-y-1">
              <Label htmlFor="wa-phone-id" className="text-xs font-semibold">
                Phone Number ID
              </Label>
              <Input
                id="wa-phone-id"
                type="text"
                placeholder="e.g. 109283746592817"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="wa-waba-id" className="text-xs font-semibold">
                WABA Account ID
              </Label>
              <Input
                id="wa-waba-id"
                type="text"
                placeholder="e.g. 982736451029384"
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="wa-phone" className="text-xs font-semibold">
                Display Phone Number
              </Label>
              <Input
                id="wa-phone"
                type="text"
                placeholder="+88017XXXXXXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="wa-token" className="text-xs font-semibold">
                Permanent System User Access Token
              </Label>
              <Input
                id="wa-token"
                type="password"
                placeholder="EAA..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            {/* Webhook Endpoint Info */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 space-y-1.5 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Meta Webhook Callback URL:
              </span>
              <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-slate-500 bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                <span className="truncate">{webhookUrl}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    toast.success("Webhook URL copied");
                  }}
                  className="hover:text-blue-500 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Verify Token:</span>
                <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
                  {verifyToken}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save WhatsApp Config
            </Button>
          </form>
        </div>

        {/* SMTP Email Server Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <form onSubmit={handleSaveSmtp} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  SMTP Mail Server Configuration
                </h2>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 border border-blue-500/20">
                Broadcasts
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="smtp-host" className="text-xs font-semibold">
                  SMTP Host
                </Label>
                <Input
                  id="smtp-host"
                  type="text"
                  placeholder="smtp.gmail.com"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="smtp-port" className="text-xs font-semibold">
                  Port
                </Label>
                <Input
                  id="smtp-port"
                  type="text"
                  placeholder="587"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="smtp-user" className="text-xs font-semibold">
                Username / Email
              </Label>
              <Input
                id="smtp-user"
                type="text"
                placeholder="notifications@company.com"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="smtp-pass" className="text-xs font-semibold">
                Password / App Password
              </Label>
              <Input
                id="smtp-pass"
                type="password"
                placeholder="••••••••••••"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="from-name" className="text-xs font-semibold">
                  Sender Name
                </Label>
                <Input
                  id="from-name"
                  type="text"
                  placeholder="VBO Store"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="from-email" className="text-xs font-semibold">
                  From Email
                </Label>
                <Input
                  id="from-email"
                  type="email"
                  placeholder="no-reply@company.com"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full text-xs bg-blue-600 hover:bg-blue-500 text-white gap-1.5 mt-2"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save SMTP Config
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
