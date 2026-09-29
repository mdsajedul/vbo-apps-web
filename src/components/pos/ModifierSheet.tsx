'use client';

import React, { useState, useEffect } from 'react';
import { X, UtensilsCrossed, Plus } from 'lucide-react';

interface PortionSize {
  id: string;
  name: string;
  selling_price: number;
}

interface ModifierSheetProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  modifierGroups: any[];
  onConfirm: (
    selectedModifiers: Array<{ modifier_id: string; modifier_name: string; modifier_price: number }>,
    selectedPortion?: PortionSize,
  ) => void;
}

export function ModifierSheet({
  isOpen,
  onClose,
  product,
  modifierGroups,
  onConfirm,
}: ModifierSheetProps) {
  const [selectedMap, setSelectedMap] = useState<Record<string, Array<{ id: string; name: string; price: number }>>>({});
  const [selectedPortion, setSelectedPortion] = useState<PortionSize | undefined>(undefined);

  // Parse portion sizes from variants
  const portionSizes: PortionSize[] = React.useMemo(() => {
    if (!product?.variants || !Array.isArray(product.variants)) return [];
    return product.variants.map((v: any) => ({
      id: v.id,
      name: v.name,
      selling_price: v.selling_price
    }));
  }, [product]);

  // Auto-select first modifier in required single-choice groups on open
  useEffect(() => {
    if (isOpen && modifierGroups) {
      const initial: Record<string, Array<{ id: string; name: string; price: number }>> = {};
      modifierGroups.forEach((group) => {
        if (group.is_required && group.max_selections === 1 && group.modifiers?.length > 0) {
          const defaultMod = group.modifiers[0];
          initial[group.id] = [{ id: defaultMod.id, name: defaultMod.name, price: defaultMod.price }];
        } else {
          initial[group.id] = [];
        }
      });
      setSelectedMap(initial);
    }
  }, [isOpen, modifierGroups]);

  if (!isOpen || !product) return null;

  const handleToggleModifier = (group: any, mod: any) => {
    const groupId = group.id;
    const currentList = selectedMap[groupId] || [];
    const isSingle = group.max_selections === 1;

    const exists = currentList.some((m) => m.id === mod.id);

    if (isSingle) {
      // Replace selection
      setSelectedMap({
        ...selectedMap,
        [groupId]: exists ? [] : [{ id: mod.id, name: mod.name, price: mod.price }],
      });
    } else {
      // Toggle multiple selection up to max_selections
      if (exists) {
        setSelectedMap({
          ...selectedMap,
          [groupId]: currentList.filter((m) => m.id !== mod.id),
        });
      } else {
        if (group.max_selections && currentList.length >= group.max_selections) {
          return; // Max limit reached
        }
        setSelectedMap({
          ...selectedMap,
          [groupId]: [...currentList, { id: mod.id, name: mod.name, price: mod.price }],
        });
      }
    }
  };

  const flattenSelections = () => {
    const flattened: Array<{ modifier_id: string; modifier_name: string; modifier_price: number }> = [];
    Object.values(selectedMap).forEach((list) => {
      list.forEach((m) => {
        flattened.push({
          modifier_id: m.id,
          modifier_name: m.name,
          modifier_price: m.price,
        });
      });
    });
    return flattened;
  };

  const handleConfirm = () => {
    // Validate required groups
    for (const group of modifierGroups) {
      const selections = selectedMap[group.id] || [];
      if (group.is_required && selections.length === 0) {
        alert(`Please select an option for ${group.name}`);
        return;
      }
      if (group.min_selections && selections.length < group.min_selections) {
        alert(`Please select at least ${group.min_selections} option(s) for ${group.name}`);
        return;
      }
    }

    onConfirm(flattenSelections(), selectedPortion);
    setSelectedPortion(undefined);
    onClose();
  };

  // Base price in BDT
  const basePriceBDT = Number(product.selling_price || 0) / 100;
  const portionAddonBDT = selectedPortion?.selling_price ? (selectedPortion.selling_price - product.selling_price) / 100 : 0;
  const modifierAddonBDT = Object.values(selectedMap).reduce((sum, list) => {
    return sum + list.reduce((groupSum, m) => groupSum + (m.price || 0), 0);
  }, 0) / 100;
  const totalItemBDT = basePriceBDT + portionAddonBDT + modifierAddonBDT;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-stone-900/60 dark:bg-slate-950/80 backdrop-blur-md transition-opacity" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0 text-stone-900 dark:text-slate-100 z-10 my-8 transition-colors duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-slate-800 flex justify-between items-center bg-stone-50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-white">{product.name}</h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-mono font-bold">Base Price: ৳ {basePriceBDT.toFixed(0)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-stone-200 dark:hover:bg-slate-800 transition-colors" aria-label="Close modifier sheet">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">

          {/* Portion Size Picker */}
          {portionSizes.length > 0 && (
            <div className="space-y-3 p-4 bg-stone-50 dark:bg-slate-950/60 border border-stone-200 dark:border-slate-800 rounded-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-xs text-stone-900 dark:text-white">Portion Size</h4>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400">Choose a size</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {portionSizes.map((size, idx) => {
                  const isSelected = selectedPortion?.id === size.id;
                  const priceDiff = size.selling_price - product.selling_price;
                  const sizePriceBDT = priceDiff > 0 ? (priceDiff / 100).toFixed(0) : '0';
                  return (
                    <button
                      key={size.id || idx}
                      type="button"
                      onClick={() => setSelectedPortion(isSelected ? undefined : size)}
                      className={`p-3 rounded-xl border text-left transition-all flex justify-between items-center ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold shadow-md'
                          : 'border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:border-stone-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-semibold">{size.name}</span>
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                        {Number(sizePriceBDT) > 0 ? `+৳ ${sizePriceBDT}` : 'Standard'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modifier Groups List */}
          {modifierGroups.map((group) => {
            const currentSelections = selectedMap[group.id] || [];
            const isSingle = group.max_selections === 1;

            return (
              <div key={group.id} className="space-y-3 p-4 bg-stone-50 dark:bg-slate-950/60 border border-stone-200 dark:border-slate-800 rounded-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-xs text-stone-900 dark:text-white flex items-center gap-2">
                      <span>{group.name}</span>
                      {group.is_required && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-mono font-bold">
                          REQUIRED
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400">
                      {isSingle ? 'Choose 1 option' : `Select up to ${group.max_selections} options`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.modifiers?.map((mod: any) => {
                    const isSelected = currentSelections.some((m) => m.id === mod.id);
                    const addonBDT = Number(mod.price || 0) / 100;

                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => handleToggleModifier(group, mod)}
                        className={`p-3 rounded-xl border text-left transition-all flex justify-between items-center ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold shadow-md'
                            : 'border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:border-stone-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-semibold">{mod.name}</span>
                        <span className="text-xs font-mono font-extrabold text-amber-600 dark:text-amber-400">
                          {addonBDT > 0 ? `+৳ ${addonBDT.toFixed(0)}` : 'Free'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-stone-500 dark:text-slate-400 block font-mono">Item Total Price</span>
            <span className="text-xl font-extrabold font-mono text-stone-900 dark:text-white">৳ {totalItemBDT.toFixed(2)}</span>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-amber-600/20 transition-all active:scale-95 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Ticket</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
