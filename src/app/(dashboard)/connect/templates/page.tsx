"use client";

import React, { useState, useEffect } from "react";
import { connectApi, ConnectTemplate } from "@/lib/connect-api";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  RefreshCw,
  MessageSquare,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Sparkles,
  Loader2,
  Layers,
  Copy,
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

export default function ConnectTemplatesPage() {
  const [templates, setTemplates] = useState<ConnectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "whatsapp" | "email">("all");

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"whatsapp" | "email">("whatsapp");
  const [category, setCategory] = useState<"MARKETING" | "UTILITY" | "AUTHENTICATION">("MARKETING");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTemplates = async () => {
    try {
      setRefreshing(true);
      const data = await connectApi.getTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load templates:", err);
      toast.error(err.message || "Failed to load templates");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) {
      toast.error("Please provide a template name and message content");
      return;
    }

    setIsSubmitting(true);
    try {
      await connectApi.createTemplate({
        name: name.trim().toLowerCase().replace(/\s+/g, "_"),
        type,
        category,
        body: body.trim(),
        status: "APPROVED",
      });

      toast.success("Template created successfully");
      setShowCreateModal(false);
      setName("");
      setBody("");
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Failed to create template");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id: string, templateName: string) => {
    if (!confirm(`Delete template "${templateName}"?`)) return;
    try {
      await connectApi.deleteTemplate(id);
      toast.success("Template deleted");
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete template");
    }
  };

  const filtered = templates.filter((t) => {
    if (activeFilter === "all") return true;
    return t.type === activeFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Message & Email Templates
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Meta HSM Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Design WhatsApp Business Cloud HSM pre-approved templates and responsive email layouts with variable insertion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTemplates}
            disabled={refreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {[
          { id: "all", label: "All Templates" },
          { id: "whatsapp", label: "WhatsApp HSM" },
          { id: "email", label: "Email Layouts" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === tab.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <span className="text-xs font-medium">Loading templates...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No templates found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create your first Meta approved WhatsApp template or email broadcast blueprint.
          </p>
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Create Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => {
            const id = t.id || t._id || "";
            return (
              <div
                key={id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-indigo-400/50 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {t.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          {t.type}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                          {t.category || "UTILITY"}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Approved
                    </span>
                  </div>

                  {/* Body Preview with Variable Tokens */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {t.body}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(t.body);
                      toast.success("Template copied to clipboard");
                    }}
                    className="flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Text</span>
                  </button>

                  <button
                    onClick={() => handleDeleteTemplate(id, t.name)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TEMPLATE MODAL */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Create Message Template</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create an approved template with parameter tokens like {"{{1}}"}, {"{{2}}"}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTemplate} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label htmlFor="tpl-name" className="text-xs font-semibold">
                Template Identifier
              </Label>
              <Input
                id="tpl-name"
                type="text"
                placeholder="e.g. order_delivered_notice"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="tpl-type" className="text-xs font-semibold">
                  Channel Type
                </Label>
                <select
                  id="tpl-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-xs text-slate-900 dark:text-slate-100 shadow-sm"
                >
                  <option value="whatsapp">WhatsApp HSM</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="tpl-cat" className="text-xs font-semibold">
                  Category
                </Label>
                <select
                  id="tpl-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-xs text-slate-900 dark:text-slate-100 shadow-sm"
                >
                  <option value="MARKETING">Marketing</option>
                  <option value="UTILITY">Utility</option>
                  <option value="AUTHENTICATION">Authentication</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="tpl-body" className="text-xs font-semibold">
                Message Body
              </Label>
              <textarea
                id="tpl-body"
                rows={4}
                placeholder="Hello {{1}}, your order #{{2}} from VBO Store is on the way!"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
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
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Save Template
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
