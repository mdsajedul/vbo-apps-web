const TITLE_TO_KEY: Record<string, string> = {
  // Navigation Groups
  'CRM': 'crm',
  'Catalog': 'catalog',
  'Product Catalog': 'catalog',
  'Inventory': 'inventory',
  'Warehouse': 'warehouse',
  'Sales': 'sales',
  'Sales & Billing': 'sales_billing',
  'SALES & BILLING': 'sales_billing',
  'Invoices': 'invoices',
  'Customers': 'customers',
  'Customers & Loyalty': 'customers_loyalty',
  'CUSTOMERS & LOYALTY': 'customers_loyalty',
  'Procurement': 'procurement',
  'E-Commerce': 'ecommerce',
  'E-commerce Channels': 'ecommerce_channels',
  'E-COMMERCE CHANNELS': 'ecommerce_channels',
  'Restaurant': 'restaurant',
  'Restaurant Vertical': 'restaurant_vertical',
  'RESTAURANT VERTICAL': 'restaurant_vertical',
  'Accounting': 'accounting',
  'Accounting & Ledger': 'accounting_ledger',
  'ACCOUNTING & LEDGER': 'accounting_ledger',
  'Reports & BI': 'bi_analytics',
  'Reports': 'bi_analytics',
  'BI & Analytics': 'bi_analytics',
  'BI & ANALYTICS': 'bi_analytics',
  'Settings': 'settings',
  'SETTINGS': 'settings',
  'Super Admin': 'admin',

  // Navigation Items
  'Dashboard': 'dashboard',
  'Leads': 'leads',
  'Opportunities': 'opportunities',
  'Pipelines': 'pipelines',
  'Segments': 'segments',
  'Products': 'products',
  'Categories': 'categories',
  'Brands': 'brands',
  'Import Products': 'import_products',
  'Overview': 'overview',
  'Stock Batches': 'stock_batches',
  'Stock Transfers': 'stock_transfers',
  'Suppliers': 'suppliers',
  'Transfer Bins': 'transfer_bins',
  'All Sales': 'all_sales',
  'Shift Management': 'shift_management',
  'Sales Returns': 'sales_returns',
  'All Invoices': 'all_invoices',
  'Create Invoice': 'create_invoice',
  'Customer Directory': 'customer_directory',
  'Loyalty Rewards': 'loyalty_rewards',
  'Digital Gift Cards': 'digital_gift_cards',
  'Purchase Orders': 'purchase_orders',
  'Sales Channels': 'sales_channels',
  'Orders Sync': 'orders_sync',
  'Integration Logs': 'integration_logs',
  'Kitchen Display (KDS)': 'kitchen_display',
  'Table Floor Plans': 'table_floor_plans',
  'Reservations': 'reservations',
  'Recipe Management': 'recipe_management',
  'Operation Settings': 'operation_settings',
  'Business Reports': 'business_reports',
  'Templates': 'templates',
  'Saved Reports': 'saved_reports',
  'Schedules': 'schedules',
  'Comparative': 'comparative',
  'Users': 'users',
  'Roles & Security': 'roles_security',
  'Permissions': 'permissions',
  'Organization': 'organization',
  'Branches': 'branches',
  'Tax & VAT': 'tax_vat',
  'Payment Gateways': 'payment_gateways',
  'Subscription & Billing': 'subscription_billing',
  'Units of Measure': 'units_of_measure',
  'POS': 'pos',
  'Point of Sale': 'point_of_sale',
  'Point of Sale (POS)': 'point_of_sale',
  'Retail POS': 'retail_pos',
  'Restaurant POS': 'restaurant_pos',
};

export function getNavTranslationKey(title: string): string {
  if (!title) return 'nav.dashboard';

  // Exact match
  if (TITLE_TO_KEY[title]) {
    return `nav.${TITLE_TO_KEY[title]}`;
  }

  // Case-insensitive match
  const lower = title.trim().toLowerCase();
  for (const [key, val] of Object.entries(TITLE_TO_KEY)) {
    if (key.toLowerCase() === lower) {
      return `nav.${val}`;
    }
  }

  // Fallback slug
  const normalized = lower.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `nav.${normalized}`;
}
