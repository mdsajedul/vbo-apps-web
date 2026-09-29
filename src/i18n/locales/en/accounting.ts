export const accounting = {
  title: 'General Ledger & Financial Accounting',
  subtitle: 'Double-entry bookkeeping, trial balance audits, automated financial statements, and chart of accounts.',
  
  // Tabs
  tab_accounts: 'Chart of Accounts',
  tab_journals: 'Journal Entries',
  tab_general_ledger: 'General Ledger',
  tab_trial_balance: 'Trial Balance',
  tab_profit_loss: 'Profit & Loss',
  tab_balance_sheet: 'Balance Sheet',

  // Buttons
  btn_add_account: 'Create Ledger Account',
  btn_add_journal: 'Post Journal Entry',

  // Chart of Accounts Table
  col_code: 'Account Code',
  col_account_name: 'Account Name',
  col_type: 'Account Type',
  col_balance: 'Net Balance',
  col_actions: 'Actions',
  no_accounts: 'No ledger accounts found. Click "Create Ledger Account" to initialize.',

  // Account Types
  type_asset: 'Asset',
  type_liability: 'Liability',
  type_equity: 'Equity',
  type_revenue: 'Revenue',
  type_expense: 'Expense',

  // Create / Edit Account Modal
  account_modal_title_new: 'Create Ledger Account',
  account_modal_title_edit: 'Edit Ledger Account',
  account_modal_subtitle: 'Define an accounting ledger classification within your organizational chart.',
  field_code: 'Account Code / Number',
  field_code_placeholder: 'e.g., 1010, 2020, 5010',
  field_name: 'Account Title',
  field_name_placeholder: 'e.g., Cash at Bank, Accounts Receivable, Sales Revenue',
  field_type: 'Classification Type',
  btn_save_account: 'Save Ledger Account',
  btn_saving: 'Saving...',
  account_saved_success: 'Ledger account saved successfully',
  account_save_failed: 'Failed to save ledger account',
  delete_account_title: 'Delete Ledger Account',
  delete_account_desc: 'Are you sure you want to delete this account? Accounts with posted journal history cannot be deleted.',
  account_deleted_success: 'Ledger account deleted successfully',
  account_delete_failed: 'Failed to delete ledger account',

  // Journal Entries Tab & Modal
  journal_modal_title: 'Post New Journal Entry',
  journal_modal_subtitle: 'Record a double-entry transaction. Debits and credits must balance to zero.',
  field_entry_date: 'Posting Date',
  field_entry_desc: 'Narration / Description',
  field_entry_desc_placeholder: 'Describe the business transaction...',
  col_journal_account: 'Ledger Account',
  col_debit: 'Debit (Dr)',
  col_credit: 'Credit (Cr)',
  btn_add_line: 'Add Line',
  total_debit: 'Total Debit',
  total_credit: 'Total Credit',
  difference: 'Out of Balance',
  btn_post_journal: 'Post Journal Entry',
  btn_posting: 'Posting...',
  journal_posted_success: 'Journal entry posted successfully',
  journal_post_failed: 'Failed to post journal entry. Ensure debits equal credits.',
  no_journals: 'No journal entries recorded.',
  
  // Reports
  col_date: 'Date',
  col_ref: 'Ref / Entry #',
  col_description: 'Description',
  filter_organization: 'Organization Filter',
  total_assets: 'Total Assets',
  total_liabilities: 'Total Liabilities',
  total_equity: 'Total Equity',
  net_profit: 'Net Profit / (Loss)',
  operating_revenue: 'Operating Revenue',
  operating_expenses: 'Operating Expenses',
};
