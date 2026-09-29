'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { restaurantApi } from '@/lib/restaurant-api';
import { categoriesApi, branchesApi, posApi, productsApi } from '@/lib/api';
import { useRestaurantCartStore } from '@/store/useRestaurantCartStore';
import { usePosKeyboardShortcuts } from '@/hooks/usePosKeyboardShortcuts';

import { useAuthStore } from '@/lib/auth-store';
import {
  Utensils, UtensilsCrossed, Clock, User, UserPlus, ShoppingCart,
  Plus, Minus, Trash2, ChefHat, RefreshCw, Search, Settings, Pencil, ChevronDown, ChevronUp, X, Shield, Menu, LogOut, Truck, Package, Receipt,
  ShieldAlert, ArrowRight
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RestaurantCheckoutModal } from '@/components/pos/RestaurantCheckoutModal';
import { ModifierSheet } from '@/components/pos/ModifierSheet';
import { ItemNoteEditor } from '@/components/pos/ItemNoteEditor';
import { HeldOrdersModal } from '@/components/pos/HeldOrdersModal';
import { DiscountModal } from '@/components/pos/DiscountModal';
import { ReceiptPrintModal } from '@/components/pos/ReceiptPrintModal';
import { SplitBillModal } from '@/components/pos/SplitBillModal';
import { DeliveryInfoModal } from '@/components/pos/DeliveryInfoModal';
import { ActiveOrdersTab } from '@/components/pos/ActiveOrdersTab';
import { OpenShiftModal } from '@/components/pos/OpenShiftModal';
import { CloseShiftModal } from '@/components/pos/CloseShiftModal';
import { InlinePaymentPanel } from '@/components/pos/InlinePaymentPanel';
import { CancelSessionModal } from '@/components/pos/CancelSessionModal';
import { CustomerInfoModal } from '@/components/pos/CustomerInfoModal';
import { DishCard } from '@/components/pos/restaurant/DishCard';
import { FloorPlanView } from '@/components/pos/restaurant/FloorPlanView';
import { BranchRequiredGuard } from '@/components/guards/BranchRequiredGuard';
import { PosBranchSwitcher } from '@/components/pos/PosBranchSwitcher';
import { useBranchStore } from '@/lib/branch-store';
import { toast } from 'sonner';


export default function RestaurantPosPage() {
  const router = useRouter();
  const cart = useRestaurantCartStore();
  const auth = useAuthStore();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'ITEMS' | 'FLOOR_PLAN' | 'ACTIVE_ORDERS'>('ITEMS');
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);
  const [isMobileTableDropdownOpen, setIsMobileTableDropdownOpen] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY !== null) {
      const currentY = e.touches[0].clientY;
      const diff = touchStartY - currentY;
      if (diff > 30) {
        setShowMobileCart(true);
        setTouchStartY(null);
      }
    }
  };
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DINE_IN');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    delivery_driver: '',
    notes: '',
  });

  const [shift, setShift] = useState<any>(null);
  const [crossBranchShift, setCrossBranchShift] = useState<any>(null);
  const [posConfig, setPosConfig] = useState<any>({
    kot_enabled: true,
    table_management_enabled: true,
    takeaway_enabled: true,
    delivery_enabled: true,
    service_charge_enabled: false,
    service_charge_pct: 0,
    tax_rate_pct: 5,
    default_order_type: 'DINE_IN',
    enabled_payment_methods: JSON.stringify(['CASH', 'CARD', 'BKASH', 'NAGAD', 'ROCKET']),
  });

  const [branches, setBranches] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  const getUserRoleBadge = (user: any) => {
    if (!user) return 'CASHIER';
    if (user.is_super_admin) return 'SUPER ADMIN';

    const rawRole = user.roles?.[0];
    if (typeof rawRole === 'string' && rawRole) return rawRole.toUpperCase();
    if (rawRole?.role?.name) return rawRole.role.name.toUpperCase();
    if (rawRole?.name) return rawRole.name.toUpperCase();
    if (user.role) return user.role.toUpperCase();

    return 'OWNER';
  };

  const checkAdminAccess = (user: any) => {
    if (!user) return false;
    if (user.is_super_admin) return true;

    const badge = getUserRoleBadge(user);
    return ['ADMIN', 'SUPER ADMIN', 'OWNER', 'BRANCH_MANAGER', 'MANAGER'].some((r) => badge.includes(r));
  };

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Phase 3 States
  const [selectedProductForModifier, setSelectedProductForModifier] = useState<any>(null);
  const [productModifierGroups, setProductModifierGroups] = useState<any[]>([]);
  const [showModifierSheet, setShowModifierSheet] = useState(false);

  const [editingNoteItem, setEditingNoteItem] = useState<any>(null);
  const [showNoteEditor, setShowNoteEditor] = useState(false);

  // Phase 4 States
  const [showHeldModal, setShowHeldModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [ticketDiscount, setTicketDiscount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');

  // Phase 5 States
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [settledSaleData, setSettledSaleData] = useState<any>(null);
  const [receiptCartItems, setReceiptCartItems] = useState<any[]>([]);
  const [receiptGrandTotal, setReceiptGrandTotal] = useState<number>(0);

  // Cancellation States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Register Shift States
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [submittingInline, setSubmittingInline] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);



  const handleHoldTicket = async () => {
    if (!selectedSession || !selectedSession.id || selectedSession.id.startsWith('temp-') || selectedSession.id.startsWith('takeaway-') || selectedSession.id.startsWith('delivery-')) {
      toast.error('No active server session to hold');
      return;
    }
    try {
      toast.loading('Parking ticket...', { id: 'hold-toast' });
      await restaurantApi.holdSession(selectedSession.id);
      toast.success('Ticket placed on hold!', { id: 'hold-toast' });
      cart.clearActiveCart();
      setSelectedSession(null);
      await fetchDiningSessions();
      setActiveTab('FLOOR_PLAN');
    } catch (err) {
      console.error('Failed to hold ticket', err);
      toast.error('Failed to hold ticket', { id: 'hold-toast' });
    }
  };

  const handleCancelOrder = async (reason: string) => {
    if (!selectedSession || !selectedSession.id || selectedSession.id.startsWith('temp-') || selectedSession.id.startsWith('takeaway-') || selectedSession.id.startsWith('delivery-')) {
      cart.clearActiveCart();
      setSelectedSession(null);
      setShowCancelModal(false);
      setCancelReason('');
      toast.success('Draft ticket discarded');
      return;
    }

    if (!reason?.trim()) {
      toast.error('Please enter a cancellation reason');
      return;
    }

    try {
      toast.loading('Cancelling dining session...', { id: 'cancel-toast' });
      await restaurantApi.cancelSession(selectedSession.id, reason);
      toast.success('Session cancelled & table freed!', { id: 'cancel-toast' });
      cart.clearActiveCart();
      setSelectedSession(null);
      setShowCancelModal(false);
      setCancelReason('');
      await fetchDiningSessions();
      setActiveTab('FLOOR_PLAN');
    } catch (err) {
      console.error('Failed to cancel session', err);
      toast.error('Failed to cancel session', { id: 'cancel-toast' });
    }
  };

  const handleDishClick = async (item: any) => {

    if (item.is_eighty_sixed) {
      toast.error('This item is currently 86\'d (unavailable).');
      return;
    }
    try {
      const groups = await restaurantApi.getProductModifiers(item.id).catch(() => []);
      if (groups && Array.isArray(groups) && groups.length > 0) {
        setSelectedProductForModifier(item);
        setProductModifierGroups(groups);
        setShowModifierSheet(true);
        return;
      }
    } catch (e) {}

    // Direct add if no modifiers
    cart.addItem({
      product_id: item.id,
      name: item.name,
      sku: item.sku || 'DISH',
      unit_price: Number(item.selling_price || 0),
      tax_rate_percentage: Number(posConfig.tax_rate_pct || 5),
      image_url: item.image_url,
    } as any, 1);
  };

  const handleConfirmModifiers = (selectedModifiers: any[], selectedPortion?: any) => {
    if (!selectedProductForModifier) return;

    const basePrice = Number(selectedProductForModifier.selling_price || 0);
    // ModifierSheet passes PortionSize = { id, name, selling_price }.
    const portionPrice = selectedPortion?.selling_price
      ? Number(selectedPortion.selling_price) - basePrice
      : 0;
    const nameWithSize = selectedPortion?.name
      ? `${selectedProductForModifier.name} (${selectedPortion.name})`
      : selectedProductForModifier.name;

    cart.addItem({
      product_id: selectedProductForModifier.id,
      variant_id: selectedPortion?.id || undefined,
      menu_item_id: selectedProductForModifier.menu_item_id || undefined,
      name: nameWithSize,
      sku: selectedProductForModifier.sku || 'DISH',
      unit_price: basePrice + portionPrice,
      tax_rate_percentage: Number(posConfig.tax_rate_pct || 5),
      image_url: selectedProductForModifier.image_url,
      modifiers: selectedModifiers.map((m: any) => ({
        id: m.modifier_id || m.id,
        name: m.modifier_name || m.name,
        price: m.modifier_price || m.price || 0,
      })),
    } as any, 1);
  };

  const handleSaveItemNote = (note: string) => {
    if (!editingNoteItem) return;
    cart.updateItemNotes(editingNoteItem.id, note);
  };


  const fetchDiningSessions = async (isInitialLoad: boolean = false) => {
    if (isInitialLoad) {
      setLoading(true);
    }
    try {
      const branchesData = await branchesApi.getAll().catch(() => []);
      const activeBranches = branchesData.data || branchesData || [];
      const storeBranchId = useBranchStore.getState().selectedBranchId;
      const activeBranchId =
        storeBranchId && storeBranchId !== 'ALL' && activeBranches.some((b: any) => b.id === storeBranchId)
          ? storeBranchId
          : activeBranches[0]?.id;
      setBranches(activeBranches);


      const [floorPlansData, sessData, rawProdsRes, catsTree, configData, activeShift] = await Promise.all([
        restaurantApi.getFloorPlans(activeBranchId).catch(() => []),
        restaurantApi.getActiveSessions().catch(() => []),
        restaurantApi.getActiveMenuItems().catch(() => []),
        categoriesApi.getTree().catch(() => []),
        restaurantApi.getConfig(activeBranchId).catch(() => null),
        activeBranchId ? posApi.getCurrentShift(activeBranchId).catch(() => null) : null,
      ]);

      if (activeShift) {
        setShift(activeShift);
        setCrossBranchShift(null);
      } else {
        setShift(null);
        const globalShift = await posApi.getActiveGlobalShift().catch(() => null);
        if (globalShift && globalShift.branch_id !== activeBranchId) {
          setCrossBranchShift(globalShift);
        } else {
          setCrossBranchShift(null);
          if (isInitialLoad) {
            setShowOpenShiftModal(true);
          }
        }
      }

      if (configData) {
        setPosConfig(configData);
        if (configData.default_order_type) {
          setOrderType(configData.default_order_type as any);
        }
        if (configData.table_management_enabled === false) {
          setActiveTab('ITEMS');
        }
      }

      const activeSessList = Array.isArray(sessData) ? sessData : [];
      setSessions(activeSessList);

      let rawProds = Array.isArray(rawProdsRes) ? rawProdsRes : (rawProdsRes?.data || []);
      if (!rawProds || rawProds.length === 0) {
        try {
          const fallback = await productsApi.getAll();
          rawProds = Array.isArray(fallback) ? fallback : (fallback?.data || []);
        } catch (e) {
          console.error('Failed to load fallback products', e);
        }
      }

      const normalizedItems = rawProds
        .filter((item: any) => {
          if (item.deleted_at) return false;
          const prod = item.product || item;
          if (prod.status && prod.status === 'ARCHIVED') return false;
          if (prod.is_pos_visible === false) return false;
          return true;
        })
        .map((item: any) => {
          const prod = item.product || item;
          return {
            ...item,
            id: prod.id || item.id,
            menu_item_id: item.id,
            product_id: item.product_id || prod.id,
            name: prod.name || item.name || 'Unnamed Dish',
            selling_price: prod.selling_price ?? item.selling_price ?? 0,
            sku: prod.sku || item.sku || 'DISH',
            image_url: item.image_url || prod.image_url || null,
            category_id: item.menu_category_id || item.category_id || prod.category_id || item.menu_category?.id || item.category?.id || prod.category?.id || 'ALL',
            category: item.menu_category || item.category || prod.category || null,
            dietary_tags: typeof item.dietary_tags === 'string'
              ? item.dietary_tags.split(',').filter(Boolean)
              : (Array.isArray(item.dietary_tags) ? item.dietary_tags : []),
            is_eighty_sixed: Boolean(item.is_eighty_sixed),
          };
        });

      setMenuItems(normalizedItems);

      const flatCats: any[] = [];
      const flattenCats = (cats: any[]) => {
        cats.forEach((c: any) => {
          flatCats.push(c);
          if (c.children && Array.isArray(c.children)) flattenCats(c.children);
        });
      };
      flattenCats(Array.isArray(catsTree) ? catsTree : catsTree?.data || []);
      setCategories(flatCats);

      // Extract all physical tables from floor plans (excluding virtual system tables)
      const allTables: any[] = [];
      const plans = Array.isArray(floorPlansData.data || floorPlansData) ? (floorPlansData.data || floorPlansData) : [];
      plans.forEach((plan: any) => {
        if (plan.name?.toLowerCase().includes('virtual')) return;
        const zones = plan.dining_zones || plan.zones || [];
        zones.forEach((zone: any) => {
          if (zone.name?.toLowerCase().includes('virtual')) return;
          const tableList = zone.tables || [];
          tableList.forEach((tbl: any) => {
            if (tbl.table_number === 'TAKEAWAY' || tbl.table_number === 'DELIVERY' || tbl.name?.includes('TAKEAWAY') || tbl.name?.includes('DELIVERY')) return;
            const activeSess = activeSessList.find((s: any) => s.table_id === tbl.id || s.table?.id === tbl.id);
            allTables.push({
              ...tbl,
              zone_name: zone.name,
              activeSession: activeSess,
              isOccupied: Boolean(activeSess)
            });
          });
        });
      });

      setTables(allTables);
    } catch (err) {
      console.error('Failed to load restaurant POS data', err);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDiningSessions(true);
  }, []);

  useEffect(() => {
    if (selectedBranchId && selectedBranchId !== 'ALL') {
      setShift(null);
      setCrossBranchShift(null);
      fetchDiningSessions(false);
    }
  }, [selectedBranchId]);

  // Keyboard shortcuts
  usePosKeyboardShortcuts({
    onSearchFocus: () => searchInputRef.current?.focus(),
    onFireKOT: () => handleFireKOT(false),
    onHeldOrders: () => setShowHeldModal(true),
    onRefresh: () => fetchDiningSessions(),
    onSettle: () => {
      if (cart.items.length > 0) {
        // Settle is handled by the InlinePaymentPanel's internal submit
        // This focuses the settle area via a synthetic click
        const settleBtn = document.querySelector('[data-pos-settle-btn]') as HTMLButtonElement;
        if (settleBtn) settleBtn.click();
      }
    },
    onTab1: () => setActiveTab('ITEMS'),
    onTab2: () => posConfig.table_management_enabled !== false && setActiveTab('FLOOR_PLAN'),
    onTab3: () => setActiveTab('ACTIVE_ORDERS'),
  });

  const handleSelectTable = async (tbl: any) => {

    try {
      const activeSess = tbl.activeSession;
      let fullSession = activeSess;

      if (activeSess && activeSess.id) {
        try {
          fullSession = await restaurantApi.getSession(activeSess.id);
        } catch (e) {
          fullSession = activeSess;
        }
      }

      const activeSessionObj = fullSession ? {
        ...fullSession,
        table: fullSession.table || tbl,
      } : {
        table: tbl,
      };

      setSelectedSession(activeSessionObj);
      setOrderType('DINE_IN');
      cart.setOrderType('DINE_IN');
      cart.selectTable(tbl.id, fullSession);

      setActiveTab('ITEMS');

    } catch (err) {
      console.error('Failed to select table', err);
      toast.error('Failed to select table');
    }
  };

  const handleFireKOT = async (payNow: boolean = false) => {
    const newItems = cart.getNewItems();

    if (cart.items.length === 0) {
      toast.error('Cart is empty. Add items before firing');
      return;
    }

    const label = posConfig.kot_enabled !== false ? 'KOT' : 'Order';

    if (orderType === 'TAKEAWAY') {
      if (payNow) {
        if (!shift?.id) {
          toast.error('Active shift required. Please start a register shift first.');
          setShowOpenShiftModal(true);
          return;
        }
        setShowCheckoutModal(true);
        return;
      }
      toast.loading(`Creating Takeaway ${label}...`, { id: 'kot-toast' });
      try {
        await restaurantApi.createTakeawayOrder({
          items: cart.items.map((i) => ({
            product_id: i.product_id || i.id,
            menu_item_id: i.menu_item_id || undefined,
            product_name: i.name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            course: 'MAIN_COURSE',
            special_instructions: i.notes,
            modifier_selections: i.modifiers?.map((m: any) => ({
              modifier_id: m.id || m.name,
              modifier_name: m.name,
              modifier_price: m.price,
            })) || [],
          })),
          pay_now: false,
        });
        toast.success(`📦 Takeaway ${label} recorded!`, { id: 'kot-toast' });
        cart.clearActiveCart();
        setSelectedSession(null);
        await fetchDiningSessions();
      } catch (err) {
        toast.error('Failed to create takeaway order', { id: 'kot-toast' });
      }
      return;
    }

    if (orderType === 'DELIVERY') {
      if (!deliveryInfo.customer_name || !deliveryInfo.customer_phone || !deliveryInfo.delivery_address) {
        setShowDeliveryModal(true);
        toast.info('Please enter delivery details first.');
        return;
      }
      if (payNow) {
        setShowCheckoutModal(true);
        return;
      }
      toast.loading(`Creating Delivery ${label}...`, { id: 'kot-toast' });
      try {
        await restaurantApi.createDeliveryOrder({
          customer_name: deliveryInfo.customer_name,
          customer_phone: deliveryInfo.customer_phone,
          delivery_address: deliveryInfo.delivery_address,
          delivery_driver: deliveryInfo.delivery_driver,
          notes: deliveryInfo.notes,
          items: cart.items.map((i) => ({
            product_id: i.product_id || i.id,
            menu_item_id: i.menu_item_id || undefined,
            product_name: i.name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            course: 'MAIN_COURSE',
            special_instructions: i.notes,
            modifier_selections: i.modifiers?.map((m: any) => ({
              modifier_id: m.id || m.name,
              modifier_name: m.name,
              modifier_price: m.price,
            })) || [],
          })),
          pay_now: false,
        });
        toast.success(`🚚 Delivery ${label} recorded!`, { id: 'kot-toast' });
        cart.clearActiveCart();
        setSelectedSession(null);
        setDeliveryInfo({ customer_name: '', customer_phone: '', delivery_address: '', delivery_driver: '', notes: '' });
        await fetchDiningSessions();
      } catch (err) {
        toast.error('Failed to create delivery order', { id: 'kot-toast' });
      }
      return;
    }

    // Default Dine-In
    if (orderType === 'DINE_IN' && (!selectedSession || !selectedSession.table)) {
      toast.error('🚫 Please select a dining table for Dine-in orders', {
        description: 'Select a table from the sidebar dropdown or floor plan before firing KOT.',
      });
      return;
    }

    if (newItems.length === 0) {
      toast.info('All items in cart have already been sent to kitchen.');
      return;
    }

    toast.loading(`Saving ${label}...`, { id: 'kot-toast' });

    try {
      let targetSession = selectedSession;
      let targetSessionId = selectedSession?.id;

      if (!targetSessionId || targetSessionId.startsWith('temp-') || targetSessionId.startsWith('takeaway-') || targetSessionId.startsWith('delivery-')) {
        if (selectedSession?.table?.id) {
          const opened = await restaurantApi.openSession({
            table_id: selectedSession.table.id,
            guest_count: selectedSession.table.capacity || 4,
          });
          targetSessionId = opened.id;
          targetSession = { ...opened, table: selectedSession.table };
          setSelectedSession(targetSession);
        }
      }

      if (targetSessionId && !targetSessionId.startsWith('temp-') && !targetSessionId.startsWith('takeaway-') && !targetSessionId.startsWith('delivery-')) {
        await restaurantApi.addOrder(targetSessionId, {
          order_type: orderType,
          items: newItems.map((i) => ({
            product_id: i.product_id || i.id,
            menu_item_id: i.menu_item_id || undefined,
            product_name: i.name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            course: 'MAIN_COURSE',
            special_instructions: i.notes,
            modifier_selections: i.modifiers?.map((m: any) => ({
              modifier_id: m.id || m.name,
              modifier_name: m.name,
              modifier_price: m.price,
            })) || [],
          })),
        });
      }

      cart.markItemsFired(newItems.map((i) => i.id));

      const ticketNum = `${label}-${Math.floor(1000 + Math.random() * 9000)}`;
      toast.success(`🍳 ${label} #${ticketNum} saved!`, {
        id: 'kot-toast',
        description: `${newItems.length} new item(s) sent to kitchen.`
      });

      await fetchDiningSessions();
    } catch (err) {
      console.error('Failed to save order/KOT', err);
      toast.error('Failed to save order ticket', { id: 'kot-toast' });
    }
  };


  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-pos-surface text-stone-900 dark:text-slate-100 overflow-hidden">
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-pos-border flex items-center justify-between px-4 shrink-0 shadow-sm">
          <div className="flex items-center space-x-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-lg text-amber-500 dark:text-amber-400">BOS POS</span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 bg-pos-surface">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 p-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-stone-200 dark:bg-slate-800" />
                <div className="p-2.5 space-y-1.5">
                  <div className="h-3 bg-stone-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-2.5 bg-stone-100 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const subtotal = cart.getSubtotal();
  const discountedSubtotal = Math.max(subtotal - ticketDiscount, 0);
  const serviceChargePct = posConfig.service_charge_enabled !== false ? Number(posConfig.service_charge_pct || 0) : 0;
  const serviceChargeAmount = Math.round(discountedSubtotal * (serviceChargePct / 100));
  const taxPct = Number(posConfig.tax_rate_pct || 0);
  const taxAmount = Math.round((discountedSubtotal + serviceChargeAmount) * (taxPct / 100));
  const rawGrandTotal = discountedSubtotal + serviceChargeAmount + taxAmount;
  // Round to nearest Taka (100 paisa)
  const grandTotal = Math.round(rawGrandTotal / 100) * 100;

  return (
    <BranchRequiredGuard featureName="Restaurant POS">
      <div className="h-screen flex flex-col bg-pos-surface text-stone-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
        {/* =========================================================
         *  DESKTOP HEADER — compact single-row h-14 (md and above)
         *  Matches live version: logo left | tabs center | actions right
         * ========================================================= */}
        <header className="hidden md:flex h-14 items-center bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 w-full px-4 sticky top-0 z-40 transition-colors duration-200 shadow-sm">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <UtensilsCrossed className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-lg tracking-tight text-stone-900 dark:text-white">BOS POS</span>
          </div>

          {/* Center Tabs */}
          <nav className="flex-1 flex items-center justify-center gap-6 h-full">
            <button
              onClick={() => setActiveTab('ITEMS')}
              className={`h-full px-1 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'ITEMS'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Menu
            </button>
            {posConfig.table_management_enabled !== false && (
              <button
                onClick={() => setActiveTab('FLOOR_PLAN')}
                className={`h-full px-1 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'FLOOR_PLAN'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                Floor Plan
              </button>
            )}
            <button
              onClick={() => setActiveTab('ACTIVE_ORDERS')}
              className={`h-full px-1 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'ACTIVE_ORDERS'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Live Orders
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <PosBranchSwitcher activeShift={shift} />
            {checkAdminAccess(auth.user) && (
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl text-xs font-extrabold transition-all shadow-sm"
              title="Return to Main Dashboard"
            >
              <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Dashboard</span>
            </button>
          )}
          
          {/* Shift Button (Added back based on Live Design) */}
          {shift ? (
            <button
              onClick={() => setShowCloseShiftModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 rounded-xl text-xs font-bold transition-all shadow-sm"
              title="Active Register Shift — Click to Close / Audit"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Shift Open <span className="opacity-70 font-mono text-[10px] ml-0.5">(1/0)</span></span>
            </button>
          ) : crossBranchShift ? (
            <button
              onClick={() => {
                useBranchStore.getState().setBranch(crossBranchShift.branch_id);
                router.push('/pos');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30 rounded-xl text-xs font-bold transition-all shadow-sm"
              title={`Shift Open at ${crossBranchShift.branch?.name || 'Another Branch'} — Click to Switch`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Shift at {crossBranchShift.branch?.name || 'Other Branch'}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowOpenShiftModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30 rounded-xl text-xs font-bold transition-all shadow-sm"
              title="No Active Shift — Click to Open Register Shift"
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Open Shift</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('ACTIVE_ORDERS')}
            className="w-[28px] h-[28px] flex items-center justify-center rounded-xl bg-stone-200/80 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-300/60 dark:border-slate-700 shadow-sm hover:bg-stone-300/80 dark:hover:bg-slate-700 transition-colors"
            title="History / Active Orders"
          >
            <Clock className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-[28px] h-[28px] flex items-center justify-center rounded-xl bg-stone-200/80 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-300/60 dark:border-slate-700 shadow-sm hover:bg-stone-300/80 dark:hover:bg-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="w-[28px] h-[28px] rounded-xl bg-stone-200/80 dark:bg-slate-800 border border-stone-300/60 dark:border-slate-700 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
            <ThemeToggle className="w-full h-full rounded-none bg-transparent hover:bg-black/5 dark:hover:bg-white/10" />
          </div>
        </div>
      </header>

      {/* =========================================================
       *  MOBILE HEADER — stacked two-row layout (below md)
       * ========================================================= */}
      <header className="md:hidden bg-[#f7f9fb] dark:bg-[#0f1117] border-b border-[#e0e3e5] dark:border-slate-800 flex flex-col w-full px-4 pt-3 pb-0 sticky top-0 z-40 transition-colors duration-200">
        {/* Row 1: Logo + Hamburger + Theme */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2.5">
            <Utensils className="w-6 h-6 text-[#006c49] dark:text-[#4edea3] shrink-0" />
            <span className="font-bold text-[20px] leading-6 tracking-tight text-[#006c49] dark:text-[#4edea3]">BOS POS</span>
          </div>
          <div className="flex items-center gap-2">
            <PosBranchSwitcher activeShift={shift} />
            <button
              onClick={() => setShowMobileMenu(true)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[#eceef0] dark:bg-slate-800 text-[#191c1e] dark:text-white hover:bg-stone-300 dark:hover:bg-slate-700 transition-colors shadow-sm"
              title="Open Mobile POS Menu"
            >
              <Menu className="w-5 h-5 text-[#191c1e] dark:text-white" />
            </button>
            <div className="p-0.5 bg-stone-200/80 dark:bg-slate-800 border border-stone-300/60 dark:border-slate-700 rounded-xl shadow-sm">
              <ThemeToggle />
            </div>
          </div>
        </div>
        {/* Row 2: Mobile Tab Nav */}
        <nav className="flex w-full gap-6 items-center pt-1 px-1">
          <button
            onClick={() => setActiveTab('ITEMS')}
            className={`pb-3 px-1 text-[16px] whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'ITEMS'
                ? 'border-[#006c49] text-[#006c49] dark:text-[#4edea3] font-semibold'
                : 'border-transparent text-[#3c4a42] dark:text-slate-400 font-medium'
            }`}
          >
            Menu
          </button>
          {posConfig.table_management_enabled !== false && (
            <button
              onClick={() => setActiveTab('FLOOR_PLAN')}
              className={`pb-3 px-1 text-[16px] whitespace-nowrap transition-all border-b-2 ${
                activeTab === 'FLOOR_PLAN'
                  ? 'border-[#006c49] text-[#006c49] dark:text-[#4edea3] font-semibold'
                  : 'border-transparent text-[#3c4a42] dark:text-slate-400 font-medium'
              }`}
            >
              Floor Plan
            </button>
          )}
          <button
            onClick={() => setActiveTab('ACTIVE_ORDERS')}
            className={`pb-3 px-1 text-[16px] whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'ACTIVE_ORDERS'
                ? 'border-[#006c49] text-[#006c49] dark:text-[#4edea3] font-semibold'
                : 'border-transparent text-[#3c4a42] dark:text-slate-400 font-medium'
            }`}
          >
            Live Orders
          </button>
        </nav>
      </header>
 
      {/* Shift Warning Banner */}
      {!shift && !loading && (
        crossBranchShift ? (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 px-4 py-2 flex items-center justify-between gap-3 text-amber-800 dark:text-amber-300 text-xs transition-colors shrink-0 z-30">
            <div className="flex items-center gap-2 font-medium">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
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
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm shrink-0 flex items-center gap-1.5"
            >
              <span>Switch to {crossBranchShift.branch?.name || 'Branch'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/50 px-4 py-2 flex items-center justify-between gap-3 text-red-700 dark:text-red-400 text-xs transition-colors shrink-0 z-30">
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span>No active register shift. Start a shift to take orders or process payments.</span>
            </div>
            <button
              type="button"
              onClick={() => setShowOpenShiftModal(true)}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm shrink-0"
            >
              Start Shift
            </button>
          </div>
        )
      )}

      {/* Main Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'ACTIVE_ORDERS' ? (
          <ActiveOrdersTab
            onRecallSession={async (rawData) => {
              const sessionId = rawData.session_id || rawData.id;
              if (!sessionId) return;
              try {
                toast.loading('Loading ticket items...', { id: 'recall-toast' });
                const fullSession = await restaurantApi.getSession(sessionId);
                setSelectedSession(fullSession);

                // Determine order type from session or orders
                let recalledOrderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' = 'DINE_IN';
                if (fullSession.orders && fullSession.orders.length > 0) {
                  recalledOrderType = (fullSession.orders[0].order_type as any) || 'DINE_IN';
                } else if (rawData.type || rawData.order_type) {
                  recalledOrderType = rawData.type || rawData.order_type;
                } else if (fullSession.table?.table_number === 'TAKEAWAY') {
                  recalledOrderType = 'TAKEAWAY';
                } else if (fullSession.table?.table_number === 'DELIVERY') {
                  recalledOrderType = 'DELIVERY';
                }
                setOrderType(recalledOrderType);

                // Populate cart items
                cart.clearCart();
                if (fullSession.orders) {
                  fullSession.orders.forEach((order: any) => {
                    order.order_items?.forEach((item: any) => {
                      if (!item.is_void) {
                        cart.addItem({
                          product_id: item.product_id || item.id,
                          name: item.product_name,
                          sku: 'RECALLED',
                          unit_price: Number(item.unit_price),
                          tax_rate_percentage: Number(posConfig.tax_rate_pct || 5),
                        }, Number(item.quantity));
                      }
                    });
                  });
                }
                setActiveTab('ITEMS');
                toast.success(`Loaded ${recalledOrderType} ticket to sidebar`, { id: 'recall-toast' });
              } catch (err) {
                console.error('Failed to recall session', err);
                toast.error('Failed to recall ticket details', { id: 'recall-toast' });
              }
            }}
          />
        ) : activeTab === 'FLOOR_PLAN' && posConfig.table_management_enabled !== false ? (
          /* Floor Plan View */
          <div className="flex-1 p-6 overflow-y-auto bg-pos-surface space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">Dining Room Floor Plan</h2>
                <p className="text-xs text-stone-500 dark:text-slate-400">Select an occupied table session or start a new dining session.</p>
              </div>
            </div>

            <FloorPlanView tables={tables} onSelectTable={handleSelectTable} />
          </div>
        ) : (
          /* Order Session View */
          <div className="flex-1 flex overflow-hidden">
            {/* Menu Items Grid Container */}
            <div className="flex-1 p-4 overflow-y-auto bg-pos-surface flex flex-col space-y-4 transition-colors duration-200">
              {/* ===== DESKTOP: inline search + categories (single row) ===== */}
              <section className="hidden md:flex items-center gap-3 shrink-0 py-2">
                <div className="relative shrink-0 w-52">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dishes, drinks..."
                    className="w-full h-9 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-full pl-9 pr-3 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    aria-label="Search dishes and drinks"
                  />
                </div>
                <div className="flex-1 flex overflow-x-auto hide-scrollbar gap-2 items-center">
                  <button
                    onClick={() => setSelectedCategoryId('ALL')}
                    className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap shrink-0 font-semibold transition-colors ${
                      selectedCategoryId === 'ALL'
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    All Items
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap shrink-0 font-semibold transition-colors ${
                        selectedCategoryId === cat.id
                          ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </section>

              {/* ===== MOBILE: stacked search then categories ===== */}
              <section className="flex md:hidden flex-col gap-3 shrink-0 pt-3 pb-1">
                <div className="relative w-full">
                  <Search className="w-5 h-5 text-[#6c7a71] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dishes, drinks..."
                    className="w-full h-[45px] bg-white dark:bg-slate-900 border border-[#bbcabf] dark:border-slate-800 rounded-full pl-12 pr-4 text-[15px] text-[#191c1e] dark:text-white placeholder-[#6c7a71] dark:placeholder-slate-500 focus:outline-none focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/20 transition-all"
                    aria-label="Search dishes and drinks"
                  />
                </div>
                <div className="flex overflow-x-auto hide-scrollbar gap-2.5 pb-1">
                  <button
                    onClick={() => setSelectedCategoryId('ALL')}
                    className={`px-5 py-2.5 rounded-full text-[13px] whitespace-nowrap shrink-0 transition-colors ${
                      selectedCategoryId === 'ALL'
                        ? 'bg-[#2d3133] dark:bg-slate-800 text-white font-semibold shadow-sm'
                        : 'bg-white dark:bg-slate-900 border border-[#bbcabf] dark:border-slate-800 text-[#191c1e] dark:text-slate-300 font-medium hover:bg-[#eceef0] dark:hover:bg-slate-800'
                    }`}
                  >
                    All Items
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`px-5 py-2.5 rounded-full text-[13px] whitespace-nowrap shrink-0 transition-colors ${
                        selectedCategoryId === cat.id
                          ? 'bg-[#2d3133] dark:bg-slate-800 text-white font-semibold shadow-sm'
                          : 'bg-white dark:bg-slate-900 border border-[#bbcabf] dark:border-slate-800 text-[#191c1e] dark:text-slate-300 font-medium hover:bg-[#eceef0] dark:hover:bg-slate-800'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </section>

              {/* Rich Dish Cards Grid */}
              <div className="flex-1 overflow-y-auto">
                {menuItems.filter((item) => {
                  const dishName = item.name || item.product?.name || '';
                  const matchesSearch = !searchQuery || dishName.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesCat = selectedCategoryId === 'ALL' || item.category_id === selectedCategoryId || item.category?.id === selectedCategoryId || item.product?.category_id === selectedCategoryId;
                  return matchesSearch && matchesCat;
                }).length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-stone-400 dark:text-slate-500 space-y-2">
                    <UtensilsCrossed className="w-10 h-10 opacity-30 text-amber-500" />
                    <p className="text-xs font-bold text-stone-500 dark:text-slate-400">No dishes found matching your search</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 p-1">
                    {menuItems
                      .filter((item) => {
                        const dishName = item.name || item.product?.name || '';
                        const matchesSearch = !searchQuery || dishName.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchesCat = selectedCategoryId === 'ALL' || item.category_id === selectedCategoryId || item.category?.id === selectedCategoryId || item.product?.category_id === selectedCategoryId;
                        return matchesSearch && matchesCat;
                      })
                      .map((item) => (
                        <DishCard
                          key={item.id}
                          id={item.id}
                          name={item.name || item.product?.name || 'Unnamed Dish'}
                          sellingPrice={Number(item.selling_price || item.product?.selling_price || 0)}
                          imageUrl={item.image_url || item.product?.image_url}
                          categoryName={item.category?.name || item.menu_category?.name || item.product?.category?.name || 'Main Menu'}
                          dietaryTags={item.dietary_tags}
                          is86d={item.is_eighty_sixed}
                          item={item}
                          onClick={handleDishClick}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Side View (Desktop & Tablet) */}
            <div className="hidden md:flex md:w-[360px] lg:w-[420px] xl:w-[480px] bg-pos-card flex-col border-l border-pos-border shrink-0 shadow-lg transition-all duration-200">
              
              {/* Order Type & Payment Method Top Bar */}
              <div className="flex items-center justify-between gap-1 bg-stone-200/70 dark:bg-slate-950 p-1.5 border-b border-pos-border">
                {/* Order Type Tabs */}
                <div className="flex items-center space-x-1 shrink-0">
                  {posConfig.table_management_enabled !== false && (
                    <button
                      onClick={() => setOrderType('DINE_IN')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        orderType === 'DINE_IN' ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold' : 'bg-stone-100 dark:bg-slate-900 text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      🍽 Dine-in
                    </button>
                  )}
                  {posConfig.takeaway_enabled !== false && (
                    <button
                      onClick={() => {
                        setOrderType('TAKEAWAY');
                        if (!selectedSession || selectedSession.table) {
                          setSelectedSession({ id: `takeaway-${Date.now()}`, guest_count: 1, orders: [] });
                        }
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        orderType === 'TAKEAWAY' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'bg-stone-100 dark:bg-slate-900 text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      📦 Takeaway
                    </button>
                  )}
                  {posConfig.delivery_enabled !== false && (
                    <button
                      onClick={() => {
                        setOrderType('DELIVERY');
                        if (!selectedSession || selectedSession.table) {
                          setSelectedSession({ id: `delivery-${Date.now()}`, guest_count: 1, orders: [] });
                        }
                        if (!deliveryInfo.customer_name) {
                          setShowDeliveryModal(true);
                        }
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        orderType === 'DELIVERY' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'bg-stone-100 dark:bg-slate-900 text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      🚚 Delivery
                    </button>
                  )}
                </div>

                {/* Vertical Separator Line */}
                <div className="w-[1px] h-4 bg-stone-300 dark:bg-slate-800 shrink-0 mx-0.5" />

                <div className="flex items-center space-x-1 shrink-0">
                  {/* Customer Info Modal Button */}
                  <button
                    type="button"
                    onClick={() => setShowCustomerModal(true)}
                    className={`p-1 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 border ${
                      customerName || customerPhone
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-sm'
                        : 'bg-stone-100 dark:bg-slate-900 text-stone-600 dark:text-slate-400 border-stone-300 dark:border-slate-800 hover:text-stone-900 dark:hover:text-white'
                    }`}
                    title={customerName ? `Guest: ${customerName} (${customerPhone || 'No phone'})` : 'Add Guest/Customer Info'}
                  >
                    <UserPlus className="w-3.5 h-3.5 text-amber-500" />
                    <span className="truncate max-w-[70px]">
                      {customerName ? customerName : 'Guest'}
                    </span>
                  </button>

                  {/* Modern Payment Method Dropdown (Icon + Text) */}
                  <div className="relative shrink-0 flex items-center">
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="bg-stone-100 dark:bg-slate-900 border border-stone-300 dark:border-slate-800 text-stone-900 dark:text-white font-extrabold text-[11px] rounded-lg pl-2 pr-6 py-1 focus:outline-none focus:border-amber-500 cursor-pointer appearance-none shadow-sm transition-all"
                    >
                      <option value="CASH" className="bg-white dark:bg-slate-900 text-stone-900 dark:text-white font-bold">
                        💵 Cash
                      </option>
                      <option value="CARD" className="bg-white dark:bg-slate-900 text-stone-900 dark:text-white font-bold">
                        💳 Card
                      </option>
                      <option value="BKASH" className="bg-white dark:bg-slate-900 text-stone-900 dark:text-white font-bold">
                        📱 bKash
                      </option>
                      <option value="NAGAD" className="bg-white dark:bg-slate-900 text-stone-900 dark:text-white font-bold">
                        📱 Nagad
                      </option>
                      <option value="ROCKET" className="bg-white dark:bg-slate-900 text-stone-900 dark:text-white font-bold">
                        📱 Rocket
                      </option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Combined Integrated Ticket Header & Table Selector */}
              <div className="p-3 border-b border-pos-border flex justify-between items-start transition-colors duration-200">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center space-x-1.5">
                    <Receipt className="w-4 h-4 text-[#006c49] dark:text-[#4edea3] shrink-0" />
                    <h3 className="font-extrabold text-sm text-stone-900 dark:text-white uppercase tracking-tight">
                      Active Order Ticket
                    </h3>
                  </div>
                  
                  {orderType === 'DINE_IN' ? (
                    <div className="relative mt-0.5">
                      <button 
                        onClick={() => setIsTableDropdownOpen(!isTableDropdownOpen)}
                        className="flex items-center gap-1 text-xs text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200 transition-colors focus:outline-none"
                      >
                        <span className="truncate font-medium flex items-center gap-1.5">
                          {selectedSession?.table ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                              {selectedSession.table.name || `Table ${selectedSession.table.table_number}`}
                            </>
                          ) : (
                            <span>Select Table...</span>
                          )}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                      </button>

                      {isTableDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsTableDropdownOpen(false)} />
                          <div className="absolute top-full left-0 mt-1 w-[260px] max-h-[280px] overflow-y-auto bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1.5 custom-scrollbar">
                            <div className="px-3 py-1.5 border-b border-stone-100 dark:border-slate-800 mb-1">
                              <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Available Tables</span>
                            </div>
                            {tables.map(tbl => {
                              const isActive = sessions.some(s => s.table_id === tbl.id && s.status !== 'COMPLETED');
                              const isSelected = selectedSession?.table?.id === tbl.id;
                              return (
                                <button
                                  key={tbl.id}
                                  onClick={() => {
                                    handleSelectTable(tbl);
                                    setIsTableDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors ${isSelected ? 'bg-amber-50/50 dark:bg-amber-500/10' : ''}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                    <span className={`text-xs font-bold ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-stone-700 dark:text-slate-300'}`}>
                                      {tbl.name || `Table ${tbl.table_number}`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-500 flex items-center gap-1">
                                      <User className="w-3 h-3" /> {tbl.seating_capacity || 4}
                                    </span>
                                    <span className={`text-[9px] font-bold uppercase w-8 text-center ${isActive ? 'text-red-500' : 'text-emerald-500'}`}>
                                      {isActive ? 'Occ' : 'Avail'}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5 font-medium">
                      {orderType === 'TAKEAWAY' ? 'Counter Takeaway' : 'Home Delivery'}
                    </p>
                  )}
                </div>

                {/* Header Action Buttons: Hold + Fire KOT / Cancel */}
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={handleHoldTicket}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-stone-200/80 hover:bg-stone-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 border border-stone-300/60 dark:border-transparent rounded-xl text-xs font-bold transition-colors"
                    title="Park / Hold Ticket"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    <span>Hold</span>
                  </button>
                  {orderType === 'DINE_IN' && selectedSession && selectedSession.id && !selectedSession.id.startsWith('temp-') && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 rounded-xl transition-colors shrink-0"
                      title="Cancel Order & Free Table"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {orderType === 'DINE_IN' && (
                    <button
                      onClick={() => handleFireKOT(false)}
                      disabled={!selectedSession || !selectedSession.table}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-stone-700 dark:bg-slate-800 hover:bg-stone-800 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white border border-stone-600 dark:border-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all"
                      title={!selectedSession || !selectedSession.table ? 'Select a dining table first' : 'Fire KOT'}
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>{posConfig.kot_enabled !== false ? 'Fire KOT' : 'Save Order'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Delivery Details Banner */}
              {orderType === 'DELIVERY' && (
                <div className="px-4 py-2 bg-stone-100 dark:bg-slate-950 border-b border-pos-border flex justify-between items-center text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-stone-900 dark:text-white flex items-center gap-1">
                      <span>🚚</span> {deliveryInfo.customer_name || 'Guest'} ({deliveryInfo.customer_phone || 'No phone'})
                    </p>
                    <p className="text-[10px] text-stone-500 dark:text-slate-400 truncate max-w-[220px]">
                      {deliveryInfo.delivery_address || 'No address specified'}
                    </p>
                    {deliveryInfo.delivery_driver && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                        Partner: {deliveryInfo.delivery_driver}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowDeliveryModal(true)}
                    className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-stone-200 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold underline"
                  >
                    Edit
                  </button>
                </div>
              )}

              {/* Cart List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar min-h-[160px]">
                {cart.items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-stone-400 dark:text-slate-500 space-y-1 py-8">
                    <ChefHat className="w-8 h-8 opacity-30 text-amber-500" />
                    <p className="text-xs font-semibold">No items added to ticket.</p>
                  </div>
                ) : (
                  cart.items.map((item: any) => {
                    const getImageUrl = (url?: string) => {
                      if (!url) return null;
                      if (url.startsWith('http')) return url;
                      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                      return `${baseUrl}${url}`;
                    };
                    const rawImgUrl = item.image_url || menuItems.find((m: any) => m.id === item.product_id || m.id === item.id)?.image_url;
                    const itemImgUrl = getImageUrl(rawImgUrl);

                    return (
                      <div key={item.id} className="p-2 bg-white dark:bg-slate-900/90 border border-stone-200 dark:border-slate-800/80 rounded-2xl flex gap-3 items-center justify-between shadow-sm transition-all hover:border-stone-300 dark:hover:border-slate-700">
                        {/* Left: Dish Thumbnail + Title & Subtitle Price */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-10 h-10 bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                            {itemImgUrl ? (
                              <img src={itemImgUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <UtensilsCrossed className="w-4 h-4 text-amber-500/70" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-extrabold text-stone-900 dark:text-white truncate block">{item.name}</span>
                            <span className="text-[10px] text-stone-500 dark:text-slate-400 font-mono block">
                              ৳ {((item.unit_price + (item.modifiers ? item.modifiers.reduce((s: number, m: any) => s + (m.price || 0), 0) : 0)) / 100).toFixed(0)} /ea
                            </span>
                            {item.modifiers && item.modifiers.length > 0 && (
                              <p className="text-[9px] text-amber-600 dark:text-amber-400 font-mono truncate">
                                + {item.modifiers.map((m: any) => m.name).join(', ')}
                              </p>
                            )}
                            {item.notes && (
                              <p className="text-[9px] text-emerald-600 dark:text-emerald-400 italic font-mono flex items-center gap-0.5 truncate">
                                📝 {item.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Center: Encapsulated Pill Quantity Stepper (Stitch Style) */}
                        <div className="bg-stone-100 dark:bg-slate-950 border border-stone-300 dark:border-slate-800 rounded-full px-3 py-1 flex items-center space-x-3 shrink-0 shadow-inner">
                          <button
                            onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                            className="text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white font-extrabold text-xs transition-colors p-0.5"
                          >
                            -
                          </button>
                          <span className="text-xs font-mono font-extrabold text-stone-900 dark:text-white min-w-[12px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                            className="text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white font-extrabold text-xs transition-colors p-0.5"
                          >
                            +
                          </button>
                        </div>

                        {/* Right: Actions (Pencil Edit Note + Trash Delete) */}
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditingNoteItem(item);
                              setShowNoteEditor(true);
                            }}
                            className="p-1.5 text-stone-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400 transition-colors rounded-lg hover:bg-stone-200 dark:hover:bg-slate-800"
                            title="Add special kitchen note"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => cart.removeItem(item.id)}
                            className="p-1.5 text-stone-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-stone-200 dark:hover:bg-slate-800"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Zone 3: Sticky Footer (Never Scrolls - Bill Summary + Payment + Settle CTA) */}
              <div className="shrink-0 p-3 border-t border-pos-border bg-pos-sidebar dark:bg-slate-950 space-y-2 shadow-2xl">
                <div className="space-y-0.5 text-xs text-stone-600 dark:text-slate-400 font-mono">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>৳ {(subtotal / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <span>Discount</span>
                      <button
                        onClick={() => setShowDiscountModal(true)}
                        className="text-amber-600 dark:text-amber-400 hover:underline font-bold text-[10px]"
                      >
                        {ticketDiscount > 0 ? `(${discountReason || 'Comp'})` : '(Apply)'}
                      </button>
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">- ৳ {(ticketDiscount / 100).toFixed(2)}</span>
                  </div>
                  {posConfig.service_charge_enabled !== false && serviceChargePct > 0 && (
                    <div className="flex justify-between text-stone-600 dark:text-slate-400">
                      <span>Service Charge ({serviceChargePct}%)</span>
                      <span>৳ {(serviceChargeAmount / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {taxPct > 0 && (
                    <div className="flex justify-between text-stone-600 dark:text-slate-400">
                      <span>VAT ({taxPct}%)</span>
                      <span>৳ {(taxAmount / 100).toFixed(2)}</span>
                    </div>
                  )}

                  {/* Extrabold Amber Total Payable Card */}
                  <div className="flex justify-between items-center px-3 py-1.5 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-xl my-0.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">Total Payable</span>
                    <span className="text-lg font-extrabold font-mono text-amber-600 dark:text-amber-400">৳ {(grandTotal / 100).toFixed(2)}</span>
                  </div>
                </div>

                {/* Ultra-Fast Inline Payment Panel (≤3 Clicks Standard) */}
                <InlinePaymentPanel
                  grandTotalBDT={Math.round(grandTotal / 100)}
                  posConfig={posConfig}
                  submitting={submittingInline}
                  disabled={cart.items.length === 0 || (orderType === 'DINE_IN' && (!selectedSession || !selectedSession.table))}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  customerName={customerName}
                  customerPhone={customerPhone}
                  onFireKOT={() => handleFireKOT(false)}
                  onOpenSplitModal={orderType === 'DINE_IN' ? () => setShowSplitModal(true) : undefined}
                  onSettle={async (chosenPaymentMethod, amountPaidBDT, customerInfo) => {
                    if (cart.items.length === 0) {
                      toast.error('Cart is empty. Add items before settling.');
                      return;
                    }

                    if (!shift?.id) {
                      toast.error('Active shift required. Please start a register shift first.');
                      setShowOpenShiftModal(true);
                      return;
                    }

                    if (orderType === 'DINE_IN' && (!selectedSession || !selectedSession.table)) {
                      toast.error('🚫 Please select a dining table before settling check');
                      return;
                    }

                    setSubmittingInline(true);
                    toast.loading('⚡ Settling & recording sale...', { id: 'inline-settle' });

                    try {
                      let settlementResult: any = null;

                      if (orderType === 'TAKEAWAY') {
                        const res = await restaurantApi.createTakeawayOrder({
                          items: cart.items.map((i) => ({
                            product_id: i.product_id || i.id,
                            menu_item_id: i.menu_item_id || undefined,
                            variant_id: i.variant_id || undefined,
                            product_name: i.name,
                            quantity: i.quantity,
                            unit_price: i.unit_price,
                            special_instructions: i.notes,
                            modifier_selections: i.modifiers?.map((m: any) => ({
                              modifier_id: m.id || m.name,
                              modifier_name: m.name,
                              modifier_price: m.price,
                            })) || [],
                          })),
                          pay_now: true,
                          shift_id: shift?.id,
                          payment_method: paymentMethod as any,
                          amount_paid: Math.round(amountPaidBDT * 100),
                        });
                        settlementResult = res?.sale || res;
                        toast.success('🎉 Takeaway Paid & Settled!', { id: 'inline-settle' });
                      } else if (orderType === 'DELIVERY') {
                        const res = await restaurantApi.createDeliveryOrder({
                          customer_name: customerInfo?.name || deliveryInfo.customer_name || 'Guest',
                          customer_phone: customerInfo?.phone || deliveryInfo.customer_phone || '',
                          delivery_address: deliveryInfo.delivery_address || '',
                          delivery_driver: deliveryInfo.delivery_driver || '',
                          notes: deliveryInfo.notes || '',
                          items: cart.items.map((i) => ({
                            product_id: i.product_id || i.id,
                            menu_item_id: i.menu_item_id || undefined,
                            variant_id: i.variant_id || undefined,
                            product_name: i.name,
                            quantity: i.quantity,
                            unit_price: i.unit_price,
                            special_instructions: i.notes,
                            modifier_selections: i.modifiers?.map((m: any) => ({
                              modifier_id: m.id || m.name,
                              modifier_name: m.name,
                              modifier_price: m.price,
                            })) || [],
                          })),
                          pay_now: true,
                          shift_id: shift?.id,
                          payment_method: paymentMethod as any,
                          amount_paid: Math.round(amountPaidBDT * 100),
                        });
                        settlementResult = res?.sale || res;
                        toast.success('🎉 Delivery Paid & Settled!', { id: 'inline-settle' });
                      } else {
                        // Dine-In
                        let targetSessionId = selectedSession?.id;
                        if (!targetSessionId || targetSessionId.startsWith('temp-') || targetSessionId.startsWith('takeaway-') || targetSessionId.startsWith('delivery-')) {
                          if (selectedSession?.table?.id) {
                            const opened = await restaurantApi.openSession({
                              table_id: selectedSession.table.id,
                              guest_count: selectedSession.table.capacity || 4,
                            });
                            targetSessionId = opened.id;
                            await restaurantApi.addOrder(targetSessionId, {
                              order_type: 'DINE_IN',
                              items: cart.items.map((i) => ({
                                product_id: i.product_id || i.id,
                                menu_item_id: i.menu_item_id || undefined,
                                variant_id: i.variant_id || undefined,
                                product_name: i.name,
                                quantity: i.quantity,
                                unit_price: i.unit_price,
                                special_instructions: i.notes,
                                modifier_selections: i.modifiers?.map((m: any) => ({
                                  modifier_id: m.id || m.name,
                                  modifier_name: m.name,
                                  modifier_price: m.price,
                                })) || [],
                              })),
                            });
                          }
                        }

                        const res = await restaurantApi.settleSession(targetSessionId, {
                          shift_id: shift?.id,
                          payment_method: paymentMethod as any,
                          amount_paid: Math.round(amountPaidBDT * 100),
                          discount_amount: ticketDiscount > 0 ? ticketDiscount : undefined,
                          customer_name: customerInfo?.name || undefined,
                          customer_phone: customerInfo?.phone || undefined,
                        });
                        settlementResult = res;
                        toast.success('🎉 Table Check Settled!', { id: 'inline-settle' });
                      }

                      // Trigger receipt print modal preview
                      if (settlementResult) {
                        setSettledSaleData(settlementResult.sale || settlementResult);
                        setReceiptCartItems([...cart.items]);
                        setReceiptGrandTotal(grandTotal / 100);
                        setShowReceiptModal(true);
                      }

                      cart.clearActiveCart();
                      setSelectedSession(null);
                      await fetchDiningSessions();
                    } catch (err: any) {
                      console.error('Failed to settle check inline', err);
                      toast.error(err.response?.data?.message || 'Failed to settle check', { id: 'inline-settle' });
                    } finally {
                      setSubmittingInline(false);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Floating Bottom Bar (Identical to 2nd Image with Swipe Up Gesture) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#eceef0] dark:bg-slate-950 border-t border-[#e0e3e5] dark:border-slate-800 backdrop-blur-md p-3.5 shadow-2xl rounded-t-2xl">
        <div
          onClick={() => setShowMobileCart(true)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setTouchStartY(null)}
          className="bg-[#006c49] hover:bg-[#005a3d] text-white rounded-xl p-3 px-4 flex items-center justify-between shadow-md active:scale-[0.98] transition-all cursor-pointer select-none"
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{cart.items.reduce((sum, item) => sum + item.quantity, 0)} Items</span>
            </div>
            <span className="text-base font-bold font-mono text-white tracking-tight">
              ৳ {(grandTotal / 100).toFixed(2)}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
            <span>View Ticket & Pay</span>
            <ChevronUp className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Mobile Cart Bottom Sheet Drawer (<768px) */}
      {showMobileCart && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm"
            onClick={() => setShowMobileCart(false)}
          />
          <div className="relative bg-pos-card rounded-t-3xl border-t border-pos-border max-h-[90vh] flex flex-col z-10 overflow-hidden shadow-2xl transition-all duration-300">
            {/* Drawer Header Drag Handle / Close */}
            <div className="p-3 bg-stone-100 dark:bg-slate-950 border-b border-pos-border flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-[#006c49] dark:text-[#4edea3] shrink-0" />
                <span className="font-extrabold text-xs text-stone-900 dark:text-white uppercase tracking-wider">Active Order Ticket</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileCart(false)}
                className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-xl hover:bg-stone-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Ticket Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-2 flex flex-col">
              {/* Order Type & Payment Method Top Bar */}
              <div className="flex items-center justify-between gap-1.5 bg-[#eceef0] dark:bg-slate-950 p-1 rounded-xl border border-[#e0e3e5] dark:border-slate-800 mb-2">
                <div className="flex items-center space-x-1 flex-1">
                  {posConfig.table_management_enabled !== false && (
                    <button
                      onClick={() => setOrderType('DINE_IN')}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all flex-1 flex justify-center items-center gap-1 ${
                        orderType === 'DINE_IN'
                          ? 'bg-[#006c49] text-white shadow-sm font-bold'
                          : 'text-[#6c7a71] dark:text-slate-400 font-semibold hover:text-[#191c1e] dark:hover:text-slate-200'
                      }`}
                    >
                      🍽 Dine-in
                    </button>
                  )}
                  {posConfig.takeaway_enabled !== false && (
                    <button
                      onClick={() => {
                        setOrderType('TAKEAWAY');
                        if (!selectedSession || selectedSession.table) {
                          setSelectedSession({ id: `takeaway-${Date.now()}`, guest_count: 1, orders: [] });
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all flex-1 flex justify-center items-center gap-1 ${
                        orderType === 'TAKEAWAY'
                          ? 'bg-[#006c49] text-white shadow-sm font-bold'
                          : 'text-[#6c7a71] dark:text-slate-400 font-semibold hover:text-[#191c1e] dark:hover:text-slate-200'
                      }`}
                    >
                      📦 Takeaway
                    </button>
                  )}
                  {posConfig.delivery_enabled !== false && (
                    <button
                      onClick={() => {
                        setOrderType('DELIVERY');
                        if (!selectedSession || selectedSession.table) {
                          setSelectedSession({ id: `delivery-${Date.now()}`, guest_count: 1, orders: [] });
                        }
                        if (!deliveryInfo.customer_name) {
                          setShowDeliveryModal(true);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all flex-1 flex justify-center items-center gap-1 ${
                        orderType === 'DELIVERY'
                          ? 'bg-[#006c49] text-white shadow-sm font-bold'
                          : 'text-[#6c7a71] dark:text-slate-400 font-semibold hover:text-[#191c1e] dark:hover:text-slate-200'
                      }`}
                    >
                      🚚 Delivery
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCustomerModal(true)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                      customerName || customerPhone
                        ? 'bg-[#006c49]/10 text-[#006c49] dark:text-[#4edea3] border-[#006c49]/40 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-[#191c1e] dark:text-slate-200 border-[#e0e3e5] dark:border-slate-800 shadow-sm'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{customerName ? customerName.split(' ')[0] : 'Guest'}</span>
                  </button>
                </div>
              </div>

              {/* Integrated Dining / Delivery / Takeaway Control Strip (Constant Height Across All Modes) */}
              <div className="relative mb-2">
                <div className="flex items-center justify-between gap-2 p-1.5 bg-[#f2f4f6] dark:bg-slate-950 border border-[#e0e3e5] dark:border-slate-800 rounded-xl">
                  {orderType === 'DINE_IN' ? (
                    <button
                      type="button"
                      onClick={() => setIsMobileTableDropdownOpen(!isMobileTableDropdownOpen)}
                      className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 border border-[#e0e3e5] dark:border-slate-800 rounded-xl shadow-none text-xs text-left"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Utensils className="w-4 h-4 text-[#006c49] shrink-0" />
                        <span className="font-semibold text-[#191c1e] dark:text-slate-200 truncate">
                          {selectedSession?.table
                            ? (selectedSession.table.name || `Table ${selectedSession.table.table_number}`)
                            : '-- Select Dining Table --'}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-stone-400 shrink-0 ml-1" />
                    </button>
                  ) : orderType === 'DELIVERY' ? (
                    <button
                      type="button"
                      onClick={() => setShowDeliveryModal(true)}
                      className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 border border-[#e0e3e5] dark:border-slate-800 rounded-xl shadow-none text-xs text-left truncate"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Truck className="w-4 h-4 text-[#006c49] shrink-0" />
                        <span className="font-semibold text-[#191c1e] dark:text-slate-200 truncate">
                          {deliveryInfo.customer_name ? `Delivery: ${deliveryInfo.customer_name}` : 'Set Delivery Details'}
                        </span>
                      </div>
                      <Pencil className="w-3.5 h-3.5 text-stone-400 shrink-0 ml-1" />
                    </button>
                  ) : (
                    <div className="flex-1 flex items-center px-3 py-2 bg-white dark:bg-slate-900 border border-[#e0e3e5] dark:border-slate-800 rounded-xl text-xs text-left truncate">
                      <div className="flex items-center gap-2 truncate">
                        <Package className="w-4 h-4 text-[#006c49] shrink-0" />
                        <span className="font-semibold text-[#191c1e] dark:text-slate-200 truncate">
                          Takeaway Counter Pickup
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={handleHoldTicket}
                      disabled={!selectedSession || !selectedSession.id || selectedSession.id.startsWith('temp-')}
                      className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-[#e0e3e5] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#3c4a42] dark:text-slate-300 disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-slate-700 transition-colors"
                      aria-label="Hold current ticket"
                    >
                      Hold
                    </button>
                    {selectedSession && selectedSession.id && !selectedSession.id.startsWith('temp-') && (
                      <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        className="p-2 text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl hover:bg-red-100 transition-colors"
                        aria-label="Cancel current order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                  {isMobileTableDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsMobileTableDropdownOpen(false)} />
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-[240px] overflow-y-auto bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 py-1.5 custom-scrollbar">
                        <div className="px-3 py-1.5 border-b border-stone-100 dark:border-slate-800 mb-1">
                          <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Available Tables</span>
                        </div>
                        {tables.map(tbl => {
                          const isActive = sessions.some(s => s.table_id === tbl.id && s.status !== 'COMPLETED');
                          const isSelected = selectedSession?.table?.id === tbl.id;
                          return (
                            <button
                              key={tbl.id}
                              type="button"
                              onClick={() => {
                                handleSelectTable(tbl);
                                setIsMobileTableDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors ${isSelected ? 'bg-amber-50/50 dark:bg-amber-500/10' : ''}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                <span className={`text-xs font-bold ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-stone-700 dark:text-slate-300'}`}>
                                  {tbl.name || `Table ${tbl.table_number}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-500 flex items-center gap-1">
                                  <User className="w-3 h-3" /> {tbl.seating_capacity || 4}
                                </span>
                                <span className={`text-[9px] font-bold uppercase w-8 text-center ${isActive ? 'text-red-500' : 'text-emerald-500'}`}>
                                  {isActive ? 'Occ' : 'Avail'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto space-y-2 p-1 min-h-[160px] max-h-[40vh]">
                {cart.items.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-[#6c7a71] dark:text-slate-500">
                    <ShoppingCart className="w-12 h-12 opacity-40 mb-2 text-[#bbcabf]" />
                    <p className="text-xs font-semibold">Cart is empty</p>
                  </div>
                ) : (
                  cart.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 border border-[#eceef0] dark:border-slate-800 rounded-xl shadow-sm">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-[#191c1e] dark:text-white">{item.name}</span>
                        <span className="text-xs text-[#006c49] dark:text-[#4edea3] font-mono font-bold">৳{(item.unit_price / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 bg-[#eceef0] dark:bg-slate-800 rounded-lg flex items-center justify-center text-[#191c1e] dark:text-slate-200 font-bold text-xs hover:bg-stone-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 bg-[#eceef0] dark:bg-slate-800 rounded-lg flex items-center justify-center text-[#191c1e] dark:text-slate-200 font-bold text-xs hover:bg-stone-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => cart.removeItem(item.id)}
                          className="p-1 text-stone-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals Breakdown */}
              <div className="p-3 bg-[#f7f9fb] dark:bg-slate-950 border-t border-[#e0e3e5] dark:border-slate-800 rounded-b-xl space-y-2 mt-auto">
                <div className="flex justify-between items-center px-3.5 py-3 bg-[#006c49]/10 dark:bg-[#006c49]/20 border border-[#006c49]/30 rounded-xl">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#006c49] dark:text-[#4edea3]">Total Payable</span>
                  <span className="text-xl font-extrabold font-mono text-[#006c49] dark:text-[#4edea3]">৳ {(grandTotal / 100).toFixed(2)}</span>
                </div>

                <InlinePaymentPanel
                  grandTotalBDT={Math.round(grandTotal / 100)}
                  posConfig={posConfig}
                  submitting={submittingInline}
                  disabled={cart.items.length === 0 || (orderType === 'DINE_IN' && (!selectedSession || !selectedSession.table))}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  customerName={customerName}
                  customerPhone={customerPhone}
                  onFireKOT={() => handleFireKOT(false)}
                  onOpenSplitModal={orderType === 'DINE_IN' ? () => setShowSplitModal(true) : undefined}
                  onSettle={async (chosenPaymentMethod, amountPaidBDT, customerInfo) => {
                    setShowMobileCart(false);
                    if (cart.items.length === 0) {
                      toast.error('Cart is empty. Add items before settling.');
                      return;
                    }
                    if (!shift?.id) {
                      toast.error('Active shift required. Please start a register shift first.');
                      setShowOpenShiftModal(true);
                      return;
                    }
                    if (orderType === 'DINE_IN' && (!selectedSession || !selectedSession.table)) {
                      toast.error('🚫 Please select a dining table before settling check');
                      return;
                    }
                    setSubmittingInline(true);
                    toast.loading('⚡ Settling & recording sale...', { id: 'inline-settle' });

                    try {
                      let settlementResult: any = null;

                      if (orderType === 'TAKEAWAY') {
                        const res = await restaurantApi.createTakeawayOrder({
                          items: cart.items.map((i) => ({
                            product_id: i.product_id || i.id,
                            menu_item_id: i.menu_item_id || undefined,
                            variant_id: i.variant_id || undefined,
                            product_name: i.name,
                            quantity: i.quantity,
                            unit_price: i.unit_price,
                            special_instructions: i.notes,
                            modifier_selections: i.modifiers?.map((m: any) => ({
                              modifier_id: m.id || m.name,
                              modifier_name: m.name,
                              modifier_price: m.price,
                            })) || [],
                          })),
                          pay_now: true,
                          shift_id: shift?.id,
                          payment_method: paymentMethod as any,
                          amount_paid: Math.round(amountPaidBDT * 100),
                        });
                        settlementResult = res?.sale || res;
                        toast.success('🎉 Takeaway Paid & Settled!', { id: 'inline-settle' });
                      } else if (orderType === 'DELIVERY') {
                        const res = await restaurantApi.createDeliveryOrder({
                          customer_name: customerInfo?.name || deliveryInfo.customer_name || 'Guest',
                          customer_phone: customerInfo?.phone || deliveryInfo.customer_phone || '',
                          delivery_address: deliveryInfo.delivery_address || '',
                          delivery_driver: deliveryInfo.delivery_driver || '',
                          notes: deliveryInfo.notes || '',
                          items: cart.items.map((i) => ({
                            product_id: i.product_id || i.id,
                            menu_item_id: i.menu_item_id || undefined,
                            variant_id: i.variant_id || undefined,
                            product_name: i.name,
                            quantity: i.quantity,
                            unit_price: i.unit_price,
                            special_instructions: i.notes,
                            modifier_selections: i.modifiers?.map((m: any) => ({
                              modifier_id: m.id || m.name,
                              modifier_name: m.name,
                              modifier_price: m.price,
                            })) || [],
                          })),
                          pay_now: true,
                          shift_id: shift?.id,
                          payment_method: paymentMethod as any,
                          amount_paid: Math.round(amountPaidBDT * 100),
                        });
                        settlementResult = res?.sale || res;
                        toast.success('🎉 Delivery Paid & Settled!', { id: 'inline-settle' });
                      } else {
                        // Dine-In
                        let targetSessionId = selectedSession?.id;
                        if (!targetSessionId || targetSessionId.startsWith('temp-') || targetSessionId.startsWith('takeaway-') || targetSessionId.startsWith('delivery-')) {
                          if (selectedSession?.table?.id) {
                            const opened = await restaurantApi.openSession({
                              table_id: selectedSession.table.id,
                              guest_count: selectedSession.table.capacity || 4,
                            });
                            targetSessionId = opened.id;
                            await restaurantApi.addOrder(targetSessionId, {
                              order_type: 'DINE_IN',
                              items: cart.items.map((i) => ({
                                product_id: i.product_id || i.id,
                                menu_item_id: i.menu_item_id || undefined,
                                variant_id: i.variant_id || undefined,
                                product_name: i.name,
                                quantity: i.quantity,
                                unit_price: i.unit_price,
                                special_instructions: i.notes,
                                modifier_selections: i.modifiers?.map((m: any) => ({
                                  modifier_id: m.id || m.name,
                                  modifier_name: m.name,
                                  modifier_price: m.price,
                                })) || [],
                              })),
                            });
                          }
                        }
                        const res = await restaurantApi.settleSession(targetSessionId, {
                          shift_id: shift?.id,
                          payment_method: paymentMethod as any,
                          amount_paid: Math.round(amountPaidBDT * 100),
                          discount_amount: ticketDiscount > 0 ? ticketDiscount : undefined,
                          customer_name: customerInfo?.name || undefined,
                          customer_phone: customerInfo?.phone || undefined,
                        });
                        settlementResult = res;
                        toast.success('🎉 Table Check Settled!', { id: 'inline-settle' });
                      }

                      if (settlementResult) {
                        setSettledSaleData(settlementResult.sale || settlementResult);
                        setReceiptCartItems([...cart.items]);
                        setReceiptGrandTotal(grandTotal / 100);
                        setShowReceiptModal(true);
                      }

                      cart.clearActiveCart();
                      setSelectedSession(null);
                      await fetchDiningSessions();
                    } catch (err: any) {
                      console.error('Failed to settle check', err);
                      toast.error(err.response?.data?.message || 'Failed to settle check', { id: 'inline-settle' });
                    } finally {
                      setSubmittingInline(false);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase 2: Restaurant Settlement Checkout Modal */}
      <RestaurantCheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        session={selectedSession}
        cartItems={cart.items}
        posConfig={posConfig}
        shiftId={shift?.id}
        onRequestOpenShift={() => setShowOpenShiftModal(true)}
        onSuccess={(sale) => {
          setReceiptCartItems([...cart.items]);
          setReceiptGrandTotal(grandTotal / 100);
          setSettledSaleData(sale);
          setShowReceiptModal(true);
          cart.clearCart();
          setSelectedSession(null);
          fetchDiningSessions();
          setActiveTab('FLOOR_PLAN');
        }}
      />

      {/* Phase 3: Dish Modifier Sheet */}
      <ModifierSheet
        isOpen={showModifierSheet}
        onClose={() => setShowModifierSheet(false)}
        product={selectedProductForModifier}
        modifierGroups={productModifierGroups}
        onConfirm={handleConfirmModifiers}
      />

      {/* Phase 3: Item Note / Special Instructions Editor */}
      <ItemNoteEditor
        isOpen={showNoteEditor}
        initialNote={editingNoteItem?.notes || ''}
        onClose={() => setShowNoteEditor(false)}
        onSave={handleSaveItemNote}
      />

      {/* Phase 4: Held / Parked Orders Drawer Modal */}
      <HeldOrdersModal
        isOpen={showHeldModal}
        onClose={() => setShowHeldModal(false)}
        branchId={shift?.branch_id}
        onRecallSession={async (session) => {
          try {
            toast.loading('Recalling held session...', { id: 'recall-toast' });
            const fullSession = await restaurantApi.getSession(session.id);
            cart.selectTable(fullSession.table_id || fullSession.table?.id, fullSession);
            cart.loadSessionItems(fullSession);
            setSelectedSession(fullSession);
            if (fullSession.orders && fullSession.orders.length > 0) {
              setOrderType(fullSession.orders[0].order_type || 'DINE_IN');
            }
            setActiveTab('ITEMS');
            toast.success('Recalled held session to ticket sidebar', { id: 'recall-toast' });
          } catch (err) {
            toast.error('Failed to recall held session');
          }
        }}
      />

      {/* Phase 4: Ticket Discount Modal */}
      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        subtotalBDT={subtotal / 100}
        onApplyDiscount={(discountPaisa, reason) => {
          setTicketDiscount(discountPaisa);
          setDiscountReason(reason);
        }}
      />

      {/* Phase 5: Thermal Receipt Print Modal */}
      <ReceiptPrintModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        saleData={settledSaleData}
        session={selectedSession}
        cartItems={receiptCartItems}
        posConfig={posConfig}
        grandTotalBDT={Math.round(receiptGrandTotal)}
        paymentMethod={paymentMethod}
        amountPaidBDT={Math.round(receiptGrandTotal)}
        changeDueBDT={0}
        customerName={customerName}
        customerPhone={customerPhone}
      />
      <SplitBillModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        grandTotalBDT={grandTotal / 100}
        guestCount={selectedSession?.table?.seats || 2}
        cartItems={cart.items}
        onConfirmSplit={(splitAmountBDT) => {
          setShowCheckoutModal(true);
        }}
      />

      {/* Delivery Info Modal */}
      <DeliveryInfoModal
        isOpen={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
        initialData={deliveryInfo}
        onConfirm={(info) => {
          setDeliveryInfo({
            customer_name: info.customer_name || '',
            customer_phone: info.customer_phone || '',
            delivery_address: info.delivery_address || '',
            delivery_driver: info.delivery_driver || '',
            notes: info.notes || '',
          });
          setShowDeliveryModal(false);
          toast.success('Delivery details saved');
        }}
      />

      {/* Cancel Session Modal */}
      <CancelSessionModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setCancelReason('');
        }}
        sessionName={selectedSession?.table?.name || (selectedSession?.table?.table_number ? `Table ${selectedSession.table.table_number}` : 'this session')}
        onConfirm={(reason) => {
          setCancelReason(reason);
          handleCancelOrder(reason);
        }}
      />

      {/* Open & Close Register Shift Modals */}
      <OpenShiftModal
        isOpen={showOpenShiftModal}
        onClose={() => setShowOpenShiftModal(false)}
        branchId={selectedBranchId && selectedBranchId !== 'ALL' ? selectedBranchId : (shift?.branch_id || branches[0]?.id || '')}
        onSuccess={(newShift) => {
          setShift(newShift);
          setCrossBranchShift(null);
          fetchDiningSessions();
        }}
      />

      <CloseShiftModal
        isOpen={showCloseShiftModal}
        onClose={() => setShowCloseShiftModal(false)}
        shift={shift}
        onSuccess={() => {
          setShift(null);
          fetchDiningSessions();
        }}
      />
      {/* Guest / Customer Info Modal */}
      <CustomerInfoModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        initialName={customerName}
        initialPhone={customerPhone}
        onSave={(name, phone) => {
          setCustomerName(name);
          setCustomerPhone(phone);
          setShowCustomerModal(false);
        }}
      />

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <div className="sm:hidden fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 w-4/5 max-w-xs h-full p-4 flex flex-col justify-between z-10 shadow-2xl transition-all duration-300">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-stone-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <UtensilsCrossed className="w-5 h-5 text-amber-500" />
                  <span className="font-extrabold text-sm text-stone-900 dark:text-white">BOS POS Menu</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileMenu(false)}
                  className="p-1 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Badge */}
              <div className="p-3 bg-stone-100 dark:bg-slate-950 rounded-xl border border-stone-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-stone-900 dark:text-white">{auth.user?.full_name || (auth.user as any)?.name || 'Cashier'}</span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-md uppercase">
                  {getUserRoleBadge(auth.user)}
                </span>
              </div>

              {/* Navigation Options */}
              <div className="space-y-1.5 pt-2">
                {checkAdminAccess(auth.user) && (
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      router.push('/dashboard');
                    }}
                    className="w-full px-3 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 shadow-sm"
                  >
                    <Shield className="w-4 h-4 text-amber-500" />
                    <span>Switch to Dashboard</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    fetchDiningSessions();
                  }}
                  className="w-full px-3 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4 text-stone-500" />
                  <span>Refresh Sessions</span>
                </button>

                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowHeldModal(true);
                  }}
                  className="w-full px-3 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
                >
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Parked / Held Tickets</span>
                </button>

                {['ADMIN', 'SUPER_ADMIN', 'OWNER', 'BRANCH_MANAGER'].includes((auth.user?.role || '').toUpperCase()) && (
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      router.push('/restaurant/settings');
                    }}
                    className="w-full px-3 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4 text-amber-500" />
                    <span>Restaurant Settings</span>
                  </button>
                )}
              </div>
            </div>

            {/* Footer Options */}
            <div className="pt-4 border-t border-stone-200 dark:border-slate-800 space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-stone-600 dark:text-slate-400">Theme</span>
                <ThemeToggle />
              </div>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  auth.logout();
                  router.push('/login');
                }}
                className="w-full px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 shadow-sm active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out / Switch Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </BranchRequiredGuard>
  );
}


