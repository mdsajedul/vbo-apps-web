"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore, getUserDisplayRole } from "@/lib/auth-store";
import { navigationApi } from "@/lib/api";
import { DynamicIcon } from "@/components/DynamicIcon";
import { useSidebarStore } from "@/store/useSidebarStore";
import { useTranslation, getNavTranslationKey } from "@/i18n";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  User,
  Boxes,
  MessageSquare,
  Send,
  Zap,
  Users,
  Target,
  FileText,
  TrendingUp,
  Settings,
  ArrowLeftRight,
  LayoutDashboard,
} from "lucide-react";

interface UnifiedSidebarProps {
  onCloseMobile?: () => void;
}

type NavItem = {
  title: string;
  href: string;
  icon: string;
  colorClass?: string;
  badge?: string;
};

type NavGroup = {
  title: string;
  icon?: string;
  featureKey?: string;
  items: NavItem[];
};

const DEFAULT_GROUP_ICONS: Record<string, string> = {
  CRM: "Users",
  Catalog: "Package",
  "Product Catalog": "Package",
  Inventory: "Boxes",
  Warehouse: "Warehouse",
  "Sales & Billing": "Receipt",
  Invoices: "FileSpreadsheet",
  "Customers & Loyalty": "HeartHandshake",
  Customers: "HeartHandshake",
  Procurement: "Truck",
  "E-commerce Channels": "Globe",
  "E-Commerce Channels": "Globe",
  "Restaurant Vertical": "UtensilsCrossed",
  "Accounting & Ledger": "Calculator",
  Accounting: "Calculator",
  "BI & Analytics": "BarChart2",
  Settings: "Settings",
};

// Static navigation schema for VBO Connect
const CONNECT_NAV_GROUPS: NavGroup[] = [
  {
    title: "Global Suite",
    items: [
      {
        title: "Suite Overview",
        href: "/",
        icon: "Sparkles",
      },
    ],
  },
  {
    title: "Communication",
    items: [
      {
        title: "Workspace Hub",
        href: "/connect",
        icon: "LayoutDashboard",
      },
      {
        title: "Shared Inbox",
        href: "/connect/inbox",
        icon: "MessageSquare",
        badge: "Live",
      },
      {
        title: "Campaigns",
        href: "/connect/campaigns",
        icon: "Send",
      },
      {
        title: "Automations",
        href: "/connect/automations",
        icon: "Zap",
      },
    ],
  },
  {
    title: "Audience & Leads",
    items: [
      {
        title: "Contacts Directory",
        href: "/connect/contacts",
        icon: "Users",
      },
      {
        title: "Lead Pipeline",
        href: "/connect/leads",
        icon: "Target",
      },
      {
        title: "Templates",
        href: "/connect/templates",
        icon: "FileText",
      },
    ],
  },
  {
    title: "Intelligence & Settings",
    items: [
      {
        title: "Analytics",
        href: "/connect/analytics",
        icon: "BarChart2",
      },
      {
        title: "Settings",
        href: "/connect/settings",
        icon: "Settings",
      },
    ],
  },
];

let globalMenuCache: (NavItem | NavGroup)[] | null = null;

export function UnifiedSidebar({ onCloseMobile }: UnifiedSidebarProps = {}) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { isCollapsed, toggleCollapsed } = useSidebarStore();

  const isMobile = !!onCloseMobile;
  const collapsed = isMobile ? false : isCollapsed;

  // Detect active product workspace
  const isConnect = pathname.startsWith("/connect");

  const [erpMenuData, setErpMenuData] = useState<(NavItem | NavGroup)[]>(() => {
    if (globalMenuCache && globalMenuCache.length > 0) return globalMenuCache;
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("bos_menu_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          globalMenuCache = parsed;
          return parsed;
        }
      } catch (e) {}
    }
    return [];
  });

  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnect) {
      navigationApi
        .getMenu()
        .then((data: any) => {
          if (Array.isArray(data) && data.length > 0) {
            setErpMenuData(data);
            globalMenuCache = data;
            if (typeof window !== "undefined") {
              sessionStorage.setItem("bos_menu_cache", JSON.stringify(data));
            }
          }
        })
        .catch(() => {});
    }
  }, [isConnect]);

  const activeGroups = isConnect ? CONNECT_NAV_GROUPS : erpMenuData;

  const handleProductSwitch = (target: "erp" | "connect") => {
    if (target === "connect") {
      router.push("/connect");
    } else {
      router.push("/erp");
    }
    if (onCloseMobile) onCloseMobile();
  };


  const handleLinkClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={`h-screen flex flex-col bg-slate-900 border-r border-slate-800/80 transition-all duration-300 z-30 select-none ${
          collapsed ? "w-18" : "w-64"
        }`}
      >
        {/* Workspace Brand Header */}
        <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Product Brand Icon */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md text-white ${
                isConnect
                  ? "bg-gradient-to-br from-purple-600 to-violet-600 shadow-purple-900/30"
                  : "bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-900/30"
              }`}
            >
              {isConnect ? (
                <MessageSquare className="w-5 h-5" />
              ) : (
                <Boxes className="w-5 h-5" />
              )}
            </div>

            {/* Product Title & Switcher Pill */}
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-white tracking-tight truncate">
                    {isConnect ? "VBO Connect" : "VBO ERP"}
                  </span>
                  <button
                    onClick={() =>
                      handleProductSwitch(isConnect ? "erp" : "connect")
                    }
                    title={`Switch to ${isConnect ? "VBO ERP" : "VBO Connect"}`}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded inline-block ${
                    isConnect
                      ? "text-purple-400 bg-purple-500/10"
                      : "text-blue-400 bg-blue-500/10"
                  }`}
                >
                  {isConnect ? "Omnichannel" : "Cloud BOS"}
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Expand Toggle */}
          {!isMobile && (
            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? (
                <ChevronsRight className="w-4 h-4" />
              ) : (
                <ChevronsLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Dynamic Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {activeGroups.map((entry, idx) => {
            if ("items" in entry) {
              const group = entry as NavGroup;
              const isGroupOpen = openGroup === group.title || !collapsed;

              return (
                <div key={group.title || idx} className="space-y-1">
                  {/* Section Label */}
                  {!collapsed && group.title && (
                    <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {group.title}
                    </div>
                  )}

                  {/* Section Items */}
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive =
                        item.href === "/"
                          ? pathname === "/"
                          : pathname === item.href ||
                            (item.href !== "/connect" &&
                              item.href !== "/erp" &&
                              item.href !== "/dashboard" &&
                              pathname.startsWith(item.href));


                      const content = (
                        <Link
                          href={item.href}
                          onClick={handleLinkClick}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                            isActive
                              ? isConnect
                                ? "bg-purple-600 text-white shadow-md shadow-purple-900/30 font-semibold"
                                : "bg-blue-600 text-white shadow-md shadow-blue-900/30 font-semibold"
                              : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                          } ${collapsed ? "justify-center px-0" : ""}`}
                        >
                          <DynamicIcon
                            name={item.icon || "Circle"}
                            className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                              isActive
                                ? "text-white"
                                : isConnect
                                ? "text-purple-400"
                                : "text-slate-400 group-hover:text-blue-400"
                            }`}
                          />
                          {!collapsed && (
                            <span className="truncate flex-1">
                              {item.title}
                            </span>
                          )}
                          {!collapsed && item.badge && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 uppercase">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );

                      if (collapsed) {
                        return (
                          <Tooltip key={item.href}>
                            <TooltipTrigger asChild>{content}</TooltipTrigger>
                            <TooltipContent side="right" className="font-semibold text-xs">
                              {item.title}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return <React.Fragment key={item.href}>{content}</React.Fragment>;
                    })}
                  </div>
                </div>
              );
            }

            // Standalone item
            const item = entry as NavItem;
            const isActive = pathname === item.href;

            const standaloneContent = (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <DynamicIcon
                  name={item.icon || "Circle"}
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}
                />
                {!collapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{standaloneContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-semibold text-xs">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return standaloneContent;
          })}
        </nav>

        {/* Footer Profile & Logout Area */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div
            className={`flex items-center gap-2.5 ${
              collapsed ? "justify-center" : "justify-between"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                <User className="w-4 h-4" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    {user?.full_name || "VBO User"}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {getUserDisplayRole(user)}
                  </div>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={() => logout()}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
