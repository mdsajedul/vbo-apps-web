export const accounting = {
  title: 'সাধারণ খতিয়ান ও আর্থিক হিসাববিজ্ঞান',
  subtitle: 'দু-তরফা দাখিলা হিসাবরক্ষণ, রেওয়ামিল নিরীক্ষা, স্বয়ংক্রিয় আর্থিক বিবরণী এবং হিসাবের তালিকা।',
  
  // Tabs
  tab_accounts: 'হিসাবের তালিকা (Chart of Accounts)',
  tab_journals: 'জাবেদা দাখিলা (Journal Entries)',
  tab_general_ledger: 'সাধারণ খতিয়ান (General Ledger)',
  tab_trial_balance: 'রেওয়ামিল (Trial Balance)',
  tab_profit_loss: 'লাভ-ক্ষতি বিবরণী (Profit & Loss)',
  tab_balance_sheet: 'উদ্বৃত্তপত্র (Balance Sheet)',

  // Buttons
  btn_add_account: 'নতুন খতিয়ান হিসাব তৈরি',
  btn_add_journal: 'জাবেদা দাখিলা পোস্ট করুন',

  // Chart of Accounts Table
  col_code: 'হিসাব কোড',
  col_account_name: 'হিসাবের নাম',
  col_type: 'হিসাবের ধরন',
  col_balance: 'নীট ব্যালেন্স',
  col_actions: 'অ্যাকশন',
  no_accounts: 'কোনো খতিয়ান হিসাব পাওয়া যায়নি। শুরু করতে "নতুন খতিয়ান হিসাব তৈরি" ক্লিক করুন।',

  // Account Types
  type_asset: 'সম্পদ (Asset)',
  type_liability: 'দায় (Liability)',
  type_equity: 'মালিকানাস্বত্ব (Equity)',
  type_revenue: 'রাজস্ব / আয় (Revenue)',
  type_expense: 'ব্যয় (Expense)',

  // Create / Edit Account Modal
  account_modal_title_new: 'নতুন খতিয়ান হিসাব তৈরি',
  account_modal_title_edit: 'খতিয়ান হিসাব সম্পাদনা',
  account_modal_subtitle: 'আপনার প্রতিষ্ঠানের চার্ট অফ অ্যাকাউন্টসে একটি নতুন হিসাবের শ্রেণিবিভাগ নির্ধারণ করুন।',
  field_code: 'হিসাব কোড / নম্বর',
  field_code_placeholder: 'যেমন: ১০১০, ২০২০, ৫০১০',
  field_name: 'হিসাবের শিরোনাম',
  field_name_placeholder: 'যেমন: ব্যাংক জমা, দেনাদার হিসাব, বিক্রয় আয়',
  field_type: 'শ্রেণিবিভাগের ধরন',
  btn_save_account: 'খতিয়ান হিসাব সংরক্ষণ',
  btn_saving: 'সংরক্ষণ হচ্ছে...',
  account_saved_success: 'খতিয়ান হিসাব সফলভাবে সংরক্ষিত হয়েছে',
  account_save_failed: 'খতিয়ান হিসাব সংরক্ষণ করতে ব্যর্থ হয়েছে',
  delete_account_title: 'খতিয়ান হিসাব মুছে ফেলুন',
  delete_account_desc: 'আপনি কি নিশ্চিতভাবে এই অ্যাকাউন্টটি মুছে ফেলতে চান? পূর্ববর্তী জাবেদা রেকর্ড থাকা অ্যাকাউন্ট মুছে ফেলা যাবে না।',
  account_deleted_success: 'খতিয়ান হিসাব সফলভাবে মুছে ফেলা হয়েছে',
  account_delete_failed: 'খতিয়ান হিসাব মুছে ফেলতে ব্যর্থ হয়েছে',

  // Journal Entries Tab & Modal
  journal_modal_title: 'নতুন জাবেদা দাখিলা পোস্ট করুন',
  journal_modal_subtitle: 'দু-তরফা দাখিলা লেনদেন লিপিবদ্ধ করুন। ডেবিট ও ক্রেডিট সমান হতে হবে।',
  field_entry_date: 'পোস্টিংয়ের তারিখ',
  field_entry_desc: 'বিবরণ / বর্ণনা',
  field_entry_desc_placeholder: 'ব্যবসায়িক লেনদেনের বিবরণ লিখুন...',
  col_journal_account: 'খতিয়ান হিসাব',
  col_debit: 'ডেবিট (Dr)',
  col_credit: 'ক্রেডিট (Cr)',
  btn_add_line: 'নতুন লাইন যোগ',
  total_debit: 'মোট ডেবিট',
  total_credit: 'মোট ক্রেডিট',
  difference: 'অসামঞ্জস্য (Out of Balance)',
  btn_post_journal: 'জাবেদা দাখিলা সংরক্ষণ করুন',
  btn_posting: 'পোস্ট হচ্ছে...',
  journal_posted_success: 'জাবেদা দাখিলা সফলভাবে পোস্ট হয়েছে',
  journal_post_failed: 'জাবেদা দাখিলা পোস্ট করতে ব্যর্থ হয়েছে। ডেবিট ও ক্রেডিট সমান কিনা নিশ্চিত করুন।',
  no_journals: 'কোনো জাবেদা দাখিলা রেকর্ড পাওয়া যায়নি।',
  
  // Reports
  col_date: 'তারিখ',
  col_ref: 'রেফারেন্স / দাখিলা নং',
  col_description: 'বিবরণ',
  filter_organization: 'প্রতিষ্ঠান ফিল্টার',
  total_assets: 'মোট সম্পদ',
  total_liabilities: 'মোট দায়',
  total_equity: 'মোট মালিকানাস্বত্ব',
  net_profit: 'নীট লাভ / (ক্ষতি)',
  operating_revenue: 'পরিচালন রাজস্ব',
  operating_expenses: 'পরিচালন ব্যয়',
};
