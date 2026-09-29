'use client';

import { useState, useEffect } from 'react';
import { accountingApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { 
  Plus, Trash2, Edit, Landmark, BookOpen, Receipt, 
  ScrollText, Scale, TrendingUp, PieChart, Check, 
  AlertCircle, Tag, FileText, ArrowRight, DollarSign 
} from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { OrganizationSelector } from '@/components/ui/organization-selector';
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PageLoader, Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';

export default function AccountingPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'accounts' | 'journals' | 'trial_balance' | 'general_ledger' | 'profit_loss' | 'balance_sheet'>('accounts');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState('');

  // Modal states
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [submittingAccount, setSubmittingAccount] = useState(false);
  const [submittingJournal, setSubmittingJournal] = useState(false);

  // Form states
  const [accountForm, setAccountForm] = useState({ code: '', name: '', type: 'ASSET' });
  const [journalForm, setJournalForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    lines: [
      { account_id: '', debit: 0, credit: 0 },
      { account_id: '', debit: 0, credit: 0 }
    ]
  });

  const tabs = [
    { id: 'accounts', label: t('accounting.tab_accounts'), icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'journals', label: t('accounting.tab_journals'), icon: <Receipt className="w-3.5 h-3.5" /> },
    { id: 'general_ledger', label: t('accounting.tab_general_ledger'), icon: <ScrollText className="w-3.5 h-3.5" /> },
    { id: 'trial_balance', label: t('accounting.tab_trial_balance'), icon: <Scale className="w-3.5 h-3.5" /> },
    { id: 'profit_loss', label: t('accounting.tab_profit_loss'), icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'balance_sheet', label: t('accounting.tab_balance_sheet'), icon: <PieChart className="w-3.5 h-3.5" /> },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'accounts') {
        const res = await accountingApi.getAccounts();
        setAccounts(res.data || res);
      } else if (activeTab === 'journals') {
        const res = await accountingApi.getJournals();
        setJournals(res.data || res);
        if (accounts.length === 0) {
          const accRes = await accountingApi.getAccounts();
          setAccounts(accRes.data || accRes);
        }
      } else {
        // Reports tabs
        const res = await accountingApi.getReports();
        setReports(res);
      }
    } catch (err) {
      toast.error(`Failed to load ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAccount(true);
    try {
      if (editingAccountId) {
        await accountingApi.updateAccount(editingAccountId, accountForm);
        toast.success('Account updated successfully');
      } else {
        await accountingApi.createAccount(accountForm);
        toast.success('Account created successfully');
      }
      setIsAccountModalOpen(false);
      setAccountForm({ code: '', name: '', type: 'ASSET' });
      setEditingAccountId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save account');
    } finally {
      setSubmittingAccount(false);
    }
  };

  const confirmDeleteAccount = (id: string) => {
    setDeletingAccountId(id);
    setIsDeleteDialogOpen(true);
  };

  const executeDeleteAccount = async () => {
    if (!deletingAccountId) return;
    try {
      await accountingApi.deleteAccount(deletingAccountId);
      toast.success('Account deleted successfully');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingAccountId(null);
    }
  };

  const openEditAccount = (acc: any) => {
    setEditingAccountId(acc.id);
    setAccountForm({
      code: acc.code,
      name: acc.name,
      type: acc.type
    });
    setIsAccountModalOpen(true);
  };

  const openNewAccount = () => {
    setEditingAccountId(null);
    setAccountForm({ code: '', name: '', type: 'ASSET' });
    setIsAccountModalOpen(true);
  };

  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalDebit = journalForm.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const totalCredit = journalForm.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      toast.error(`Debits (৳ ${totalDebit.toFixed(2)}) must equal Credits (৳ ${totalCredit.toFixed(2)})`);
      return;
    }

    if (journalForm.lines.some(l => !l.account_id)) {
      toast.error('Please select an account for each line item');
      return;
    }
    
    setSubmittingJournal(true);
    try {
      const payload = {
        date: new Date(journalForm.date).toISOString(),
        description: journalForm.description,
        lines: journalForm.lines.map(line => ({
          account_id: line.account_id,
          debit: Math.round(Number(line.debit) * 100),
          credit: Math.round(Number(line.credit) * 100)
        }))
      };
      
      await accountingApi.createJournal(payload);
      toast.success('Journal entry posted successfully');
      setIsJournalModalOpen(false);
      setJournalForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        lines: [
          { account_id: '', debit: 0, credit: 0 },
          { account_id: '', debit: 0, credit: 0 }
        ]
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create journal entry');
    } finally {
      setSubmittingJournal(false);
    }
  };

  const addJournalLine = () => {
    setJournalForm({
      ...journalForm,
      lines: [...journalForm.lines, { account_id: '', debit: 0, credit: 0 }]
    });
  };

  const removeJournalLine = (index: number) => {
    if (journalForm.lines.length <= 2) {
      toast.error('A journal entry must have at least 2 lines');
      return;
    }
    const newLines = [...journalForm.lines];
    newLines.splice(index, 1);
    setJournalForm({ ...journalForm, lines: newLines });
  };

  const updateJournalLine = (index: number, field: string, value: any) => {
    const newLines = [...journalForm.lines];
    (newLines[index] as any)[field] = value;
    if (field === 'debit' && Number(value) > 0) newLines[index].credit = 0;
    if (field === 'credit' && Number(value) > 0) newLines[index].debit = 0;
    setJournalForm({ ...journalForm, lines: newLines });
  };

  const totalDebitSum = journalForm.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCreditSum = journalForm.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const isJournalBalanced = Math.abs(totalDebitSum - totalCreditSum) < 0.001 && totalDebitSum > 0;

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20 shadow-2xs">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('accounting.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('accounting.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <OrganizationSelector value={orgId} onChange={setOrgId} />
          {(activeTab === 'accounts' || activeTab === 'journals') && (
            <PermissionGuard permission="accounting:create">
              <Button 
                onClick={() => activeTab === 'accounts' ? openNewAccount() : setIsJournalModalOpen(true)}
                className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{activeTab === 'accounts' ? t('accounting.btn_add_account') : t('accounting.btn_add_journal')}</span>
              </Button>
            </PermissionGuard>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 dark:border-slate-800 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all shrink-0",
                isActive
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content View */}
      {loading ? (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-16 flex flex-col items-center justify-center">
          <Spinner className="w-8 h-8 text-slate-900 dark:text-white mb-2" />
          <span className="text-xs text-slate-500">Loading accounting ledger records...</span>
        </Card>
      ) : activeTab === 'accounts' ? (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Chart of accounts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Master general ledger accounts classified into standard accounting buckets.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700 font-mono">
              {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'}
            </span>
          </div>

          <CardContent className="p-0">
            {accounts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Account code</th>
                      <th className="px-6 py-4">Account name</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Account classification</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                    {accounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700">
                            {acc.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          {acc.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide",
                            acc.type === 'ASSET' && "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20",
                            acc.type === 'LIABILITY' && "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20",
                            acc.type === 'EQUITY' && "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200/50 dark:border-purple-500/20",
                            acc.type === 'REVENUE' && "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20",
                            acc.type === 'EXPENSE' && "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20",
                          )}>
                            {acc.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            acc.is_system 
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700' 
                              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${acc.is_system ? 'bg-slate-400' : 'bg-emerald-500'}`}></span>
                            {acc.is_system ? 'System Default' : 'Custom'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {!acc.is_system ? (
                            <div className="flex justify-end gap-1.5">
                              <PermissionGuard permission="accounting:update">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => openEditAccount(acc)}
                                  className="rounded-xl h-8 px-2.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700"
                                >
                                  <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                                </Button>
                              </PermissionGuard>
                              <PermissionGuard permission="accounting:delete">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => confirmDeleteAccount(acc.id)} 
                                  className="rounded-xl h-8 px-2.5 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-slate-200 dark:border-slate-700"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </PermissionGuard>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Locked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3 border border-slate-200/60 dark:border-slate-700">
                  <BookOpen className="w-5 h-5" />
                </div>
                <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No accounts configured</p>
                <p className="text-xs text-slate-400 mt-1">Click "Add ledger account" above to create your chart of accounts.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : activeTab === 'journals' ? (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Double-entry journal entries
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Audit trail of balanced debits and credits posted to ledger accounts.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700 font-mono">
              {journals.length} {journals.length === 1 ? 'Entry' : 'Entries'}
            </span>
          </div>

          <CardContent className="p-0">
            {journals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Posting date</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Reference</th>
                      <th className="px-6 py-4">Origin</th>
                      <th className="px-6 py-4 text-right">Debit (৳ BDT)</th>
                      <th className="px-6 py-4 text-right">Credit (৳ BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                    {journals.map((j) => {
                      const totalDebit = j.lines.reduce((sum: number, line: any) => sum + line.debit, 0);
                      const totalCredit = j.lines.reduce((sum: number, line: any) => sum + line.credit, 0);
                      return (
                        <tr key={j.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                            {format(new Date(j.date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 dark:text-white">{j.description}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{j.lines.length} Line items</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500 dark:text-slate-400">
                            {j.reference_type ? `${j.reference_type} ` : ''}
                            {j.reference_id ? `#${j.reference_id.slice(-6)}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              j.is_auto 
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${j.is_auto ? 'bg-indigo-500' : 'bg-slate-400'}`}></span>
                              {j.is_auto ? 'Automated POS/ERP' : 'Manual Entry'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            ৳ {(totalDebit / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                            ৳ {(totalCredit / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3 border border-slate-200/60 dark:border-slate-700">
                  <Receipt className="w-5 h-5" />
                </div>
                <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No journal entries recorded</p>
                <p className="text-xs text-slate-400 mt-1">Click "New journal entry" to post balanced debits and credits.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : activeTab === 'trial_balance' ? (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Trial balance summary
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Periodic verification that total debit balances equal total credit balances.
              </p>
            </div>
          </div>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Account code</th>
                    <th className="px-6 py-4">Account name</th>
                    <th className="px-6 py-4 text-right">Debit Balance (৳ BDT)</th>
                    <th className="px-6 py-4 text-right">Credit Balance (৳ BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {reports?.trialBalance?.map((acc: any) => (
                    <tr key={acc.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700">
                          {acc.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {acc.name}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {acc.total_debit > 0 ? `৳ ${(acc.total_debit / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                        {acc.total_credit > 0 ? `৳ ${(acc.total_credit / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                    </tr>
                  ))}
                  {/* Totals */}
                  <tr className="bg-slate-100/70 dark:bg-slate-800/70 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                    <td colSpan={2} className="px-6 py-4 text-right uppercase tracking-wider text-xs">
                      Grand Totals
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                      ৳ {(reports?.trialBalance?.reduce((sum: number, a: any) => sum + a.total_debit, 0) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm text-rose-600 dark:text-rose-400">
                      ৳ {(reports?.trialBalance?.reduce((sum: number, a: any) => sum + a.total_credit, 0) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : activeTab === 'profit_loss' ? (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden max-w-4xl mx-auto">
          <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 text-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Income Statement (Profit & Loss)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Operating revenues and expenses for the current financial cycle.
            </p>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* Revenue */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> Operating Revenue
                </h4>
              </div>
              <div className="space-y-1.5">
                {reports?.trialBalance?.filter((a: any) => a.type === 'REVENUE').map((acc: any) => (
                  <div key={acc.id} className="flex justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{acc.name}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      ৳ {(acc.balance / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold py-3 px-3 border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs">
                <span>Total Operating Revenue</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  ৳ {(reports?.profitAndLoss?.revenue / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Expenses */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 rotate-180" /> Operating Expenses
                </h4>
              </div>
              <div className="space-y-1.5">
                {reports?.trialBalance?.filter((a: any) => a.type === 'EXPENSE').map((acc: any) => (
                  <div key={acc.id} className="flex justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{acc.name}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      ৳ {(acc.balance / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold py-3 px-3 border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs">
                <span>Total Operating Expenses</span>
                <span className="font-mono text-rose-600 dark:text-rose-400">
                  ৳ {(reports?.profitAndLoss?.expenses / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Net Income */}
            <div className={cn(
              "flex justify-between items-center font-bold text-base py-4 px-5 rounded-2xl border",
              reports?.profitAndLoss?.netIncome >= 0
                ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30"
                : "text-rose-700 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30"
            )}>
              <span className="uppercase tracking-wider text-xs">Net Operating Income (EBITDA)</span>
              <span className="font-mono text-xl">
                ৳ {(reports?.profitAndLoss?.netIncome / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>
      ) : activeTab === 'balance_sheet' ? (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden max-w-5xl mx-auto">
          <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 text-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Statement of Financial Position (Balance Sheet)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Summary of assets, liabilities, and owners' equity balances.
            </p>
          </div>

          <CardContent className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Assets */}
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Assets
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {reports?.balanceSheet?.assets.map((acc: any) => (
                    <div key={acc.id} className="flex justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{acc.name}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ৳ {(acc.balance / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold py-3 px-3 border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs">
                  <span>Total Assets</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    ৳ {(reports?.balanceSheet?.totalAssets / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Liabilities & Equity */}
              <div className="space-y-6">
                {/* Liabilities */}
                <div className="space-y-3">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Liabilities
                    </h4>
                  </div>
                  <div className="space-y-1.5">
                    {reports?.balanceSheet?.liabilities.map((acc: any) => (
                      <div key={acc.id} className="flex justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{acc.name}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          ৳ {(acc.balance / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold py-3 px-3 border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs">
                    <span>Total Liabilities</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400">
                      ৳ {(reports?.balanceSheet?.totalLiabilities / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Equity */}
                <div className="space-y-3">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      Owners' Equity
                    </h4>
                  </div>
                  <div className="space-y-1.5">
                    {reports?.balanceSheet?.equity.map((acc: any) => (
                      <div key={acc.id} className="flex justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{acc.name}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          ৳ {(acc.balance / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs italic text-slate-500">
                      <span>Retained Earnings (Period Net Income)</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ৳ {(reports?.balanceSheet?.retainedEarnings / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between font-bold py-3 px-3 border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs">
                    <span>Total Equity</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400">
                      ৳ {((reports?.balanceSheet?.totalEquity + reports?.balanceSheet?.retainedEarnings) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Total Balance */}
                <div className="flex justify-between font-bold py-4 px-4 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm">
                  <span>Total Liabilities & Equity</span>
                  <span className="font-mono">
                    ৳ {((reports?.balanceSheet?.totalLiabilities + reports?.balanceSheet?.totalEquity + reports?.balanceSheet?.retainedEarnings) / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : activeTab === 'general_ledger' ? (
        <div className="space-y-6">
          <div className="px-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              General ledger accounts
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive chronological log of all debit and credit movements by account.
            </p>
          </div>

          <div className="space-y-5">
            {reports?.trialBalance?.map((acc: any) => {
              const accountLines = reports.generalLedger?.flatMap((j: any) => 
                j.lines.filter((l: any) => l.account_id === acc.id).map((l: any) => ({ 
                  ...l, 
                  date: j.date, 
                  description: j.description, 
                  reference_id: j.reference_id 
                }))
              ).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

              if (accountLines.length === 0) return null;

              let runningBalance = 0;

              return (
                <Card key={acc.id} className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700">
                        {acc.code}
                      </span>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{acc.name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">({acc.type})</span>
                    </div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Ending Balance: <span className="font-mono font-bold text-slate-900 dark:text-white">৳ {(acc.balance / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3">Ref</th>
                            <th className="px-6 py-3 text-right">Debit (৳)</th>
                            <th className="px-6 py-3 text-right">Credit (৳)</th>
                            <th className="px-6 py-3 text-right">Running Balance (৳)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                          {accountLines.map((line: any, idx: number) => {
                            if (['ASSET', 'EXPENSE'].includes(acc.type)) {
                              runningBalance += line.debit - line.credit;
                            } else {
                              runningBalance += line.credit - line.debit;
                            }
                            return (
                              <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                                <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                  {format(new Date(line.date), 'MMM dd, yyyy')}
                                </td>
                                <td className="px-6 py-3 text-xs font-medium text-slate-900 dark:text-white">
                                  {line.description}
                                </td>
                                <td className="px-6 py-3 text-xs font-mono text-slate-400 whitespace-nowrap">
                                  {line.reference_id ? `#${line.reference_id.slice(-6)}` : '-'}
                                </td>
                                <td className="px-6 py-3 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                  {line.debit > 0 ? (line.debit / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 }) : ''}
                                </td>
                                <td className="px-6 py-3 text-right font-mono text-xs text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                  {line.credit > 0 ? (line.credit / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 }) : ''}
                                </td>
                                <td className="px-6 py-3 text-right font-mono text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                  {(runningBalance / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Account Modal */}
      <Dialog open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen}>
        <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          <form onSubmit={handleCreateOrUpdateAccount}>
            {/* Header */}
            <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {editingAccountId ? t('accounting.account_modal_title_edit') : t('accounting.account_modal_title_new')}
                  </DialogTitle>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('accounting.account_modal_subtitle')}
                </p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('accounting.field_code')} <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="code" 
                    placeholder={t('accounting.field_code_placeholder')} 
                    value={accountForm.code}
                    onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })}
                    className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('accounting.field_name')} <span className="text-rose-500">*</span>
                </Label>
                <Input 
                  id="name" 
                  placeholder={t('accounting.field_name_placeholder')} 
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t('accounting.field_type')} <span className="text-rose-500">*</span>
                </Label>
                <select 
                  id="type"
                  className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                  value={accountForm.type}
                  onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                  required
                >
                  <option value="ASSET">{t('accounting.type_asset')}</option>
                  <option value="LIABILITY">{t('accounting.type_liability')}</option>
                  <option value="EQUITY">{t('accounting.type_equity')}</option>
                  <option value="REVENUE">{t('accounting.type_revenue')}</option>
                  <option value="EXPENSE">{t('accounting.type_expense')}</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-2.5">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAccountModalOpen(false)}
                className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
              >
                {t('common.cancel')}
              </Button>
              <PermissionGuard permission="accounting:create">
                <Button 
                  type="submit" 
                  disabled={submittingAccount}
                  className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {submittingAccount ? t('accounting.btn_saving') : editingAccountId ? t('common.save') : t('accounting.btn_save_account')}
                </Button>
              </PermissionGuard>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Journal Modal */}
      <Dialog open={isJournalModalOpen} onOpenChange={setIsJournalModalOpen}>
        <DialogContent className="sm:max-w-2xl p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 max-h-[90vh] flex flex-col">
          <form onSubmit={handleCreateJournal} className="flex flex-col flex-1 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 pr-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {t('accounting.journal_modal_title')}
                  </DialogTitle>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('accounting.journal_modal_subtitle')}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('accounting.field_entry_date')} <span className="text-rose-500">*</span>
                  </Label>
                  <Input 
                    id="date" 
                    type="date"
                    value={journalForm.date}
                    onChange={(e) => setJournalForm({ ...journalForm, date: e.target.value })}
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {t('accounting.field_entry_desc')} <span className="text-rose-500">*</span>
                  </Label>
                  <Input 
                    id="description" 
                    placeholder={t('accounting.field_entry_desc_placeholder')} 
                    value={journalForm.description}
                    onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })}
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                    required
                  />
                </div>
              </div>
              
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-3.5 py-2.5 text-left">{t('accounting.col_journal_account')}</th>
                      <th className="px-3.5 py-2.5 text-right w-32">{t('accounting.col_debit')}</th>
                      <th className="px-3.5 py-2.5 text-right w-32">{t('accounting.col_credit')}</th>
                      <th className="px-2 py-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                    {journalForm.lines.map((line, index) => (
                      <tr key={index}>
                        <td className="p-2">
                          <select
                            className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs px-2 font-medium"
                            value={line.account_id}
                            onChange={(e) => updateJournalLine(index, 'account_id', e.target.value)}
                            required
                          >
                            <option value="">{t('accounting.col_journal_account')}...</option>
                            {accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            className="h-8 text-right font-mono text-xs rounded-lg" 
                            value={line.debit || ''} 
                            placeholder="0.00"
                            onChange={(e) => updateJournalLine(index, 'debit', e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            className="h-8 text-right font-mono text-xs rounded-lg" 
                            value={line.credit || ''} 
                            placeholder="0.00"
                            onChange={(e) => updateJournalLine(index, 'credit', e.target.value)}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <PermissionGuard permission="accounting:delete">
                            <button 
                              type="button" 
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                              onClick={() => removeJournalLine(index)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </PermissionGuard>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="p-3 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <PermissionGuard permission="accounting:create">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addJournalLine}
                      className="rounded-lg h-7 text-xs font-semibold border-slate-200 dark:border-slate-700"
                    >
                      <Plus className="h-3 w-3 mr-1" /> {t('accounting.btn_add_line')}
                    </Button>
                  </PermissionGuard>

                  <div className="flex items-center gap-4 text-xs font-mono font-bold">
                    <span className={isJournalBalanced ? 'text-emerald-600' : 'text-rose-500'}>
                      {t('accounting.total_debit')}: ৳ {totalDebitSum.toFixed(2)}
                    </span>
                    <span className={isJournalBalanced ? 'text-emerald-600' : 'text-rose-500'}>
                      {t('accounting.total_credit')}: ৳ {totalCreditSum.toFixed(2)}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-sans font-bold",
                      isJournalBalanced 
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50" 
                        : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/50"
                    )}>
                      {isJournalBalanced ? 'Balanced' : `Diff: ৳ ${Math.abs(totalDebitSum - totalCreditSum).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end gap-2.5">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsJournalModalOpen(false)}
                className="rounded-xl text-xs font-semibold px-4 border-slate-200 dark:border-slate-700"
              >
                {t('common.cancel')}
              </Button>
              <PermissionGuard permission="accounting:update">
                <Button 
                  type="submit" 
                  disabled={submittingJournal || !isJournalBalanced}
                  className="rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  {submittingJournal ? t('accounting.btn_posting') : t('accounting.btn_post_journal')}
                </Button>
              </PermissionGuard>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={executeDeleteAccount}
        title={t('accounting.delete_account_title')}
        description={t('accounting.delete_account_desc')}
        confirmText={t('accounting.delete_account_title')}
        variant="destructive"
      />
    </div>
  );
}
