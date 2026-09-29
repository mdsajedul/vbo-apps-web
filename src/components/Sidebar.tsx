"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, getUserDisplayRole } from '@/lib/auth-store';
import { navigationApi } from '@/lib/api';
import { DynamicIcon } from '@/components/DynamicIcon';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useTranslation, getNavTranslationKey } from '@/i18n';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  LogOut,
  User,
} from 'lucide-react';

type NavItem = {
  title: string;
  href: string;
  icon: string;
  colorClass?: string;
};

type NavGroup = {
  title: string;
  icon?: string;
  featureKey?: string;
  items: NavItem[];
};

const DEFAULT_GROUP_ICONS: Record<string, string> = {
  'CRM': 'Users',
  'Catalog': 'Package',
  'Product Catalog': 'Package',
  'Inventory': 'Boxes',
  'Warehouse': 'Warehouse',
  'Sales & Billing': 'Receipt',
  'Invoices': 'FileSpreadsheet',
  'Customers & Loyalty': 'HeartHandshake',
  'Customers': 'HeartHandshake',
  'Procurement': 'Truck',
  'E-commerce Channels': 'Globe',
  'E-Commerce Channels': 'Globe',
  'Restaurant Vertical': 'UtensilsCrossed',
  'Accounting & Ledger': 'Calculator',
  'Accounting': 'Calculator',
  'BI & Analytics': 'BarChart2',
  'Settings': 'Settings',
};

interface SidebarProps {
  onCloseMobile?: () => void;
}

// Global in-memory cache for instant 0ms sidebar renders
let globalMenuCache: (NavItem | NavGroup)[] | null = null;

export function Sidebar({ onCloseMobile }: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { isCollapsed, toggleCollapsed } = useSidebarStore();
  const [menuData, setMenuData] = useState<(NavItem | NavGroup)[]>(() => {
    if (globalMenuCache && globalMenuCache.length > 0) return globalMenuCache;
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('bos_menu_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          globalMenuCache = parsed;
          return parsed;
        }
      } catch (e) {}
    }
    return [];
  });
  const [loading, setLoading] = useState(() => menuData.length === 0);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  // In mobile drawer, never collapse
  const isMobile = !!onCloseMobile;
  const collapsed = isMobile ? false : isCollapsed;

  useEffect(() => {
    // Stale-While-Revalidate: fetch latest menu from server in background
    navigationApi
      .getMenu()
      .then((res) => {
        const items = res || [];
        globalMenuCache = items;
        setMenuData(items);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('bos_menu_cache', JSON.stringify(items));
        }
      })
      .catch((err) => {
        console.error('Failed to load dynamic navigation menu', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Auto-close groups when collapsing
  useEffect(() => {
    if (collapsed) {
      setOpenGroup(null);
    }
  }, [collapsed]);

  const toggleGroup = (title: string) => {
    setOpenGroup((prev) => (prev === title ? null : title));
  };

  const isGroup = (item: NavItem | NavGroup): item is NavGroup => {
    return 'items' in item;
  };

  // Pre-calculate all hrefs to find the most specific match
  const allHrefs = menuData.flatMap(item =>
    isGroup(item) ? item.items.map(sub => sub.href) : [item.href]
  );

  const activeHref = allHrefs
    .filter(href => pathname === href || (href !== '/dashboard' && pathname.startsWith(href)))
    .sort((a, b) => b.length - a.length)[0];

  const isActive = (href: string) => {
    return href === activeHref;
  };

  /**
   * Wraps an element in a Tooltip when sidebar is collapsed.
   * Shows immediately on hover for snappy UX.
   */
  const CollapsedTooltip = ({
    children,
    label,
  }: {
    children: React.ReactNode;
    label: string;
  }) => {
    if (!collapsed) return <>{children}</>;
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider>
      <aside
        className={`flex flex-col bg-slate-900 text-slate-300 shadow-lg z-10 h-full overflow-hidden shrink-0 transition-[width] duration-300 ease-in-out ${
          isMobile ? 'w-full' : collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`h-16 flex items-center font-bold text-xl border-b border-slate-800 tracking-tight shrink-0 text-white ${
            collapsed ? 'justify-center px-2' : 'justify-between px-6'
          }`}
        >
          {collapsed ? (
            /* Collapsed: show the logo mark */
            <Image src="/logo.png" alt="VBO ERP" width={26} height={26} style={{ width: 'auto', height: '26px' }} className="object-contain" priority />
          ) : (
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="VBO ERP" width={32} height={22} style={{ width: 'auto', height: '22px' }} className="object-contain shrink-0" priority />
              <span className="text-lg font-bold tracking-tight">
                <span className="text-white">VBO</span>{' '}
                <span className="text-blue-400">ERP</span>
              </span>
            </div>
          )}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Dynamic Navigation Tree */}
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {loading && menuData.length === 0 ? (
            <div className="px-4 space-y-4">
              <div className="h-4 bg-slate-800 rounded animate-pulse w-3/4" />
              <div className="h-8 bg-slate-800 rounded animate-pulse w-full" />
              <div className="h-8 bg-slate-800 rounded animate-pulse w-full" />
              <div className="h-4 bg-slate-800 rounded animate-pulse w-1/2 mt-4" />
              <div className="h-8 bg-slate-800 rounded animate-pulse w-full" />
            </div>
          ) : (
            <div className={collapsed ? 'px-1.5 space-y-1' : 'px-3 space-y-1'}>
              {menuData.map((item, idx) => {
                if (isGroup(item)) {
                  const isExpanded = openGroup === item.title;
                  const isGroupActive = item.items.some((sub) => isActive(sub.href));
                  const groupTitle = t(getNavTranslationKey(item.title), undefined, item.title);
                  const groupIcon = item.icon || DEFAULT_GROUP_ICONS[item.title] || 'FolderTree';

                  /* ── Collapsed group: show group icon with tooltip ── */
                  if (collapsed) {
                    return (
                      <div key={idx} className="mb-1">
                        <CollapsedTooltip label={groupTitle}>
                          <button
                            type="button"
                            onClick={toggleCollapsed}
                            className={`w-full flex items-center justify-center p-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                              isGroupActive
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            <DynamicIcon name={groupIcon} size={18} />
                          </button>
                        </CollapsedTooltip>
                      </div>
                    );
                  }

                  /* ── Expanded group: full labels & icon hierarchy ── */
                  return (
                    <div key={idx} className="mb-1">
                      <button
                        type="button"
                        onClick={() => toggleGroup(item.title)}
                        className={`w-full flex items-center justify-between px-3 py-2 mt-1 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer group ${
                          isExpanded
                            ? 'bg-slate-800/70 text-white shadow-2xs'
                            : isGroupActive
                            ? 'text-white bg-slate-800/40'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <span
                            className={`shrink-0 transition-colors ${
                              isExpanded || isGroupActive
                                ? 'text-blue-400'
                                : 'text-slate-400 group-hover:text-slate-200'
                            }`}
                          >
                            <DynamicIcon name={groupIcon} size={18} />
                          </span>
                          <span className="truncate tracking-normal text-left">{groupTitle}</span>
                        </div>

                        <ChevronRight
                          size={15}
                          className={`transition-transform duration-300 ease-in-out shrink-0 ml-2 ${
                            isExpanded
                              ? 'rotate-90 text-blue-400'
                              : 'text-slate-500 group-hover:text-slate-300'
                          }`}
                        />
                      </button>

                      <div
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                          isExpanded
                            ? 'grid-rows-[1fr] opacity-100'
                            : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="mt-1 space-y-1 ml-5 pl-2.5 border-l border-slate-800/80 py-0.5">
                            {item.items.map((sub, subIdx) => {
                              const active = isActive(sub.href);
                              const subTitle = t(getNavTranslationKey(sub.title), undefined, sub.title);
                              return (
                                <Link
                                  key={subIdx}
                                  href={sub.href}
                                  onClick={onCloseMobile}
                                  className={`flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                    active
                                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                  }`}
                                >
                                  <span className={sub.colorClass || (active ? 'text-white' : 'text-slate-400')}>
                                    <DynamicIcon name={sub.icon} size={15} />
                                  </span>
                                  <span className="truncate">{subTitle}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Standalone Item (Dashboard, POS)
                const active = isActive(item.href);
                const itemTitle = t(getNavTranslationKey(item.title), undefined, item.title);

                if (collapsed) {
                  return (
                    <CollapsedTooltip key={idx} label={itemTitle}>
                      <Link
                        href={item.href}
                        onClick={onCloseMobile}
                        className={`flex items-center justify-center p-2.5 rounded-lg text-sm transition-colors ${
                          active
                            ? 'bg-blue-600 text-white font-medium shadow-sm'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <span className={item.colorClass || (active ? 'text-white' : 'text-slate-400')}>
                          <DynamicIcon name={item.icon} size={18} />
                        </span>
                      </Link>
                    </CollapsedTooltip>
                  );
                }

                return (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-blue-600 text-white font-medium shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span className={item.colorClass || (active ? 'text-white' : 'text-slate-400')}>
                      <DynamicIcon name={item.icon} size={18} />
                    </span>
                    <span>{itemTitle}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* ── Collapse Toggle Button (Desktop only) ── */}
        {!isMobile && (
          <div className="hidden md:block p-2 border-t border-slate-800/80 shrink-0">
            <button
              type="button"
              onClick={toggleCollapsed}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/70 transition-all duration-200 cursor-pointer group ${
                collapsed ? 'justify-center' : ''
              }`}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronsRight size={16} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
              ) : (
                <>
                  <ChevronsLeft size={16} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span className="truncate">{t('common.collapse', undefined, 'Collapse')}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Desktop Minimal Status Footer */}
        <div
          className={`hidden md:flex items-center border-t border-slate-800/80 bg-slate-950/60 shrink-0 text-slate-500 ${
            collapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-4 py-2.5'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {!collapsed && (
              <span className="text-[11px] font-medium tracking-wide text-slate-400">VBO Enterprise</span>
            )}
          </div>
          {!collapsed && (
            <span className="text-[10px] font-mono text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded">v1.2</span>
          )}
        </div>

        {/* Mobile Slide-Out Drawer Account Footer (Only on Mobile) */}
        <div className="md:hidden p-3.5 border-t border-slate-800 bg-slate-950/90 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-slate-700 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                {(user?.full_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{user?.full_name || 'User'}</p>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                  {getUserDisplayRole(user)}
                </span>
              </div>
            </div>

            <div className="shrink-0 scale-90">
              <ThemeToggle />
            </div>
          </div>

          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              logout();
              router.push('/login');
            }}
            className="w-full py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('auth.logout', undefined, 'Sign Out / Switch Account')}</span>
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
