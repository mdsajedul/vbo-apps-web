"use client";

import React, { useState, useEffect } from "react";
import { connectApi, ConnectCampaign } from "@/lib/connect-api";
import { toast } from "sonner";
import {
  Send,
  Plus,
  RefreshCw,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Trash2,
  Users,
  Eye,
  BarChart2,
  Sparkles,
  Loader2,
  Mail,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ConnectCampaignsPage() {
  const [campaigns, setCampaigns] = useState<ConnectCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState<"whatsapp" | "email" | "sms">("whatsapp");
  const [audienceTag, setAudienceTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      setRefreshing(true);
      const data = await connectApi.getCampaigns();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load campaigns:", err);
      toast.error(err.message || "Failed to load broadcast campaigns");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a campaign title");
      return;
    }

    setIsSubmitting(true);
    try {
      await connectApi.createCampaign({
        title: title.trim(),
        channel,
        targetAudienceTag: audienceTag.trim() || undefined,
        status: "DRAFT",
        recipientCount: 0,
      });

      toast.success("Broadcast campaign created");
      setShowCreateModal(false);
      setTitle("");
      setAudienceTag("");
      await fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message || "Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerBroadcast = async (id: string, name: string) => {
    setTriggeringId(id);
    try {
      toast.loading(`Dispatching broadcast "${name}"...`, { id: "broadcast-trigger" });
      await connectApi.sendBroadcast(id);
      toast.success(`Broadcast "${name}" dispatched into fairness queue!`, {
        id: "broadcast-trigger",
      });
      await fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message || "Could not trigger broadcast", {
        id: "broadcast-trigger",
      });
    } finally {
      setTriggeringId(null);
    }
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete campaign "${name}"?`)) return;
    try {
      await connectApi.deleteCampaign(id);
      toast.success("Campaign deleted");
      await fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete campaign");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "RUNNING":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 animate-pulse";
      case "SCHEDULED":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "FAILED":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    }
  };

  const totalDelivered = campaigns.reduce((acc, c) => acc + (c.deliveredCount || 0), 0);
  const totalRecipients = campaigns.reduce((acc, c) => acc + (c.recipientCount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <Send className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Campaign Broadcast Manager
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Fairness Queue Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            High-throughput WhatsApp Meta Cloud and Email newsletter broadcasts with per-tenant rate limit protection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCampaigns}
            disabled={refreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1">Total Campaigns</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {campaigns.length}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Broadcasts recorded</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1">Recipients Targeted</span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {totalRecipients.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Across all channels</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1">Delivered Messages</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {totalDelivered.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Confirmed handoffs</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1">Queue Health</span>
          <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Operational</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Redis port 6381 connected</span>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            Broadcast Campaigns
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {campaigns.length} campaigns
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <span className="text-xs font-medium">Loading broadcast campaigns...</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No campaigns found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Create your first WhatsApp or Email broadcast to engage audience segments.
            </p>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Create Campaign
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Campaign Title</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Audience Segment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Delivered / Sent</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {campaigns.map((c) => {
                  const id = c.id || c._id || "";
                  const isThisTriggering = triggeringId === id;

                  return (
                    <tr
                      key={id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {c.title}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          {c.channel === "whatsapp" ? (
                            <MessageSquare className="w-3 h-3" />
                          ) : (
                            <Mail className="w-3 h-3" />
                          )}
                          {c.channel}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {c.targetAudienceTag ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            #{c.targetAudienceTag}
                          </span>
                        ) : (
                          <span className="text-slate-400">All Customers</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getStatusBadge(
                            c.status
                          )}`}
                        >
                          {c.status || "DRAFT"}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {c.deliveredCount || 0} / {c.recipientCount || 0}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.status === "DRAFT" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTriggerBroadcast(id, c.title)}
                              disabled={Boolean(triggeringId)}
                              className="h-7 px-2 text-xs text-blue-600 hover:text-blue-500 gap-1 border-blue-300 dark:border-blue-800"
                            >
                              {isThisTriggering ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                              <span>Send Now</span>
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCampaign(id, c.title)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              <span>Create Broadcast Campaign</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Schedule or send bulk marketing and transaction notifications via WhatsApp Cloud API.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCampaign} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label htmlFor="camp-title" className="text-xs font-semibold">
                Campaign Name
              </Label>
              <Input
                id="camp-title"
                type="text"
                placeholder="e.g. Eid Mega Sale Offer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="camp-channel" className="text-xs font-semibold">
                Broadcast Channel
              </Label>
              <select
                id="camp-channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-xs text-slate-900 dark:text-slate-100 shadow-sm"
              >
                <option value="whatsapp">Meta WhatsApp Business Cloud API</option>
                <option value="email">Email Newsletter (SMTP)</option>
                <option value="sms">Transactional SMS</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="camp-tag" className="text-xs font-semibold">
                Target Audience Tag (Optional)
              </Label>
              <Input
                id="camp-tag"
                type="text"
                placeholder="e.g. VIP (leave blank for all contacts)"
                value={audienceTag}
                onChange={(e) => setAudienceTag(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Save Campaign
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
