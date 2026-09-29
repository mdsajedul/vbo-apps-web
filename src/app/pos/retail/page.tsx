'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { productsApi, categoriesApi, branchesApi, posApi, customersApi } from '@/lib/api';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/lib/auth-store';
import {
  Search, X, ArrowLeft, Clock, User, ShoppingCart,
  Plus, Minus, Trash2, UserPlus, Percent, Receipt,
  LayoutGrid, List, LogOut, ChevronDown, Barcode, ShieldAlert, Tag, ArrowRight
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { OpenShiftModal } from '@/components/pos/OpenShiftModal';
import { CloseShiftModal } from '@/components/pos/CloseShiftModal';
import { BranchRequiredGuard } from '@/components/guards/BranchRequiredGuard';
import { PosBranchSwitcher } from '@/components/pos/PosBranchSwitcher';
import { useBranchStore } from '@/lib/branch-store';
import { useTranslation } from '@/i18n';
import { toast } from 'sonner';

export default function RetailPosPage() {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const cart = useCartStore();
  const auth = useAuthStore();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [activeBranch, setActiveBranch] = useState<string>('');
  const [shift, setShift] = useState<any>(null);
  const [crossBranchShift, setCrossBranchShift] = useState<any>(null);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MFS'>('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<any>(null);

  // Wire Scanner
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If F2 is pressed, focus search
      if (e.key === 'F2') {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      
      // Auto-focus search if typing alphanumeric characters and not in an input
      if (
        e.key.length === 1 && 
        !e.ctrlKey && !e.metaKey && !e.altKey &&
        document.activeElement?.tagName !== 'INPUT' && 
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch initial Retail POS data
  useEffect(() => {
    async function loadData() {
      try {
        const [prods, catTree, branchData] = await Promise.all([
          productsApi.getAll(),
          categoriesApi.getTree(),
          branchesApi.getAll()
        ]);
        const rawProds = prods.data || prods;
        setProducts(Array.isArray(rawProds) ? rawProds : []);

        const flat: any[] = [];
        const flatten = (cats: any[]) => {
          cats.forEach(c => {
            flat.push(c);
            if (c.children) flatten(c.children);
          });
        };
        flatten(catTree || []);
        setCategories(flat);

        const activeBranches = branchData.data || branchData || [];
        setBranches(activeBranches);
        const storeBranchId = useBranchStore.getState().selectedBranchId;
        const targetBranchId =
          storeBranchId && storeBranchId !== 'ALL' && activeBranches.some((b: any) => b.id === storeBranchId)
            ? storeBranchId
            : activeBranches[0]?.id;

        if (targetBranchId) {
          setActiveBranch(targetBranchId);
          try {
            const currentShift = await posApi.getCurrentShift(targetBranchId);
            if (currentShift) {
              setShift(currentShift);
              setCrossBranchShift(null);
            } else {
              setShift(null);
              const globalShift = await posApi.getActiveGlobalShift().catch(() => null);
              if (globalShift && globalShift.branch_id !== targetBranchId) {
                setCrossBranchShift(globalShift);
              } else {
                setCrossBranchShift(null);
                setShowOpenShiftModal(true);
              }
            }
          } catch (e) {
            setShift(null);
            const globalShift = await posApi.getActiveGlobalShift().catch(() => null);
            if (globalShift && globalShift.branch_id !== targetBranchId) {
              setCrossBranchShift(globalShift);
            } else {
              setCrossBranchShift(null);
              setShowOpenShiftModal(true);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load Retail POS data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Reactively reload active shift when branch context changes
  useEffect(() => {
    if (!selectedBranchId || selectedBranchId === 'ALL') return;
    setActiveBranch(selectedBranchId);
    setShift(null);
    setCrossBranchShift(null);
    posApi
      .getCurrentShift(selectedBranchId)
      .then(async (currentShift) => {
        if (currentShift) {
          setShift(currentShift);
          setCrossBranchShift(null);
        } else {
          setShift(null);
          const globalShift = await posApi.getActiveGlobalShift().catch(() => null);
          if (globalShift && globalShift.branch_id !== selectedBranchId) {
            setCrossBranchShift(globalShift);
          } else {
            setCrossBranchShift(null);
          }
        }
      })
      .catch(async () => {
        setShift(null);
        const globalShift = await posApi.getActiveGlobalShift().catch(() => null);
        if (globalShift && globalShift.branch_id !== selectedBranchId) {
          setCrossBranchShift(globalShift);
        } else {
          setCrossBranchShift(null);
        }
      });
  }, [selectedBranchId]);

  // Filter products for Retail View
  const filteredProducts = products.filter((p) => {
    if (p.status && p.status === 'ARCHIVED') return false;
    if (p.is_pos_visible === false) return false;
    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
    const matchesCategory = activeCategory === 'all' || p.category_id === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: any, variant?: any) => {
    cart.addItem({
      product_id: product.id,
      variant_id: variant?.id,
      name: variant ? `${product.name} — ${variant.name}` : product.name,
      sku: variant?.sku || product.sku || 'RETAIL-SKU',
      barcode: variant?.barcode || product.barcode,
      unit_price: Number(variant?.selling_price || product.selling_price || 0),
      tax_rate_percentage: product.taxRate ? Number(product.taxRate.percentage) : (product.tax_rate_percentage || 0),
      image_url: product.image_url,
    }, 1);
    toast.success(`Added ${variant ? variant.name : product.name} to cart`);
    setSelectedProductForVariant(null);
  };

  const handleProductClick = (product: any) => {
    if (product.variants && product.variants.length > 0) {
      setSelectedProductForVariant(product);
    } else {
      handleAddToCart(product);
    }
  };

  const handleCheckoutSubmit = async () => {
    if (cart.items.length === 0) return;
    
    if (!shift?.id) {
      toast.error('No active register shift found. Please open a shift first.');
      setShowCheckout(false);
      setShowOpenShiftModal(true);
      return;
    }

    if (!activeBranch) {
      toast.error('No active branch selected.');
      return;
    }

    const parsedAmountPaid = parseFloat(amountPaid) * 100;
    const finalAmountPaid = !isNaN(parsedAmountPaid) && parsedAmountPaid > 0 ? parsedAmountPaid : cart.getGrandTotal();
    
    if (finalAmountPaid < cart.getGrandTotal()) {
      toast.error(`Amount paid (৳${(finalAmountPaid/100).toFixed(2)}) cannot be less than Grand Total (৳${(cart.getGrandTotal()/100).toFixed(2)})`);
      return;
    }

    try {
      const payload = {
        shift_id: shift?.id,
        branch_id: activeBranch,
        payment_method: paymentMethod,
        amount_paid: finalAmountPaid,
        change_due: Math.max(0, finalAmountPaid - cart.getGrandTotal()),
        customer_id: cart.customer?.id,
        items: cart.items.map(i => ({
          product_id: i.product_id,
          variant_id: i.variant_id,
          product_name: i.name,
          sku: i.sku,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount_amount: i.discount_amount,
          tax_amount: i.tax_amount,
          tax_rate_percentage: i.tax_rate_percentage,
          line_total: i.line_total
        })),
        subtotal: cart.getSubtotal(),
        grand_total: cart.getGrandTotal(),
        discount_amount: cart.getDiscountTotal(),
        tax_total: cart.getTaxTotal(),
      };
      await posApi.checkout(payload);
      toast.success('🎉 Retail Sale Completed Successfully!');
      cart.clearCart();
      setShowCheckout(false);
      setAmountPaid('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-slate-300">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto" />
          <p className="text-sm font-semibold">Loading Retail POS Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <BranchRequiredGuard featureName="Retail POS">
      <div className="h-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
        {/* Retail Header Bar */}
        <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center space-x-3">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-lg tracking-tight text-white">BOS <span className="text-blue-400">Retail POS</span></span>
            <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-mono">HANDS-FREE SCANNER ACTIVE</span>
          </div>
        </div>

        {/* Branch / Shift Selector */}
        <div className="flex items-center space-x-3">
          <PosBranchSwitcher activeShift={shift} />
          {shift ? (
            <button
              onClick={() => setShowCloseShiftModal(true)}
              className="p-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
              title="Active Register Shift — Click to Close / Audit"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t('pos.current_shift', undefined, 'Shift Open')}</span>
              <span className="text-[10px] font-mono opacity-80">(Float: ৳{(shift.starting_cash / 100).toFixed(0)})</span>
            </button>
          ) : crossBranchShift ? (
            <button
              onClick={() => {
                useBranchStore.getState().setBranch(crossBranchShift.branch_id);
                router.push('/pos');
              }}
              className="p-1.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
              title={`Shift Open at ${crossBranchShift.branch?.name || 'Another Branch'} — Click to Switch`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Shift at {crossBranchShift.branch?.name || 'Other Branch'}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowOpenShiftModal(true)}
              className="p-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
              title="No Active Shift — Click to Open Register Shift"
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>{t('pos.open_shift', undefined, 'Open Shift')}</span>
            </button>
          )}

          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{auth.user?.full_name || 'Cashier'}</p>
            <p className="text-[10px] text-slate-400">{auth.user?.email}</p>
          </div>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

      </header>

      {/* Shift Warning Banner */}
      {!shift && !loading && (
        crossBranchShift ? (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between gap-3 text-amber-400 text-xs transition-colors shrink-0 z-30">
            <div className="flex items-center gap-2 font-medium">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Active drawer open at <strong>{crossBranchShift.branch?.name || 'another branch'}</strong>. Single shift policy requires closing that drawer first.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                useBranchStore.getState().setBranch(crossBranchShift.branch_id);
                router.push('/pos');
              }}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition-colors shadow-sm shrink-0 flex items-center gap-1.5"
            >
              <span>Switch to {crossBranchShift.branch?.name || 'Branch'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center justify-between gap-3 text-red-400 text-xs transition-colors shrink-0 z-30">
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span>No active register shift. Start a shift before taking orders or processing payments.</span>
            </div>
            <button
              type="button"
              onClick={() => setShowOpenShiftModal(true)}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm shrink-0"
            >
              Start Shift
            </button>
          </div>
        )
      )}

      {/* Main Retail Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Section: Product Grid & Barcode Search */}
        <div className="flex-1 flex flex-col border-r border-slate-800 bg-slate-900/60 overflow-hidden">
          {/* Scanner & Search Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center space-x-3">
            <div className="relative flex-1">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
              <input
                ref={searchRef}
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`${t('pos.search_products', undefined, 'Scan barcode or type SKU / Item Name...')} (F2)`}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-mono"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/20 flex gap-2 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${activeCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              {t('pos.all_categories', undefined, 'All Categories')}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${activeCategory === c.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock_quantity !== undefined && p.stock_quantity <= 0;
                return (
                <button
                  key={p.id}
                  onClick={() => handleProductClick(p)}
                  disabled={isOutOfStock}
                  className={`bg-slate-950 border border-slate-800 p-3 rounded-2xl flex flex-col justify-between text-left transition-all shadow-sm group ${isOutOfStock ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:border-blue-500/50 hover:scale-[1.02]'}`}
                >
                  <div>
                    <div className="text-xs font-mono text-slate-500 mb-1 flex items-center justify-between">
                      <span>{p.sku || 'SKU'}</span>
                      {p.barcode && <Tag className="w-3 h-3 text-blue-400" />}
                    </div>
                    <h4 className="font-semibold text-sm text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2">{p.name}</h4>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-emerald-400 font-bold">
                      ৳ {(Number(p.selling_price || 0) / 100).toFixed(2)}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${isOutOfStock ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                      {p.variants?.length ? `${p.variants.length} Variants` : (p.stock_quantity !== undefined ? `${p.stock_quantity} in stock` : 'In Stock')}
                    </span>
                  </div>
                </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Section: Retail Cart & Checkout Engine */}
        <div className="w-96 bg-slate-950 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold text-sm text-white">{t('pos.cart', undefined, 'Retail Cart')} ({cart.getItemCount()})</h2>
            </div>
            {cart.items.length > 0 && (
              <button onClick={() => cart.clearCart()} className="text-xs text-red-400 hover:text-red-300 font-semibold">{t('pos.clear_cart', undefined, 'Clear')}</button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <ShoppingCart className="w-10 h-10 opacity-30" />
                <p className="text-xs font-semibold">{t('pos.empty_cart', undefined, 'Cart is empty')}. {t('pos.empty_cart_subtitle', undefined, 'Scan barcode or click item')}.</p>
              </div>
            ) : (
              cart.items.map((item) => (
                <div key={item.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-xs text-white">{item.name}</h4>
                      <p className="text-[10px] font-mono text-slate-400">৳ {(item.unit_price / 100).toFixed(2)}</p>
                    </div>
                    <button onClick={() => cart.removeItem(item.id)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => cart.updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold text-white">-</button>
                      <span className="text-xs font-mono font-bold text-white px-2">{item.quantity}</span>
                      <button onClick={() => cart.updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold text-white">+</button>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">৳ {((item.unit_price * item.quantity) / 100).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Totals & Checkout Button */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/80 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-400 font-mono">
              <div className="flex justify-between"><span>{t('pos.subtotal', undefined, 'Subtotal')}</span><span>৳ {(cart.getSubtotal() / 100).toFixed(2)}</span></div>
              <div className="flex justify-between text-emerald-400"><span>{t('pos.grand_total', undefined, 'Grand Total')}</span><span className="text-lg font-extrabold text-white">৳ {(cart.getGrandTotal() / 100).toFixed(2)}</span></div>
            </div>

            <button
              disabled={cart.items.length === 0}
              onClick={() => {
                if (!shift?.id) {
                  toast.error('Active shift required. Please open a register shift first.');
                  setShowOpenShiftModal(true);
                  return;
                }
                setShowCheckout(true);
              }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-sm shadow-lg transition-all"
            >
              {t('pos.pay_now', undefined, 'Complete Sale')} (F12)
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCheckout(false)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Complete Retail Checkout</h3>
            <div className="text-2xl font-bold text-emerald-400 text-center py-2 bg-slate-950 rounded-xl border border-slate-800 font-mono">
              ৳ {(cart.getGrandTotal() / 100).toFixed(2)}
            </div>

            {!shift?.id && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between gap-2 text-red-400 text-xs">
                <span>No active register shift. Start a shift to pay.</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckout(false);
                    setShowOpenShiftModal(true);
                  }}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs"
                >
                  Start Shift
                </button>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {(['CASH', 'CARD', 'MFS'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 rounded-xl text-xs font-bold ${paymentMethod === m ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-400">Amount Paid (৳)</label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder={(cart.getGrandTotal() / 100).toFixed(2)}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-lg focus:outline-none focus:border-emerald-500"
              />
              {parseFloat(amountPaid) > 0 && (parseFloat(amountPaid) * 100 - cart.getGrandTotal()) >= 0 && (
                <div className="text-xs text-slate-400 flex justify-between mt-1">
                  <span>Change Due:</span>
                  <span className="font-bold text-emerald-400">৳ {((parseFloat(amountPaid) * 100 - cart.getGrandTotal()) / 100).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <button onClick={() => setShowCheckout(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">Cancel</button>
              <button onClick={handleCheckoutSubmit} className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl text-xs">Confirm Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* Variant Selection Modal */}
      {selectedProductForVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedProductForVariant(null)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Select Variant for {selectedProductForVariant.name}</h3>
            
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {selectedProductForVariant.variants.map((v: any) => (
                <button
                  key={v.id}
                  onClick={() => handleAddToCart(selectedProductForVariant, v)}
                  className="w-full p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left flex justify-between items-center transition-colors"
                >
                  <span className="font-semibold text-white text-sm">{v.name}</span>
                  <span className="text-emerald-400 font-bold text-sm font-mono">৳ {(v.selling_price / 100).toFixed(2)}</span>
                </button>
              ))}
            </div>

            <button onClick={() => setSelectedProductForVariant(null)} className="w-full py-3 bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold rounded-xl text-xs transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Open & Close Register Shift Modals */}
      <OpenShiftModal
        isOpen={showOpenShiftModal}
        onClose={() => setShowOpenShiftModal(false)}
        branchId={selectedBranchId && selectedBranchId !== 'ALL' ? selectedBranchId : (activeBranch || branches[0]?.id || '')}
        onSuccess={(newShift) => {
          setShift(newShift);
          setCrossBranchShift(null);
        }}
      />

      <CloseShiftModal
        isOpen={showCloseShiftModal}
        onClose={() => setShowCloseShiftModal(false)}
        shift={shift}
        onSuccess={() => {
          setShift(null);
        }}
      />
      </div>
    </BranchRequiredGuard>
  );
}
