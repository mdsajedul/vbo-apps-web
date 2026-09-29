"use client";

import React, { useState, useEffect } from "react";
import { connectApi, ConnectLead } from "@/lib/connect-api";
import { toast } from "sonner";
import {
  Target,
  Plus,
  RefreshCw,
  DollarSign,
  User,
  Phone,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Loader2,
  Trash2,
  TrendingUp,
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

const STAGES = [
  { id: "NEW", label: "New Inbound", color: "border-blue-500/40 bg-blue-50/20 dark:bg-blue-950/20" },
  { id: "CONTACTED", label: "Contacted", color: "border-purple-500/40 bg-purple-50/20 dark:bg-purple-950/20" },
  { id: "QUALIFIED", label: "Qualified Demo", color: "border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/20" },
  { id: "PROPOSAL", label: "Proposal Sent", color: "border-indigo-500/40 bg-indigo-50/20 dark:bg-indigo-950/20" },
  { id: "WON", label: "Closed / Won", color: "border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20" },
];

export default function ConnectLeadsPage() {
  const [leads, setLeads] = useState<ConnectLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState<"NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON">("NEW");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLeads = async () => {
    try {
      setRefreshing(true);
      const data = await connectApi.getLeads();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load leads:", err);
      toast.error(err.message || "Failed to load lead pipeline");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contactName.trim()) {
      toast.error("Please provide deal title and customer name");
      return;
    }

    setIsSubmitting(true);
    try {
      await connectApi.createLead({
        title: title.trim(),
        contactName: contactName.trim(),
        phone: phone.trim() || undefined,
        value: Number(value) || 0,
        currency: "BDT",
        stage,
      });

      toast.success("Lead created in pipeline");
      setShowCreateModal(false);
      setTitle("");
      setContactName("");
      setPhone("");
      setValue("");
      await fetchLeads();
    } catch (err: any) {
      toast.error(err.message || "Failed to create lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveStage = async (leadId: string, currentStage: string) => {
    const stageOrder = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON"];
    const currentIndex = stageOrder.indexOf(currentStage);
    if (currentIndex >= stageOrder.length - 1) return;
    const nextStage = stageOrder[currentIndex + 1];

    try {
      await connectApi.updateLeadStage(leadId, nextStage);
      toast.success(`Deal moved to ${nextStage}`);
      await fetchLeads();
    } catch (err: any) {
      toast.error(err.message || "Could not move deal stage");
    }
  };

  const totalValue = leads.reduce((acc, l) => acc + (Number(l.value) || 0), 0);
  const wonValue = leads
    .filter((l) => l.stage === "WON")
    .reduce((acc, l) => acc + (Number(l.value) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-pink-600/10 text-pink-600 dark:text-pink-400">
              <Target className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Lead Funnel & Sales Pipeline
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
              Kanban Board
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track prospective deals from incoming WhatsApp and web chats through qualification to closed sales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeads}
            disabled={refreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="text-xs bg-pink-600 hover:bg-pink-500 text-white gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1">Pipeline Deals</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {leads.length} Deals
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Across all pipeline stages</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1">Total Pipeline Value</span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
            ৳{totalValue.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Estimated opportunity</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1">Closed Won Revenue</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ৳{wonValue.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Confirmed sales</span>
        </div>
      </div>

      {/* Kanban Board Columns */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-pink-600 mb-2" />
          <span className="text-xs font-medium">Loading pipeline board...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-start">
          {STAGES.map((col) => {
            const colLeads = leads.filter((l) => (l.stage || "NEW") === col.id);
            const colTotal = colLeads.reduce((acc, l) => acc + (Number(l.value) || 0), 0);

            return (
              <div
                key={col.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-3 min-h-[450px] flex flex-col justify-between"
              >
                <div>
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                        {col.label}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                        {colLeads.length}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      ৳{colTotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Deals Stack */}
                  <div className="space-y-2">
                    {colLeads.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-[11px] italic">
                        No deals here
                      </div>
                    ) : (
                      colLeads.map((deal) => {
                        const dealId = deal.id || deal._id || "";
                        return (
                          <div
                            key={dealId}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 shadow-sm space-y-2 hover:border-pink-500/30 transition-all group"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-1">
                                {deal.title}
                              </span>
                              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                ৳{(Number(deal.value) || 0).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <User className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{deal.contactName}</span>
                            </div>

                            {deal.phone && (
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                                <Phone className="w-2.5 h-2.5 text-slate-400" />
                                <span>{deal.phone}</span>
                              </div>
                            )}

                            {col.id !== "WON" && (
                              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-end">
                                <button
                                  onClick={() => handleMoveStage(dealId, col.id)}
                                  className="text-[10px] font-bold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-0.5"
                                >
                                  <span>Move Next</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStage(col.id as any);
                    setShowCreateModal(true);
                  }}
                  className="w-full mt-3 py-1.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-center gap-1 transition-all"
                >
                  <Plus className="w-3 h-3" /> Add Deal
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE LEAD MODAL */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-pink-600" />
              <span>Create New Deal / Lead</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Add a qualified customer deal to your sales funnel.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateLead} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <Label htmlFor="lead-title" className="text-xs font-semibold">
                Deal Name / Opportunity
              </Label>
              <Input
                id="lead-title"
                type="text"
                placeholder="e.g. 50x Bulk Grocery Supply"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lead-contact" className="text-xs font-semibold">
                Customer Name
              </Label>
              <Input
                id="lead-contact"
                type="text"
                placeholder="e.g. Rafiqul Islam"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="lead-phone" className="text-xs font-semibold">
                  Phone (WhatsApp)
                </Label>
                <Input
                  id="lead-phone"
                  type="text"
                  placeholder="+88017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="lead-value" className="text-xs font-semibold">
                  Deal Value (BDT ৳)
                </Label>
                <Input
                  id="lead-value"
                  type="number"
                  placeholder="25000"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="lead-stage" className="text-xs font-semibold">
                Initial Pipeline Stage
              </Label>
              <select
                id="lead-stage"
                value={stage}
                onChange={(e) => setStage(e.target.value as any)}
                className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-xs text-slate-900 dark:text-slate-100 shadow-sm"
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
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
                className="text-xs bg-pink-600 hover:bg-pink-500 text-white gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Save Deal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
