"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore, isProductSubscribed } from "@/lib/auth-store";
import {
  LayoutGrid,
  Boxes,
  MessageSquare,
  ShieldCheck,
  ShoppingCart,
  ExternalLink,
  Check,
  Lock,
  ArrowRight,
} from "lucide-react";

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  description: string;
  route: string;
  isExternal?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  badge?: string;
}

export const VBO_PRODUCTS: ProductItem[] = [
  {
    id: "erp",
    name: "VBO ERP",
    category: "Operations & POS",
    description: "POS register, inventory, sales, accounting, and reports",
    route: "/erp",
    icon: Boxes,
    gradient: "from-blue-600 to-indigo-600",
  },
  {
    id: "connect",
    name: "VBO Connect",
    category: "Customer Messaging",
    description: "Omnichannel WhatsApp, campaigns, automations & shared inbox",
    route: "/connect",
    icon: MessageSquare,
    gradient: "from-purple-600 to-violet-600",
  },
  {
    id: "platform",
    name: "VBO Platform",
    category: "Identity & Admin",
    description: "Central billing, subscription quotas, team & security audit",
    route: "/settings/billing",
    isExternal: false,
    icon: ShieldCheck,
    gradient: "from-emerald-600 to-teal-600",
  },
  {
    id: "ecommerce",
    name: "VBO E-Commerce",
    category: "Digital Commerce",
    description: "Multi-channel storefronts and automated order fulfillment",
    route: "/ecommerce",
    icon: ShoppingCart,
    gradient: "from-amber-500 to-orange-600",
  },
];

export function ProductLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname() || "";
  const router = useRouter();
  const { user } = useAuthStore();

  // Determine active product based on pathname
  const activeProductId =
    pathname === "/"
      ? "launcher"
      : pathname.startsWith("/connect")
      ? "connect"
      : pathname.startsWith("/ecommerce")
      ? "ecommerce"
      : pathname.startsWith("/settings/billing") || pathname.startsWith("/platform")
      ? "platform"
      : "erp";

  // Close on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleProductSelect = (product: ProductItem) => {
    setIsOpen(false);
    const subscribed = product.id === 'platform' || isProductSubscribed(user, product.id);

    if (!subscribed) {
      // Direct user to central billing page to activate the product
      router.push('/settings/billing');
      return;
    }

    if (product.isExternal) {
      window.open(product.route, "_blank", "noopener,noreferrer");
    } else {
      router.push(product.route);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* 9-Dot Launcher Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="VBO Product Launcher"
        aria-expanded={isOpen}
        className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
          isOpen
            ? "bg-slate-100 dark:bg-slate-800 border-blue-500/50 text-blue-600 dark:text-blue-400 shadow-sm"
            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
        title="VBO Products & Workspaces"
      >
        <LayoutGrid className="w-4 h-4 transition-transform group-hover:scale-110" />
      </button>

      {/* Product Launcher Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="VBO Products Menu"
          className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                VBO Ecosystem
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Unified Suite
              </span>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/');
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              App Launcher <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Product Grid */}
          <div className="p-2 space-y-1 max-h-[380px] overflow-y-auto">
            {VBO_PRODUCTS.map((product) => {
              const Icon = product.icon;
              const isActive = product.id === activeProductId;
              const isSubscribed =
                product.id === 'platform' || isProductSubscribed(user, product.id);

              return (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all group ${
                    isActive
                      ? "bg-blue-50/80 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20 shadow-sm"
                      : isSubscribed
                      ? "hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent"
                      : "opacity-80 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${product.gradient} flex items-center justify-center shrink-0 shadow-md text-white transition-transform group-hover:scale-105 ${
                      !isSubscribed ? "grayscale-[40%]" : ""
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {product.name}
                        </span>
                        {product.isExternal && (
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        )}
                      </div>

                      {/* Status Pills */}
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-500/20">
                          <Check className="w-2.5 h-2.5" />
                          Active
                        </span>
                      ) : !isSubscribed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-500/20">
                          <Lock className="w-2.5 h-2.5" />
                          Upgrade
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {product.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-slate-50/60 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Unified Platform SSO</span>
            <span className="font-mono text-[10px] text-slate-400">
              {user?.tenant_slug || "app.vbotech.com"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
