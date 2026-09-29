"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { rolesApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Shield, Key, Lock, Check, CheckCircle2, Eye, PlusCircle, Pencil, Trash2,
  Calculator, LineChart, PieChart, Building2, Tag, Box, Package,
  LayoutGrid, Users, Gift, Layers, ArrowLeftRight, ShoppingCart,
  RotateCcw, Receipt, Truck, Globe, Utensils, ChefHat, Percent,
  CreditCard, CalendarCheck, Settings, Upload, Warehouse, Star,
  FolderTree, Search, ChevronDown, ChevronRight, HelpCircle
} from "lucide-react";
import { useLanguage } from "@/i18n";

interface MenuGroup {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  order: number;
}

const MENU_GROUPS: Record<string, MenuGroup> = {
  catalog: {
    id: 'catalog',
    title: 'Catalog & Products',
    description: 'Products, categories, brands, and imports',
    icon: <Box className="w-4 h-4" />,
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    order: 1,
  },
  inventory: {
    id: 'inventory',
    title: 'Inventory & Logistics',
    description: 'Stock tracking, batches, transfers, and warehouse management',
    icon: <Package className="w-4 h-4" />,
    iconBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    order: 2,
  },
  sales: {
    id: 'sales',
    title: 'Sales & Billing',
    description: 'POS registers, transactions, and sales returns',
    icon: <ShoppingCart className="w-4 h-4" />,
    iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    order: 3,
  },
  invoices: {
    id: 'invoices',
    title: 'Invoices',
    description: 'Customer invoices, billing statements, and payment tracking',
    icon: <Receipt className="w-4 h-4" />,
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    order: 4,
  },
  customers: {
    id: 'customers',
    title: 'Customers & Loyalty',
    description: 'Customer directory, CRM, loyalty programs, and gift cards',
    icon: <Users className="w-4 h-4" />,
    iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    order: 5,
  },
  procurement: {
    id: 'procurement',
    title: 'Procurement & Suppliers',
    description: 'Purchase orders, vendor directory, and suppliers',
    icon: <Truck className="w-4 h-4" />,
    iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    order: 6,
  },
  restaurant: {
    id: 'restaurant',
    title: 'Restaurant Vertical',
    description: 'Kitchen displays (KDS), table layouts, reservations, and recipes',
    icon: <Utensils className="w-4 h-4" />,
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    order: 7,
  },
  ecommerce: {
    id: 'ecommerce',
    title: 'E-commerce Channels',
    description: 'Online store channels, order sync, and marketplace integrations',
    icon: <Globe className="w-4 h-4" />,
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    order: 8,
  },
  accounting: {
    id: 'accounting',
    title: 'Accounting & Ledger',
    description: 'General ledger, charts of accounts, and financial reports',
    icon: <Calculator className="w-4 h-4" />,
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    order: 9,
  },
  analytics: {
    id: 'analytics',
    title: 'BI & Analytics',
    description: 'Business intelligence, reports, and scheduled analytics',
    icon: <LineChart className="w-4 h-4" />,
    iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    order: 10,
  },
  settings: {
    id: 'settings',
    title: 'Administration & Settings',
    description: 'Users, roles, organization, branches, taxes, and system settings',
    icon: <Settings className="w-4 h-4" />,
    iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    order: 11,
  },
  other: {
    id: 'other',
    title: 'Other Modules',
    description: 'General platform utilities and system functions',
    icon: <FolderTree className="w-4 h-4" />,
    iconBg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    order: 12,
  }
};

const MODULE_TO_GROUP: Record<string, string> = {
  catalog: 'catalog',
  products: 'catalog',
  categories: 'catalog',
  brands: 'catalog',

  inventory: 'inventory',
  inventory_batches: 'inventory',
  inventory_transfers: 'inventory',
  warehouse: 'inventory',

  sales: 'sales',
  sales_returns: 'sales',
  pos: 'sales',

  invoices: 'invoices',

  customers: 'customers',
  crm: 'customers',
  loyalty: 'customers',
  gift_cards: 'customers',

  procurement: 'procurement',
  suppliers: 'procurement',

  restaurant: 'restaurant',
  restaurant_kitchen: 'restaurant',
  restaurant_menu: 'restaurant',
  restaurant_recipes: 'restaurant',
  restaurant_tables: 'restaurant',
  restaurant_reservations: 'restaurant',
  restaurant_analytics: 'restaurant',
  restaurant_delivery_partners: 'restaurant',

  ecommerce: 'ecommerce',
  accounting: 'accounting',

  reports: 'analytics',
  analytics: 'analytics',
  bi: 'analytics',

  users: 'settings',
  roles: 'settings',
  organizations: 'settings',
  branches: 'settings',
  settings: 'settings',
  tax_rates: 'settings',
  payments: 'settings',
  subscriptions: 'settings',
  upload: 'settings',
};

export default function PermissionsPage() {
  const { t } = useLanguage();
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const permsData = await rolesApi.getPermissions();
      setAllPermissions(permsData || []);
    } catch (error) {
      console.error("Failed to load permissions", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const getModuleConfig = (moduleName: string) => {
    const key = moduleName.toLowerCase();
    switch (key) {
      case 'accounting':
        return { icon: <Calculator className="w-4 h-4" />, bg: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" };
      case 'analytics':
        return { icon: <LineChart className="w-4 h-4" />, bg: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400" };
      case 'bi':
        return { icon: <PieChart className="w-4 h-4" />, bg: "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400" };
      case 'branches':
        return { icon: <Building2 className="w-4 h-4" />, bg: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" };
      case 'brands':
        return { icon: <Tag className="w-4 h-4" />, bg: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" };
      case 'catalog':
        return { icon: <Box className="w-4 h-4" />, bg: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" };
      case 'categories':
        return { icon: <LayoutGrid className="w-4 h-4" />, bg: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" };
      case 'customers':
      case 'crm':
        return { icon: <Users className="w-4 h-4" />, bg: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
      case 'gift_cards':
        return { icon: <Gift className="w-4 h-4" />, bg: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" };
      case 'inventory':
        return { icon: <Package className="w-4 h-4" />, bg: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
      case 'inventory_batches':
        return { icon: <Layers className="w-4 h-4" />, bg: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" };
      case 'inventory_transfers':
        return { icon: <ArrowLeftRight className="w-4 h-4" />, bg: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400" };
      case 'sales':
        return { icon: <ShoppingCart className="w-4 h-4" />, bg: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" };
      case 'sales_returns':
        return { icon: <RotateCcw className="w-4 h-4" />, bg: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" };
      case 'invoices':
        return { icon: <Receipt className="w-4 h-4" />, bg: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" };
      case 'procurement':
      case 'suppliers':
        return { icon: <Truck className="w-4 h-4" />, bg: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" };
      case 'ecommerce':
        return { icon: <Globe className="w-4 h-4" />, bg: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
      case 'restaurant':
      case 'restaurant_menu':
      case 'restaurant_tables':
      case 'restaurant_analytics':
        return { icon: <Utensils className="w-4 h-4" />, bg: "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400" };
      case 'restaurant_reservations':
        return { icon: <CalendarCheck className="w-4 h-4" />, bg: "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400" };
      case 'restaurant_kitchen':
      case 'restaurant_recipes':
        return { icon: <ChefHat className="w-4 h-4" />, bg: "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400" };
      case 'restaurant_delivery_partners':
        return { icon: <Truck className="w-4 h-4" />, bg: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" };
      case 'tax_rates':
        return { icon: <Percent className="w-4 h-4" />, bg: "bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400" };
      case 'payments':
        return { icon: <CreditCard className="w-4 h-4" />, bg: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
      case 'loyalty':
        return { icon: <Star className="w-4 h-4" />, bg: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" };
      case 'subscriptions':
        return { icon: <CalendarCheck className="w-4 h-4" />, bg: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400" };
      case 'users':
        return { icon: <Users className="w-4 h-4" />, bg: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" };
      case 'roles':
        return { icon: <Shield className="w-4 h-4" />, bg: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400" };
      case 'organizations':
        return { icon: <Building2 className="w-4 h-4" />, bg: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" };
      case 'settings':
        return { icon: <Settings className="w-4 h-4" />, bg: "bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400" };
      case 'upload':
        return { icon: <Upload className="w-4 h-4" />, bg: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" };
      case 'warehouse':
        return { icon: <Warehouse className="w-4 h-4" />, bg: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" };
      case 'products':
        return { icon: <Package className="w-4 h-4" />, bg: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" };
      default:
        return { icon: <FolderTree className="w-4 h-4" />, bg: "bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400" };
    }
  };

  // Group permissions by menu group, then by module
  const groupedData = useMemo(() => {
    const groups: Record<string, { 
      group: MenuGroup; 
      modules: Record<string, any[]>; 
      grantedCount: number;
      totalPossible: number;
    }> = {};

    allPermissions.forEach((perm) => {
      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesModule = perm.module.toLowerCase().includes(query);
        const matchesAction = perm.action.toLowerCase().includes(query);
        const matchesSlug = perm.slug.toLowerCase().includes(query);
        if (!matchesModule && !matchesAction && !matchesSlug) return;
      }

      const groupId = MODULE_TO_GROUP[perm.module.toLowerCase()] || 'other';

      // Apply group filter tab
      if (selectedGroup !== 'all' && selectedGroup !== groupId) return;

      if (!groups[groupId]) {
        groups[groupId] = {
          group: MENU_GROUPS[groupId] || MENU_GROUPS.other,
          modules: {},
          grantedCount: 0,
          totalPossible: 0,
        };
      }

      if (!groups[groupId].modules[perm.module]) {
        groups[groupId].modules[perm.module] = [];
      }

      groups[groupId].modules[perm.module].push(perm);
      groups[groupId].grantedCount += 1;
    });

    // Calculate total possible permissions per group
    Object.values(groups).forEach(g => {
      const moduleCount = Object.keys(g.modules).length;
      // Standard is 4 permissions per module (CRUD), plus any special permissions
      let possible = moduleCount * 4;
      Object.values(g.modules).forEach(perms => {
        const extra = perms.filter(p => !['create', 'read', 'update', 'delete'].includes(p.action)).length;
        possible += extra;
      });
      g.totalPossible = Math.max(possible, g.grantedCount);
    });

    return Object.values(groups).sort((a, b) => a.group.order - b.group.order);
  }, [allPermissions, searchQuery, selectedGroup]);

  // List of active groups for filter tabs
  const availableGroups = useMemo(() => {
    const groupSet = new Set<string>();
    allPermissions.forEach(perm => {
      const gId = MODULE_TO_GROUP[perm.module.toLowerCase()] || 'other';
      groupSet.add(gId);
    });
    return Array.from(groupSet)
      .map(id => {
        const count = allPermissions.filter(p => (MODULE_TO_GROUP[p.module.toLowerCase()] || 'other') === id).length;
        return {
          ...(MENU_GROUPS[id] || MENU_GROUPS.other),
          count,
        };
      })
      .sort((a, b) => a.order - b.order);
  }, [allPermissions]);

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/20 shadow-2xs">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                {t('settings.permissions.title')}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-500/20 uppercase tracking-wider">
                <Lock className="w-3 h-3 stroke-[2.5]" /> {t('settings.permissions.view_only')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('settings.permissions.subtitle')}{" "}
              <Link href="/settings/roles" className="text-indigo-600 dark:text-indigo-400 font-semibold underline underline-offset-2 hover:text-indigo-700 transition-colors">
                {t('settings.permissions.roles_link')}
              </Link>.
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
          <Input 
            type="text"
            placeholder={t('settings.permissions.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm h-10 shadow-xs focus:ring-2 focus:ring-indigo-500"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-400 opacity-100">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Menu Group Filter Tabs */}
      <div 
        ref={tabsRef}
        className="w-full overflow-x-auto pb-1.5 pt-1 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] touch-pan-x"
      >
        <div className="flex items-center gap-2 min-w-max">
          <button
            onClick={() => setSelectedGroup('all')}
            className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedGroup === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{t('settings.permissions.all_modules')}</span>
            <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded-md ${
              selectedGroup === 'all' 
                ? 'bg-white/20 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {allPermissions.length}
            </span>
          </button>
          {availableGroups.map((g) => {
            const isSelected = selectedGroup === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setSelectedGroup(g.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className={isSelected ? 'text-white' : ''}>{g.icon}</span>
                <span>{g.title}</span>
                <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded-md ${
                  isSelected 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {g.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400 pt-1 pb-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
          <span className="font-medium text-slate-600 dark:text-slate-300">{t('settings.permissions.legend_granted')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center"></div>
          <span className="font-medium text-slate-400 dark:text-slate-500">{t('settings.permissions.legend_not_granted')}</span>
        </div>
      </div>

      {/* Main Content Sections */}
      {isLoading ? (
        <div className="flex items-center justify-center p-20 text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
          {t('settings.permissions.loading')}
        </div>
      ) : groupedData.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 rounded-2xl">
          <CardContent className="p-16 text-center text-slate-500">
            {t('settings.permissions.no_permissions')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedData.map(({ group, modules, grantedCount, totalPossible }) => {
            const isCollapsed = collapsedGroups[group.id];
            return (
              <div 
                key={group.id} 
                className="bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all"
              >
                {/* Section Header */}
                <div 
                  onClick={() => toggleGroupCollapse(group.id)}
                  className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors select-none"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-2xs ${group.iconBg}`}>
                      {group.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                        {group.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {group.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t('settings.permissions.granted_ratio', { granted: grantedCount, total: totalPossible })}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                  </div>
                </div>

                {/* Table Content */}
                {!isCollapsed && (
                  <div className="border-t border-slate-100 dark:border-slate-800/60 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-800/20 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-6 font-semibold">{t('settings.permissions.col_module')}</th>
                          <th className="py-3 px-6 text-center font-semibold w-24">{t('settings.permissions.col_create')}</th>
                          <th className="py-3 px-6 text-center font-semibold w-24">{t('settings.permissions.col_read')}</th>
                          <th className="py-3 px-6 text-center font-semibold w-24">{t('settings.permissions.col_update')}</th>
                          <th className="py-3 px-6 text-center font-semibold w-24">{t('settings.permissions.col_delete')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                        {Object.entries(modules).map(([moduleName, perms]) => {
                          const config = getModuleConfig(moduleName);
                          const hasCreate = perms.some(p => p.action === 'create');
                          const hasRead = perms.some(p => p.action === 'read');
                          const hasUpdate = perms.some(p => p.action === 'update');
                          const hasDelete = perms.some(p => p.action === 'delete');
                          
                          const specialActions = perms.filter(p => !['create', 'read', 'update', 'delete'].includes(p.action));

                          return (
                            <tr 
                              key={moduleName} 
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                            >
                              {/* Module Name + Icon */}
                              <td className="py-3.5 px-6">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                                    {config.icon}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                                      {moduleName.replace(/_/g, ' ')}
                                    </span>
                                    {specialActions.length > 0 && (
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        {specialActions.map(sa => (
                                          <span 
                                            key={sa.id} 
                                            className="inline-flex items-center text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300 border border-purple-200/60 dark:border-purple-500/20"
                                          >
                                            +{sa.action}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* CREATE */}
                              <td className="py-3.5 px-6 text-center">
                                {hasCreate ? (
                                  <div className="w-5 h-5 rounded-full bg-emerald-100/90 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border border-dashed border-slate-200 dark:border-slate-700 mx-auto opacity-40"></div>
                                )}
                              </td>

                              {/* READ */}
                              <td className="py-3.5 px-6 text-center">
                                {hasRead ? (
                                  <div className="w-5 h-5 rounded-full bg-emerald-100/90 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border border-dashed border-slate-200 dark:border-slate-700 mx-auto opacity-40"></div>
                                )}
                              </td>

                              {/* UPDATE */}
                              <td className="py-3.5 px-6 text-center">
                                {hasUpdate ? (
                                  <div className="w-5 h-5 rounded-full bg-emerald-100/90 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border border-dashed border-slate-200 dark:border-slate-700 mx-auto opacity-40"></div>
                                )}
                              </td>

                              {/* DELETE */}
                              <td className="py-3.5 px-6 text-center">
                                {hasDelete ? (
                                  <div className="w-5 h-5 rounded-full bg-emerald-100/90 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border border-dashed border-slate-200 dark:border-slate-700 mx-auto opacity-40"></div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
