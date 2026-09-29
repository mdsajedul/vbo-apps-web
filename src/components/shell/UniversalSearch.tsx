"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Command,
  Boxes,
  ShoppingCart,
  Receipt,
  FileSpreadsheet,
  Users,
  BarChart3,
  UtensilsCrossed,
  Calculator,
  Settings,
  MessageSquare,
  Send,
  Zap,
  Target,
  FileText,
  TrendingUp,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";

export interface SearchEntry {
  id: string;
  title: string;
  subtitle: string;
  category: "ERP Operations" | "Connect Messaging" | "Quick Actions";
  route: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  keywords?: string[];
}

export const SEARCH_INDEX: SearchEntry[] = [
  // ERP Operations
  {
    id: "erp-pos",
    title: "POS Register",
    subtitle: "Open point of sale billing terminal",
    category: "ERP Operations",
    route: "/pos",
    icon: ShoppingCart,
    badge: "ERP",
    keywords: ["billing", "checkout", "cashier", "terminal", "sale"],
  },
  {
    id: "erp-catalog",
    title: "Product Catalog",
    subtitle: "Manage items, variants, barcodes and prices",
    category: "ERP Operations",
    route: "/catalog/products",
    icon: Boxes,
    badge: "ERP",
    keywords: ["items", "skus", "variants", "stock", "price"],
  },
  {
    id: "erp-inventory",
    title: "Inventory & Stock Levels",
    subtitle: "Track on-hand quantities, reorders and valuation",
    category: "ERP Operations",
    route: "/inventory",
    icon: Boxes,
    badge: "ERP",
    keywords: ["stock", "warehouse", "valuation", "reorder", "quantity"],
  },
  {
    id: "erp-sales",
    title: "Sales Orders & Receipts",
    subtitle: "View complete sales history and receipts",
    category: "ERP Operations",
    route: "/sales",
    icon: Receipt,
    badge: "ERP",
    keywords: ["orders", "receipts", "transactions", "revenue"],
  },
  {
    id: "erp-invoices",
    title: "Invoices & Ledger",
    subtitle: "Issue B2B invoices and credit notes",
    category: "ERP Operations",
    route: "/invoices",
    icon: FileSpreadsheet,
    badge: "ERP",
    keywords: ["billing", "b2b", "credit", "receivables"],
  },
  {
    id: "erp-reports",
    title: "Financial & Tax Reports",
    subtitle: "P&L, VAT Mushak 6.1/6.2, and sales analytics",
    category: "ERP Operations",
    route: "/reports",
    icon: BarChart3,
    badge: "ERP",
    keywords: ["vat", "tax", "mushak", "p&l", "profit", "analytics", "export"],
  },
  {
    id: "erp-restaurant",
    title: "Restaurant Operations",
    subtitle: "Table management, reservations and kitchen orders",
    category: "ERP Operations",
    route: "/restaurant",
    icon: UtensilsCrossed,
    badge: "ERP",
    keywords: ["tables", "kitchen", "menu", "kds", "dining"],
  },
  {
    id: "erp-accounting",
    title: "Accounting & General Ledger",
    subtitle: "Double-entry bookkeeping and journal entries",
    category: "ERP Operations",
    route: "/accounting",
    icon: Calculator,
    badge: "ERP",
    keywords: ["accounts", "journal", "debit", "credit", "ledger"],
  },
  {
    id: "erp-settings",
    title: "Business & Branch Settings",
    subtitle: "Configure branches, tax rates, users and roles",
    category: "ERP Operations",
    route: "/settings",
    icon: Settings,
    badge: "ERP",
    keywords: ["branches", "organization", "roles", "taxes"],
  },

  // Connect Messaging
  {
    id: "connect-hub",
    title: "Connect Workspace Hub",
    subtitle: "Overview of customer communications and channels",
    category: "Connect Messaging",
    route: "/connect",
    icon: MessageSquare,
    badge: "CONNECT",
    keywords: ["inbox", "messaging", "whatsapp", "chat"],
  },
  {
    id: "connect-inbox",
    title: "Omnichannel Shared Inbox",
    subtitle: "Unified WhatsApp, live chat, and email conversations",
    category: "Connect Messaging",
    route: "/connect/inbox",
    icon: MessageSquare,
    badge: "CONNECT",
    keywords: ["chat", "whatsapp", "tickets", "conversations", "support"],
  },
  {
    id: "connect-campaigns",
    title: "WhatsApp & Email Campaigns",
    subtitle: "Broadcast newsletters, promotions and alerts",
    category: "Connect Messaging",
    route: "/connect/campaigns",
    icon: Send,
    badge: "CONNECT",
    keywords: ["broadcast", "marketing", "newsletter", "sms", "email"],
  },
  {
    id: "connect-automations",
    title: "Marketing Automations",
    subtitle: "Build event-driven journeys and auto-responders",
    category: "Connect Messaging",
    route: "/connect/automations",
    icon: Zap,
    badge: "CONNECT",
    keywords: ["workflows", "triggers", "bots", "autoresponder"],
  },
  {
    id: "connect-contacts",
    title: "Contacts Directory",
    subtitle: "Unified customer contacts, segments and tags",
    category: "Connect Messaging",
    route: "/connect/contacts",
    icon: Users,
    badge: "CONNECT",
    keywords: ["audience", "customers", "leads", "tags", "segments"],
  },
  {
    id: "connect-leads",
    title: "Lead Pipeline Funnel",
    subtitle: "Kanban deal pipeline and conversion tracking",
    category: "Connect Messaging",
    route: "/connect/leads",
    icon: Target,
    badge: "CONNECT",
    keywords: ["crm", "pipeline", "deals", "sales", "opportunities"],
  },
  {
    id: "connect-templates",
    title: "Message & Email Templates",
    subtitle: "Pre-approved WhatsApp templates and rich HTML designs",
    category: "Connect Messaging",
    route: "/connect/templates",
    icon: FileText,
    badge: "CONNECT",
    keywords: ["templates", "hsm", "email design", "builder"],
  },
  {
    id: "connect-analytics",
    title: "Delivery & Campaign Analytics",
    subtitle: "Open rates, CTR, bounce tracking and delivery stats",
    category: "Connect Messaging",
    route: "/connect/analytics",
    icon: TrendingUp,
    badge: "CONNECT",
    keywords: ["metrics", "open rate", "ctr", "stats", "performance"],
  },

  // Quick Actions
  {
    id: "action-new-sale",
    title: "Quick Action: Start New Sale",
    subtitle: "Jump directly into active cashier checkout",
    category: "Quick Actions",
    route: "/pos",
    icon: Sparkles,
    badge: "ACTION",
    keywords: ["cashier", "new sale", "checkout"],
  },
  {
    id: "action-add-product",
    title: "Quick Action: Create New Product",
    subtitle: "Open product creation dialog",
    category: "Quick Actions",
    route: "/catalog/products",
    icon: Sparkles,
    badge: "ACTION",
    keywords: ["create", "product", "new item"],
  },
  {
    id: "action-new-campaign",
    title: "Quick Action: Dispatch Campaign",
    subtitle: "Create a new broadcast campaign",
    category: "Quick Actions",
    route: "/connect/campaigns",
    icon: Sparkles,
    badge: "ACTION",
    keywords: ["send", "campaign", "new blast"],
  },
];

export function UniversalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter items based on query
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_INDEX.slice(0, 10);

    return SEARCH_INDEX.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(q);
      const subMatch = item.subtitle.toLowerCase().includes(q);
      const kwMatch = item.keywords?.some((k) => k.toLowerCase().includes(q));
      return titleMatch || subMatch || kwMatch;
    });
  }, [query]);

  // Handle keyboard navigation within results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredResults.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filteredResults[selectedIndex];
      if (target) {
        setIsOpen(false);
        router.push(target.route);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelect = (item: SearchEntry) => {
    setIsOpen(false);
    router.push(item.route);
  };

  return (
    <>
      {/* Header Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Universal Search"
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-xs"
      >
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <span className="truncate max-w-[130px] lg:max-w-[180px]">
          Search modules & actions...
        </span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 shadow-2xs">
          <Command className="w-2.5 h-2.5" /> K
        </kbd>
      </button>

      {/* Command Palette Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Command Search"
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in-50 duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Type a command, module, or keyword..."
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filteredResults.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No matching modules or actions found for &ldquo;{query}&rdquo;
                </div>
              ) : (
                filteredResults.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-500/10 text-slate-900 dark:text-white"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs truncate">
                              {item.title}
                            </span>
                            {item.badge && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                  item.badge === "CONNECT"
                                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                    : item.badge === "ACTION"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <ArrowRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Tip */}
            <div className="px-4 py-2 bg-slate-50/60 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                Use <kbd className="font-mono text-[10px]">↑</kbd>{" "}
                <kbd className="font-mono text-[10px]">↓</kbd> to navigate,{" "}
                <kbd className="font-mono text-[10px]">↵</kbd> to select
              </span>
              <span>Single-pane-of-glass Search</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
