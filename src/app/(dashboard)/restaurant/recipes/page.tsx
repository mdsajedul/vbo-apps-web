'use client';

import { useState, useEffect } from 'react';
import { restaurantApi } from '@/lib/restaurant-api';
import { productsApi, api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Calculator, ChefHat, Plus, Trash2, Edit, TrendingUp, 
  DollarSign, Sparkles, AlertCircle, ShoppingBag, Check, 
  X, Layers, Search, Eye, Scale, CookingPot 
} from 'lucide-react';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { cn } from '@/lib/utils';
import { PageLoader, Spinner } from '@/components/ui/spinner';

interface Ingredient {
  ingredient_product_id: string;
  quantity: number;
  uom_id?: string;
  uom_name?: string;
  uom?: { id: string; name: string };
  base_uom_id?: string;
  product?: {
    name: string;
    cost_price?: number;
    base_uom_id?: string;
    base_uom?: { id: string; name: string; symbol: string };
  };
  ingredient_product?: {
    name: string;
    cost_price?: number;
    base_uom_id?: string;
    base_uom?: { id: string; name: string; symbol: string };
  };
}

interface Recipe {
  id: string;
  name: string;
  yield_quantity: string;
  yield_uom_id?: string;
  yield_uom?: { id: string; name: string; symbol: string };
  notes?: string;
  product: {
    id: string;
    name: string;
    selling_price: number;
  };
  ingredients: Ingredient[];
}

export default function RecipesCostingPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isProduceModalOpen, setIsProduceModalOpen] = useState(false);

  // Detail Modal view
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Batch Production state
  const [produceRecipe, setProduceRecipe] = useState<Recipe | null>(null);
  const [produceBatchCount, setProduceBatchCount] = useState<number>(1);
  const [produceNotes, setProduceNotes] = useState<string>('');
  const [productionAvailability, setProductionAvailability] = useState<any>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState<boolean>(false);
  const [isProducing, setIsProducing] = useState<boolean>(false);

  // Form states
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [targetProductId, setTargetProductId] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [yieldQty, setYieldQty] = useState<number>(1);
  const [yieldUomId, setYieldUomId] = useState('');
  const [recipeNotes, setRecipeNotes] = useState('');
  
  // Ingredients list in builder
  const [builderIngredients, setBuilderIngredients] = useState<any[]>([]);
  
  // Single Ingredient row input state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedIngredientProduct, setSelectedIngredientProduct] = useState<any>(null);
  const [ingredientQty, setIngredientQty] = useState<number>(1);
  const [ingredientUomId, setIngredientUomId] = useState('');
  const [uoms, setUoms] = useState<any[]>([]);
  const [uomConversions, setUomConversions] = useState<any[]>([]);

  // Load recipes and products
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [recipeList, productListRes, uomsRes, conversionsRes] = await Promise.all([
        restaurantApi.getRecipes(),
        productsApi.getAll({ limit: 100 }),
        api.get('/uom').catch(() => ({ data: [] })),
        api.get('/uom/conversions').catch(() => ({ data: [] }))
      ]);
      setRecipes(recipeList || []);
      setProducts(productListRes.data || productListRes || []);
      setUoms(uomsRes.data || uomsRes || []);
      setUomConversions(conversionsRes.data || conversionsRes || []);
    } catch (err) {
      toast.error('Failed to load recipes data');
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenProduce(recipe: Recipe) {
    setProduceRecipe(recipe);
    setProduceBatchCount(1);
    setProduceNotes('');
    setProductionAvailability(null);
    setIsProduceModalOpen(true);
    setIsCheckingAvailability(true);
    try {
      const check = await restaurantApi.checkProductionAvailability(recipe.id, 1);
      setProductionAvailability(check);
    } catch (err) {
      toast.error('Could not check ingredient stock availability');
    } finally {
      setIsCheckingAvailability(false);
    }
  }

  async function handleBatchCountChange(count: number) {
    const val = Math.max(1, count);
    setProduceBatchCount(val);
    if (!produceRecipe) return;
    setIsCheckingAvailability(true);
    try {
      const check = await restaurantApi.checkProductionAvailability(produceRecipe.id, val);
      setProductionAvailability(check);
    } catch (err) {
      console.error('Check availability error', err);
    } finally {
      setIsCheckingAvailability(false);
    }
  }

  async function handleConfirmProduction() {
    if (!produceRecipe) return;
    setIsProducing(true);
    try {
      const res = await restaurantApi.produceBatch(produceRecipe.id, {
        batch_count: produceBatchCount,
        notes: produceNotes,
      });
      toast.success(
        `🎉 Successfully cooked ${res.producedQuantity} portions of ${res.productName || produceRecipe.name}! Stock updated to ${res.currentStock}.`
      );
      setIsProduceModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to execute kitchen production');
    } finally {
      setIsProducing(false);
    }
  }


  // Handle product search for ingredients
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const filtered = products.filter(p => {
      const q = searchQuery.toLowerCase();
      return (
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    });
    setSearchResults(filtered);
  }, [searchQuery, products]);

  const handleAddIngredientRow = () => {
    if (!selectedIngredientProduct) {
      toast.error('Please select an ingredient product');
      return;
    }
    const existing = builderIngredients.find(b => b.ingredient_product_id === selectedIngredientProduct.id);
    if (existing) {
      toast.error('Ingredient already added to recipe');
      return;
    }

    setBuilderIngredients([...builderIngredients, {
      ingredient_product_id: selectedIngredientProduct.id,
      quantity: Number(ingredientQty),
      uom_id: ingredientUomId,
      uom_name: uoms.find(u => u.id === ingredientUomId)?.name || 'units',
      base_uom_id: selectedIngredientProduct.base_uom_id || undefined,
      product: {
        name: selectedIngredientProduct.name,
        cost_price: selectedIngredientProduct.cost_price || 0,
        base_uom: selectedIngredientProduct.base_uom || undefined
      }
    }]);

    setSelectedIngredientProduct(null);
    setSearchQuery('');
    setIngredientQty(1);
    setIngredientUomId('');
  };

  const handleRemoveIngredientRow = (productId: string) => {
    setBuilderIngredients(builderIngredients.filter(b => b.ingredient_product_id !== productId));
  };

  const handleCreateRecipe = async () => {
    if (!targetProductId || !recipeName.trim() || builderIngredients.length === 0) {
      toast.error('Please select a target product, enter a name, and add ingredients');
      return;
    }

    try {
      const payload = {
        product_id: targetProductId,
        name: recipeName,
        yield_quantity: Number(yieldQty),
        yield_uom_id: yieldUomId || undefined,
        notes: recipeNotes || undefined,
        ingredients: builderIngredients.map(b => ({
          ingredient_product_id: b.ingredient_product_id,
          quantity: b.quantity,
          uom_id: b.uom_id || undefined
        }))
      };

      if (editingRecipe) {
        await restaurantApi.updateRecipe(editingRecipe.id, payload);
        toast.success('Recipe updated successfully!');
      } else {
        await restaurantApi.createRecipe(payload);
        toast.success('Recipe created successfully!');
      }

      setIsRecipeModalOpen(false);
      resetBuilderForm();
      loadData();
    } catch (err) {
      toast.error('Failed to save recipe');
    }
  };

  const resetBuilderForm = () => {
    setEditingRecipe(null);
    setTargetProductId('');
    setRecipeName('');
    setYieldQty(1);
    setYieldUomId('');
    setRecipeNotes('');
    setBuilderIngredients([]);
    setSelectedIngredientProduct(null);
    setSearchQuery('');
  };

  const handleOpenEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setTargetProductId(recipe.product.id);
    setRecipeName(recipe.name);
    setYieldQty(Number(recipe.yield_quantity));
    setYieldUomId(recipe.yield_uom_id || '');
    setRecipeNotes(recipe.notes || '');
    setBuilderIngredients(recipe.ingredients.map(ing => {
      const prod = (ing as any).product || (ing as any).ingredient_product;
      return {
        ingredient_product_id: ing.ingredient_product_id,
        quantity: Number(ing.quantity),
        uom_id: ing.uom_id,
        uom_name: ing.uom?.name || 'units',
        base_uom_id: prod?.base_uom_id || prod?.base_uom?.id,
        product: {
          name: prod?.name || 'Raw Ingredient',
          cost_price: prod?.cost_price || 0,
          base_uom_id: prod?.base_uom_id,
          base_uom: prod?.base_uom
        }
      };
    }));
    setIsRecipeModalOpen(true);
  };

  const getConversionFactor = (recipeUomId?: string, productBaseUomId?: string): number => {
    if (!recipeUomId || !productBaseUomId) return 1;
    if (recipeUomId === productBaseUomId) return 1;

    const conversion = uomConversions.find(
      (c: any) => c.from_uom_id === recipeUomId && c.to_uom_id === productBaseUomId
    );
    if (conversion) return Number(conversion.factor);

    return 1;
  };

  const calculateIngredientCost = (ing: Ingredient): number => {
    const prod = ing.product || ing.ingredient_product;
    const costPerBaseUnit = prod?.cost_price || 0;
    const recipeUomId = ing.uom_id || ing.uom?.id;
    const baseUomId = ing.base_uom_id || prod?.base_uom_id || prod?.base_uom?.id;
    const factor = getConversionFactor(recipeUomId, baseUomId);
    return costPerBaseUnit * factor * Number(ing.quantity);
  };

  const calculateTotalCost = (ingredients: Ingredient[]) => {
    return ingredients.reduce((acc, ing) => acc + calculateIngredientCost(ing), 0);
  };

  const calculateMargin = (sellingPrice: number, totalCost: number) => {
    if (!sellingPrice) return 0;
    const profit = sellingPrice - totalCost;
    return (profit / sellingPrice) * 100;
  };

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20 shadow-2xs">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Recipe costing & yield
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Formulate menu Bill of Materials (BOM), calculate raw costs, and optimize profit margins.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <PermissionGuard permission="restaurant_recipes:create">
            <Button
              onClick={() => { resetBuilderForm(); setIsRecipeModalOpen(true); }}
              className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-4 shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create recipe BOM</span>
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Recipes Catalog Grid */}
      {loading ? (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-16 flex flex-col items-center justify-center">
          <Spinner className="w-8 h-8 text-slate-900 dark:text-white mb-2" />
          <span className="text-xs text-slate-500">Loading recipe engineering data...</span>
        </Card>
      ) : recipes.length === 0 ? (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 border border-amber-500/20">
            <ChefHat className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">No recipes engineered yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Create Bill of Material (BOM) formulas to link raw inventory items with menu products.
          </p>
          <PermissionGuard permission="restaurant_recipes:create">
            <Button
              onClick={() => { resetBuilderForm(); setIsRecipeModalOpen(true); }}
              className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4 mt-4 shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add first recipe
            </Button>
          </PermissionGuard>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recipes.map((recipe) => {
            const yieldQty = Number(recipe.yield_quantity) || 1;
            const batchCost = calculateTotalCost(recipe.ingredients);
            const unitCost = batchCost / yieldQty;
            const unitSellingPrice = recipe.product?.selling_price || 0;
            const batchSellingPrice = unitSellingPrice * yieldQty;
            const margin = calculateMargin(unitSellingPrice, unitCost);
            const isMarginPositive = margin > 0;
            const isMarginGood = margin >= 60;
            
            return (
              <Card 
                key={recipe.id} 
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between overflow-hidden hover:shadow-md transition-all"
              >
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/20">
                  <div className="pr-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{recipe.name}</h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <ShoppingBag className="w-3 h-3 text-slate-400" /> For: <span className="font-semibold text-slate-700 dark:text-slate-300">{recipe.product.name}</span>
                    </p>
                  </div>
                  <PermissionGuard permission="restaurant_recipes:update">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white" 
                      onClick={() => handleOpenEdit(recipe)}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  </PermissionGuard>
                </div>

                <CardContent className="p-5 space-y-4">
                  {/* Metric Tiles */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center flex flex-col justify-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        {yieldQty > 1 ? 'Cost / Portion' : 'Raw Cost'}
                      </span>
                      <p className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        ৳ {(unitCost / 100).toFixed(2)}
                      </p>
                      {yieldQty > 1 && (
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          Batch ({yieldQty}): ৳ {(batchCost / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center flex flex-col justify-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        {yieldQty > 1 ? 'Price / Portion' : 'Selling Price'}
                      </span>
                      <p className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        ৳ {(unitSellingPrice / 100).toFixed(2)}
                      </p>
                      {yieldQty > 1 && (
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          Batch rev: ৳ {(batchSellingPrice / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Margin Badge */}
                  <div className="flex justify-between items-center text-xs p-3 bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800 rounded-xl">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-slate-400" /> Gross Food Margin
                    </span>
                    <span className={cn(
                      "font-mono font-bold text-xs px-2.5 py-0.5 rounded-full border",
                      !isMarginPositive
                        ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200/50"
                        : isMarginGood 
                          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/50" 
                          : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200/50"
                    )}>
                      {margin > 0 ? `+${margin.toFixed(1)}%` : `${margin.toFixed(1)}%`}
                    </span>
                  </div>

                  {/* Metadata Row */}
                  <div className="text-[11px] text-slate-400 flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800 font-mono">
                    <span>Ingredients: <strong className="text-slate-700 dark:text-slate-300">{recipe.ingredients?.length || 0} items</strong></span>
                    <span>Yield: <strong className="text-slate-700 dark:text-slate-300">{yieldQty} {recipe.yield_uom?.name || 'portions'}</strong></span>
                  </div>
                </CardContent>

                {/* Footer Actions */}
                <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full rounded-xl text-xs font-semibold h-8 border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5"
                    onClick={() => { setSelectedRecipe(recipe); setIsDetailModalOpen(true); }}
                  >
                    <Eye className="w-3.5 h-3.5" /> View BOM
                  </Button>
                  <PermissionGuard permission="restaurant_recipes:update">
                    <Button 
                      size="sm" 
                      className="w-full rounded-xl text-xs font-semibold h-8 bg-amber-600 hover:bg-amber-700 text-white shadow-2xs flex items-center justify-center gap-1.5"
                      onClick={() => handleOpenProduce(recipe)}
                    >
                      <CookingPot className="w-3.5 h-3.5" /> Cook batch
                    </Button>
                  </PermissionGuard>
                </div>

              </Card>
            );
          })}
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Recipe Builder Modal */}
      <Dialog open={isRecipeModalOpen} onOpenChange={setIsRecipeModalOpen}>
        <DialogContent className="sm:max-w-3xl p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 max-h-[90vh] flex flex-col">
          <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                  <Calculator className="w-3.5 h-3.5" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {editingRecipe ? 'Edit recipe BOM formula' : 'Create recipe BOM formula'}
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Formulate ingredients composition, yield units, and food cost engineering.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Recipe Name <span className="text-rose-500">*</span>
                </Label>
                <Input 
                  value={recipeName} 
                  onChange={(e) => setRecipeName(e.target.value)} 
                  placeholder="e.g. Signature Beef Patty" 
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Target Menu Item <span className="text-rose-500">*</span>
                </Label>
                <select
                  value={targetProductId}
                  onChange={(e) => setTargetProductId(e.target.value)}
                  className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="">-- Select Menu Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Selling: ৳{(p.selling_price / 100).toFixed(0)})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Yield Quantity</Label>
                <Input type="number" min="1" value={yieldQty} onChange={(e) => setYieldQty(Number(e.target.value))} className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Yield Unit (UOM)</Label>
                <select
                  value={yieldUomId}
                  onChange={(e) => setYieldUomId(e.target.value)}
                  className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="">-- Select UOM --</option>
                  {uoms.map(u => (
                    <option key={u.id} value={u.id}>{u.symbol} - {u.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Preparation & Cooking Notes</Label>
                <Input value={recipeNotes} onChange={(e) => setRecipeNotes(e.target.value)} placeholder="Grill duration, temperature, seasoning order..." className="rounded-xl border-slate-200 dark:border-slate-800 text-xs" />
              </div>
            </div>

            {/* Ingredient builder sub-form */}
            <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Add Raw Ingredients</span>
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-6 relative space-y-1">
                  <Label className="text-xs text-slate-500">Search Raw Material</Label>
                  <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ingredient name or SKU..."
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-40 overflow-y-auto z-10 p-2 space-y-1">
                      {searchResults.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedIngredientProduct(p);
                            setSearchQuery(p.name);
                            setSearchResults([]);
                          }}
                          className="w-full text-left py-1.5 px-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 flex justify-between"
                        >
                          <span>{p.name}</span>
                          <span className="font-mono text-slate-400">৳{(p.cost_price / 100).toFixed(2)}/{p.base_uom?.symbol || 'u'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="col-span-3 space-y-1">
                  <Label className="text-xs text-slate-500">Quantity</Label>
                  <Input type="number" min="0.01" step="0.01" value={ingredientQty} onChange={(e) => setIngredientQty(Number(e.target.value))} className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-mono" />
                </div>

                <div className="col-span-3 space-y-1">
                  <Label className="text-xs text-slate-500">Unit (UOM)</Label>
                  <select
                    value={ingredientUomId}
                    onChange={(e) => setIngredientUomId(e.target.value)}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- UOM --</option>
                    {uoms.map(u => (
                      <option key={u.id} value={u.id}>{u.symbol} - {u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-12">
                  <Button 
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="w-full rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white h-9 shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add ingredient item
                  </Button>
                </div>
              </div>

              {/* Added ingredients list */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-2 max-h-48 overflow-y-auto space-y-1.5">
                {builderIngredients.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-100 dark:border-slate-800/80 last:border-0 p-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.product.name}</p>
                      <span className="text-[11px] font-mono text-slate-400">
                        {item.quantity} {item.uom_name} — Raw Cost: ৳{(calculateIngredientCost(item) / 100).toFixed(2)}
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleRemoveIngredientRow(item.ingredient_product_id)}
                      className="h-7 w-7 text-rose-500 hover:bg-rose-50 p-0 rounded-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                {builderIngredients.length === 0 && (
                  <p className="text-xs text-slate-400 py-6 text-center">No raw ingredients added to formula yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs font-medium text-slate-500 space-y-0.5">
              <div>
                Formula Raw Cost: <strong className="font-mono text-slate-900 dark:text-white text-sm">৳ {(calculateTotalCost(builderIngredients) / 100).toFixed(2)}</strong>
                {yieldQty > 1 && (
                  <span className="text-slate-400 ml-2 font-mono text-[11px]">
                    (৳ {(calculateTotalCost(builderIngredients) / (yieldQty || 1) / 100).toFixed(2)} / portion)
                  </span>
                )}
              </div>
              {targetProductId && (() => {
                const prod = products.find(p => p.id === targetProductId);
                if (!prod) return null;
                const bCost = calculateTotalCost(builderIngredients);
                const uCost = bCost / (yieldQty || 1);
                const m = calculateMargin(prod.selling_price || 0, uCost);
                return (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span>Target Price: ৳ {((prod.selling_price || 0) / 100).toFixed(2)}</span>
                    <span>•</span>
                    <span>Est. Food Margin: <strong className={m >= 60 ? "text-emerald-600 font-bold" : m > 0 ? "text-amber-600 font-bold" : "text-rose-600 font-bold"}>{m > 0 ? `+${m.toFixed(1)}%` : `${m.toFixed(1)}%`}</strong></span>
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center gap-2.5">
              <Button variant="outline" onClick={() => setIsRecipeModalOpen(false)} className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700">
                Cancel
              </Button>
              <PermissionGuard permission="restaurant_recipes:update">
                <Button onClick={handleCreateRecipe} className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> {editingRecipe ? 'Update recipe' : 'Save recipe'}
                </Button>
              </PermissionGuard>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details View Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                  <ChefHat className="w-3.5 h-3.5" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {selectedRecipe?.name}
                </DialogTitle>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ingredients formula breakdown and yield specification.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/20 max-h-60 overflow-y-auto space-y-2">
              {selectedRecipe?.ingredients.map((ing, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-100 dark:border-slate-800/80 last:border-0 pb-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {ing.product?.name || (ing as any).ingredient_product?.name || 'Raw Ingredient'}
                    </p>
                    <span className="text-[11px] font-mono text-slate-400">
                      Qty: {Number(ing.quantity)} {ing.uom?.name || 'units'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    ৳ {(calculateIngredientCost(ing) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {selectedRecipe && (() => {
              const selYield = Number(selectedRecipe.yield_quantity) || 1;
              const selBatchCost = calculateTotalCost(selectedRecipe.ingredients);
              const selUnitCost = selBatchCost / selYield;
              const selUnitPrice = selectedRecipe.product?.selling_price || 0;
              const selMargin = calculateMargin(selUnitPrice, selUnitCost);
              return (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Batch Yield:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {selYield} {selectedRecipe.yield_uom?.name || 'portions'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Total Batch Raw Cost:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      ৳ {(selBatchCost / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Cost per Portion:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      ৳ {(selUnitCost / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500 font-medium">Selling Price per Portion:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      ৳ {(selUnitPrice / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Gross Food Margin:</span>
                    <span className={cn(
                      "font-mono font-bold text-xs px-2.5 py-0.5 rounded-full border",
                      selMargin >= 60 
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/50" 
                        : selMargin > 0
                        ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200/50"
                        : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200/50"
                    )}>
                      {selMargin > 0 ? `+${selMargin.toFixed(1)}%` : `${selMargin.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              );
            })()}

            {selectedRecipe?.notes && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Preparation Instructions</span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{selectedRecipe.notes}</p>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end">
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)} className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kitchen Batch Production Modal */}
      <Dialog open={isProduceModalOpen} onOpenChange={setIsProduceModalOpen}>
        <DialogContent className="sm:max-w-lg p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          <div className="px-6 py-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-b border-amber-200/60 dark:border-amber-900/40 pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
                  <CookingPot className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                    Cook / Produce Recipe Batch
                  </DialogTitle>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Deduct raw ingredients from stock and credit ready-to-sell portions to active inventory.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Target Product & Yield info */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target Menu Item</span>
                <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                  {produceRecipe?.product?.name || produceRecipe?.name}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Batch Yield</span>
                <p className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  {Number(produceRecipe?.yield_quantity) || 1} {produceRecipe?.yield_uom?.name || 'portions'} / batch
                </p>
              </div>
            </div>

            {/* Batch Counter Input */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Batches to Cook (Deg / Batch)
                </Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={produceBatchCount}
                  onChange={(e) => handleBatchCountChange(Math.max(1, parseInt(e.target.value) || 1))}
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-sm font-mono font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Total Finished Output
                </Label>
                <div className="h-10 px-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
                  <span>+{productionAvailability?.totalYield || (Number(produceRecipe?.yield_quantity) || 1) * produceBatchCount}</span>
                  <span className="text-[10px] text-amber-600/80 font-normal">portions ready to sell</span>
                </div>
              </div>
            </div>

            {/* Live Ingredient Availability Check */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-slate-400" /> Required Raw Ingredients
                </span>
                {isCheckingAvailability && (
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Spinner className="w-3 h-3" /> Checking stock...
                  </span>
                )}
              </div>

              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/20 max-h-48 overflow-y-auto space-y-2">
                {productionAvailability?.ingredients && productionAvailability.ingredients.length > 0 ? (
                  productionAvailability.ingredients.map((ing: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-100 dark:border-slate-800/80 last:border-0 pb-1.5">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{ing.name}</p>
                        <span className="text-[11px] font-mono text-slate-400">
                          Required: <strong className="text-slate-700 dark:text-slate-300">{ing.requiredQuantity} {ing.uom}</strong> (In stock: {ing.availableQuantity} {ing.uom})
                        </span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono",
                        ing.isAvailable
                          ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/60"
                          : "text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-200/60"
                      )}>
                        {ing.isAvailable ? 'In Stock ✓' : 'Short Stock ⚠️'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-3 text-xs text-slate-400">
                    {isCheckingAvailability ? 'Checking inventory...' : 'No ingredients defined'}
                  </div>
                )}
              </div>

              {productionAvailability && !productionAvailability.canProduce && !isCheckingAvailability && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Cannot cook batch: Insufficient raw ingredients in branch kitchen storage.</span>
                </div>
              )}
            </div>

            {/* Optional Notes */}
            <div className="space-y-1">
              <Label className="text-[11px] text-slate-500 font-medium">Production Notes (Optional)</Label>
              <Input
                placeholder="e.g. Lunch Deg #1 by Chef Kalam"
                value={produceNotes}
                onChange={(e) => setProduceNotes(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setIsProduceModalOpen(false)}
              className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmProduction}
              disabled={isProducing || isCheckingAvailability || !productionAvailability?.canProduce}
              className="rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white px-5 shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isProducing ? (
                <>
                  <Spinner className="w-3.5 h-3.5 text-white" />
                  <span>Cooking batch...</span>
                </>
              ) : (
                <>
                  <CookingPot className="w-3.5 h-3.5" />
                  <span>Confirm Kitchen Production (+{productionAvailability?.totalYield || (Number(produceRecipe?.yield_quantity) || 1) * produceBatchCount})</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

