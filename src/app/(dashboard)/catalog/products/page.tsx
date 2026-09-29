'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { productsApi, usersApi } from '@/lib/api';
import { useBranchStore } from '@/lib/branch-store';
import { useTranslation } from '@/i18n';
import { 
  Search, Plus, Edit2, Trash2, Package, 
  FolderTree, Tag, UploadCloud, Download, 
  Layers, CheckCircle2, Box, SlidersHorizontal,
  MapPin, ChevronDown, RotateCcw, Scale, Building2, Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useConfirm } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const COLUMN_STORAGE_KEY = 'bos_catalog_products_columns_v1';

interface ColumnSettings {
  sku: boolean;
  category: boolean;
  brand: boolean;
  type: boolean;
  stock: boolean;
  uom: boolean;
  cost_price: boolean;
  selling_price: boolean;
  margin: boolean;
  barcode: boolean;
  min_stock: boolean;
}

const DEFAULT_COLUMNS: ColumnSettings = {
  sku: true,
  category: true,
  brand: true,
  type: false,
  stock: true,
  uom: true,
  cost_price: false,
  selling_price: true,
  margin: false,
  barcode: false,
  min_stock: false,
};

export default function ProductsPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { selectedBranchId, selectedBranch } = useBranchStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [isRestaurant, setIsRestaurant] = useState(false);

  // Column visibility state
  const [columns, setColumns] = useState<ColumnSettings>(DEFAULT_COLUMNS);

  // Load saved column preferences
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COLUMN_STORAGE_KEY);
      if (saved) {
        setColumns(prev => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (e) {
      console.warn('Failed to load column settings', e);
    }
  }, []);

  const toggleColumn = (key: keyof ColumnSettings) => {
    setColumns(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save column settings', e);
      }
      return updated;
    });
  };

  const resetColumns = () => {
    setColumns(DEFAULT_COLUMNS);
    try {
      localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(DEFAULT_COLUMNS));
    } catch (e) {}
  };

  const fetchProducts = async () => {
    try {
      const [result, meData] = await Promise.all([
        productsApi.getAll({ search, page: currentPage, limit: itemsPerPage }),
        usersApi.getMe().catch(() => null)
      ]);
      setProducts(result.data || []);
      if (result.meta) {
        setTotalItems(result.meta.total);
      }

      if (meData?.branch) {
        setIsRestaurant(meData.branch.industry_type === 'RESTAURANT');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, currentPage, itemsPerPage]);

  const handleArchive = async (id: string, name?: string) => {
    const ok = await confirm({
      title: t('catalog.archive_title'),
      description: t('catalog.archive_confirm', { name: name ? `"${name}"` : t('catalog.col_product').toLowerCase() }),
      confirmText: t('catalog.archive_title'),
      variant: 'warning',
    });
    if (ok) {
      try {
        await productsApi.archive(id);
        toast.success(t('catalog.archive_success'));
        fetchProducts();
      } catch (err) {
        toast.error(t('catalog.archive_error'));
      }
    }
  };

  // KPI statistics
  const stats = useMemo(() => {
    const simpleCount = products.filter(p => p.type === 'SIMPLE').length;
    const variableCount = products.filter(p => p.type === 'VARIABLE').length;
    const categorySet = new Set(products.map(p => p.category?.name).filter(Boolean));

    return {
      total: totalItems || products.length,
      simple: simpleCount,
      variable: variableCount,
      categories: categorySet.size,
    };
  }, [products, totalItems]);

  // Calculate selected branch stock for simple or variable products
  const getProductStock = (product: any, branchId: string) => {
    if (!branchId || branchId === 'ALL') {
      // Fallback: aggregate across all branches if no specific branch is selected
      if (product.type === 'SIMPLE') {
        return product.inventory_items?.reduce((s: number, i: any) => s + (Number(i.quantity) || 0), 0) || 0;
      }
      if (product.type === 'VARIABLE' && Array.isArray(product.variants)) {
        return product.variants.reduce((total: number, variant: any) => {
          return total + (variant.inventory_items?.reduce((s: number, i: any) => s + (Number(i.quantity) || 0), 0) || 0);
        }, 0);
      }
      return 0;
    }

    if (product.type === 'SIMPLE') {
      const invItem = product.inventory_items?.find(
        (item: any) => item.branch_id === branchId
      );
      return Number(invItem?.quantity) || 0;
    }

    if (product.type === 'VARIABLE' && Array.isArray(product.variants)) {
      return product.variants.reduce((total: number, variant: any) => {
        const invItem = variant.inventory_items?.find(
          (item: any) => item.branch_id === branchId
        );
        return total + (Number(invItem?.quantity) || 0);
      }, 0);
    }

    return 0;
  };

  const renderPrice = (product: any) => {
    if (product.type === 'VARIABLE' && Array.isArray(product.variants) && product.variants.length > 0) {
      const validPrices = product.variants
        .map((v: any) => Number(v.selling_price))
        .filter((p: number) => !isNaN(p) && p > 0);

      if (validPrices.length > 0) {
        const minPrice = Math.min(...validPrices);
        const maxPrice = Math.max(...validPrices);
        if (minPrice === maxPrice) {
          return `৳${(minPrice / 100).toFixed(2)}`;
        }
        return `৳${(minPrice / 100).toFixed(2)} - ৳${(maxPrice / 100).toFixed(2)}`;
      }
    }
    return `৳${(Number(product.selling_price || 0) / 100).toFixed(2)}`;
  };

  const activeBranchName = selectedBranchId === 'ALL' || !selectedBranchId
    ? t('catalog.viewing_all_branches')
    : (selectedBranch?.name || t('catalog.stock_branch'));

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/20 shadow-2xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('catalog.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('catalog.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/catalog/categories">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-violet-500/30"
            >
              <FolderTree className="w-3.5 h-3.5 text-violet-500" />
              <span>{t('catalog.categories')}</span>
            </Button>
          </Link>
          {!isRestaurant && (
            <Link href="/catalog/brands">
              <Button 
                variant="outline"
                className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-indigo-500/30"
              >
                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                <span>{t('catalog.brands')}</span>
              </Button>
            </Link>
          )}
          <Link href="/catalog/import">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-teal-500/30"
            >
              <UploadCloud className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('catalog.import')}</span>
            </Button>
          </Link>
          <Button
            onClick={() => window.open('http://localhost:3001/api/products/export', '_blank')}
            variant="outline"
            className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold px-3.5 py-2 shadow-2xs hover:border-slate-300"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('catalog.export_csv')}</span>
          </Button>
          <PermissionGuard permission="catalog:create">
            <Link href="/catalog/products/new">
              <Button className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs">
                <Plus className="w-4 h-4" />
                <span>{t('catalog.add_product')}</span>
              </Button>
            </Link>
          </PermissionGuard>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('catalog.total_products')}
              </p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {stats.total.toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-500/20 shadow-2xs">
              <Package className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('catalog.simple_items')}
              </p>
              <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.simple.toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('catalog.variable_items')}
              </p>
              <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {stats.variable.toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('catalog.catalog_categories')}
              </p>
              <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {stats.categories}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-2xs">
              <FolderTree className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-slate-900/70">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-800/20">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder={t('catalog.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            {/* Active Branch Context Indicator */}
            {selectedBranchId === 'ALL' || !selectedBranchId ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 shadow-2xs">
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>{t('catalog.viewing_all_branches')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-slate-400 font-normal">{t('catalog.stock_branch')}</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedBranch?.name || 'Selected Branch'}</span>
                {selectedBranch?.code && (
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                    {selectedBranch.code}
                  </span>
                )}
              </div>
            )}

            {/* Column Selector Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold px-3 h-9 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-800"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t('catalog.columns')}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 z-50">
                <DropdownMenuLabel className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1">
                  {t('catalog.visible_columns')}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />
                
                <DropdownMenuCheckboxItem
                  checked={columns.sku}
                  onCheckedChange={() => toggleColumn('sku')}
                  className="rounded-lg text-xs font-medium cursor-pointer"
                >
                  {t('catalog.col_sku')}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columns.category}
                  onCheckedChange={() => toggleColumn('category')}
                  className="rounded-lg text-xs font-medium cursor-pointer"
                >
                  {t('catalog.col_category')}
                </DropdownMenuCheckboxItem>
                {!isRestaurant && (
                  <DropdownMenuCheckboxItem
                    checked={columns.brand}
                    onCheckedChange={() => toggleColumn('brand')}
                    className="rounded-lg text-xs font-medium cursor-pointer"
                  >
                    {t('catalog.col_brand')}
                  </DropdownMenuCheckboxItem>
                )}
                <DropdownMenuCheckboxItem
                  checked={columns.type}
                  onCheckedChange={() => toggleColumn('type')}
                  className="rounded-lg text-xs font-medium cursor-pointer"
                >
                  {t('catalog.col_type')}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columns.stock}
                  onCheckedChange={() => toggleColumn('stock')}
                  className="rounded-lg text-xs font-medium cursor-pointer"
                >
                  {t('catalog.col_stock')} ({selectedBranch?.name || activeBranchName})
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columns.uom}
                  onCheckedChange={() => toggleColumn('uom')}
                  className="rounded-lg text-xs font-medium cursor-pointer"
                >
                  {t('catalog.col_uom')}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columns.cost_price}
                  onCheckedChange={() => toggleColumn('cost_price')}
                  className="rounded-lg text-xs font-medium cursor-pointer"
                >
                  {t('catalog.col_cost_price')}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columns.selling_price}
                  onCheckedChange={() => toggleColumn('selling_price')}
                  className="rounded-lg text-xs font-medium cursor-pointer"
                >
                  {t('catalog.col_selling_price')}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columns.margin}
                  onCheckedChange={() => toggleColumn('margin')}
                  className="rounded-lg text-xs font-medium cursor-pointer"
                >
                  {t('catalog.col_gross_margin')}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columns.barcode}
                  onCheckedChange={() => toggleColumn('barcode')}
                  className="rounded-lg text-xs font-medium cursor-pointer"
                >
                  {t('catalog.col_barcode')}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columns.min_stock}
                  onCheckedChange={() => toggleColumn('min_stock')}
                  className="rounded-lg text-xs font-medium cursor-pointer"
                >
                  {t('catalog.col_min_stock_alert')}
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />
                <DropdownMenuItem
                  onClick={resetColumns}
                  className="rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer flex items-center justify-between"
                >
                  <span>{t('catalog.reset_default')}</span>
                  <RotateCcw className="w-3 h-3" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="text-xs text-slate-400 dark:text-slate-500 font-medium pl-1">
              {t('catalog.items_count', { count: products.length, total: totalItems || products.length })}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 text-center text-slate-500">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                <span>{t('catalog.loading')}</span>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{t('catalog.no_products')}</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  {search ? t('catalog.no_products_matching', { search }) : t('catalog.no_products_subtitle')}
                </p>
                <PermissionGuard permission="catalog:create">
                  <Link href="/catalog/products/new">
                    <Button size="sm" className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">
                      {t('catalog.add_first_product')}
                    </Button>
                  </Link>
                </PermissionGuard>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                  <tr>
                    <th className="px-6 py-4 font-semibold">{t('catalog.col_product')}</th>
                    {columns.sku && <th className="px-6 py-4 font-semibold">{t('catalog.col_sku')}</th>}
                    {columns.type && <th className="px-6 py-4 font-semibold">{t('catalog.col_type')}</th>}
                    {columns.category && <th className="px-6 py-4 font-semibold">{t('catalog.col_category')}</th>}
                    {!isRestaurant && columns.brand && <th className="px-6 py-4 font-semibold">{t('catalog.col_brand')}</th>}
                    {columns.stock && (
                      <th className="px-6 py-4 text-right font-semibold">
                        <div className="flex items-center justify-end gap-1">
                          <span>{t('catalog.col_stock')}</span>
                          <span className="text-[9px] font-normal lowercase tracking-normal text-slate-400 dark:text-slate-500">
                            ({selectedBranch?.name || activeBranchName})
                          </span>
                        </div>
                      </th>
                    )}
                    {columns.uom && <th className="px-6 py-4 font-semibold">{t('catalog.col_uom')}</th>}
                    {columns.cost_price && <th className="px-6 py-4 text-right font-semibold">{t('catalog.col_cost_price')}</th>}
                    {columns.selling_price && <th className="px-6 py-4 text-right font-semibold">{t('catalog.col_selling_price')}</th>}
                    {columns.margin && <th className="px-6 py-4 text-right font-semibold">{t('catalog.col_margin')}</th>}
                    {columns.barcode && <th className="px-6 py-4 font-semibold">{t('catalog.col_barcode')}</th>}
                    {columns.min_stock && <th className="px-6 py-4 text-right font-semibold">{t('catalog.col_min_stock')}</th>}
                    <th className="px-6 py-4 text-right font-semibold">{t('catalog.col_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                      {/* Product & Thumbnail */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img 
                              src={product.image_url.startsWith('http') ? product.image_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${product.image_url}`} 
                              alt={product.name} 
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs flex-shrink-0" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center text-slate-400 text-xs flex-shrink-0">
                              <Box className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs">{product.name}</div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">{product.barcode || t('catalog.no_barcode')}</div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      {columns.sku && (
                        <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                          {product.sku || '-'}
                        </td>
                      )}

                      {/* Type Badge */}
                      {columns.type && (
                        <td className="px-6 py-4">
                          {product.type === 'SIMPLE' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
                              {t('catalog.type_simple')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200/50 dark:border-purple-500/20">
                              {t('catalog.type_variable')}
                            </span>
                          )}
                        </td>
                      )}

                      {/* Category */}
                      {columns.category && (
                        <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                          {product.category?.name ? (
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {product.category.name}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      )}

                      {/* Brand */}
                      {!isRestaurant && columns.brand && (
                        <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                          {product.brand?.name || '-'}
                        </td>
                      )}

                      {/* Stock for Selected Branch */}
                      {columns.stock && (
                        <td className="px-6 py-4 text-right">
                          {(() => {
                            const stock = getProductStock(product, selectedBranchId);
                            const minLevel = Number(product.min_stock_level) || 0;
                            const uomCode = product.base_uom?.code || product.base_uom?.name || '';
                            
                            let badgeClass = "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20";
                            let statusLabel = t('catalog.in_stock');

                            if (stock <= 0) {
                              badgeClass = "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-500/20";
                              statusLabel = t('catalog.out_of_stock');
                            } else if (minLevel > 0 && stock <= minLevel) {
                              badgeClass = "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/20";
                              statusLabel = t('catalog.low_stock');
                            }

                            return (
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                                  {stock.toLocaleString()} {uomCode}
                                </span>
                                <span className={cn("text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded-md border tracking-wider", badgeClass)}>
                                  {statusLabel}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                      )}

                      {/* Base UOM */}
                      {columns.uom && (
                        <td className="px-6 py-4 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {product.base_uom ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 text-[11px]">
                              {product.base_uom.code || product.base_uom.name}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      )}

                      {/* Cost Price */}
                      {columns.cost_price && (
                        <td className="px-6 py-4 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                          {product.cost_price ? `৳${(Number(product.cost_price) / 100).toFixed(2)}` : '-'}
                        </td>
                      )}

                      {/* Selling Price */}
                      {columns.selling_price && (
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {renderPrice(product)}
                        </td>
                      )}

                      {/* Margin % */}
                      {columns.margin && (
                        <td className="px-6 py-4 text-right">
                          {(() => {
                            const cost = Number(product.cost_price) || 0;
                            const price = Number(product.selling_price) || 0;
                            if (cost <= 0 || price <= 0) return <span className="text-slate-400 text-xs">-</span>;
                            const margin = ((price - cost) / price) * 100;
                            return (
                              <span className={cn(
                                "text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border",
                                margin >= 25 
                                  ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/50"
                                  : margin > 0
                                    ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200/50"
                                    : "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200/50"
                              )}>
                                {margin > 0 ? `+${margin.toFixed(1)}%` : `${margin.toFixed(1)}%`}
                              </span>
                            );
                          })()}
                        </td>
                      )}

                      {/* Barcode */}
                      {columns.barcode && (
                        <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                          {product.barcode || '-'}
                        </td>
                      )}

                      {/* Min Stock */}
                      {columns.min_stock && (
                        <td className="px-6 py-4 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                          {product.min_stock_level ? `${Number(product.min_stock_level).toLocaleString()} ${product.base_uom?.code || ''}` : '-'}
                        </td>
                      )}

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5 items-center">
                          <PermissionGuard permission="catalog:update">
                            <Link href={`/catalog/products/${product.id}`}>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600 px-3 shadow-2xs gap-1.5"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>{t('catalog.edit')}</span>
                              </Button>
                            </Link>
                          </PermissionGuard>
                          <PermissionGuard permission="catalog:delete">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleArchive(product.id, product.name)}
                              className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700 text-slate-400 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2.5 shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {!loading && products.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/80">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalItems / itemsPerPage) || 1}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={(size) => {
                  setItemsPerPage(size);
                  setCurrentPage(1);
                }}
                totalItems={totalItems}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
