'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet, Landmark, ArrowUpRight, ArrowDownLeft, ArrowLeftRight,
  Plus, Trash2, Edit3, Loader2, DollarSign, TrendingUp, TrendingDown,
  Building2, CreditCard, ShieldCheck, PiggyBank, Search, Filter, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import {
  getPersonalFinanceDataAction,
  savePersonalAccountAction,
  deletePersonalAccountAction,
  recordPersonalTransactionAction,
  deletePersonalTransactionAction
} from '@/lib/actions/basic/personalFinance';

const ACCOUNT_TYPES = [
  { key: 'bank', label: 'Bank Account', icon: Landmark, color: 'text-brand-primary bg-brand-50' },
  { key: 'cash', label: 'Cash Wallet', icon: Wallet, color: 'text-emerald-600 bg-emerald-50' },
  { key: 'savings', label: 'Savings Account', icon: PiggyBank, color: 'text-brand-primary bg-brand-50' },
  { key: 'credit', label: 'Credit Card', icon: CreditCard, color: 'text-purple-600 bg-purple-50' },
  { key: 'investment', label: 'Investment Portfolio', icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
];

const EXPENSE_CATEGORIES = [
  'Housing & Utilities',
  'Family & Household',
  'Transport & Fuel',
  'Healthcare & Medical',
  'Education & Training',
  'Food & Dining',
  'Shopping & Lifestyle',
  'Investments & Savings',
  'Owner Drawing',
  'Taxes & Insurance',
  'General Personal',
];

const INCOME_CATEGORIES = [
  'Owner Profit Draw',
  'Salary / Monthly Allowance',
  'Investment Dividend',
  'Rental Income',
  'Owner Capital Injection',
  'Side Business Income',
  'Other Personal Income',
];

export function PersonalFinanceManager({ businessId, currency = 'PKR' }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ accounts: [], transactions: [], summary: {} });

  // Modals state
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountForm, setAccountForm] = useState({
    name: '',
    bankName: '',
    accountNumber: '',
    type: 'bank',
    currency,
    balance: '',
    notes: '',
  });

  const [showTxModal, setShowTxModal] = useState(false);
  const [txForm, setTxForm] = useState({
    type: 'withdrawal', // deposit | withdrawal | transfer | owner_drawing | capital_injection
    accountId: '',
    targetAccountId: '',
    amount: '',
    category: 'Housing & Utilities',
    date: new Date().toISOString().slice(0, 10),
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');

  const loadData = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const res = await getPersonalFinanceDataAction(businessId);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        toast.error(res.error || 'Failed to load personal finance data');
      }
    } catch {
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAccountModal = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setAccountForm({
        name: account.name || '',
        bankName: account.bankName || '',
        accountNumber: account.accountNumber || '',
        type: account.type || 'bank',
        currency: account.currency || currency,
        balance: account.balance ?? '',
        notes: account.notes || '',
      });
    } else {
      setEditingAccount(null);
      setAccountForm({
        name: '',
        bankName: '',
        accountNumber: '',
        type: 'bank',
        currency,
        balance: '',
        notes: '',
      });
    }
    setShowAccountModal(true);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!accountForm.name.trim()) {
      toast.error('Please enter account name');
      return;
    }
    setSubmitting(true);
    try {
      const res = await savePersonalAccountAction({
        businessId,
        account: {
          id: editingAccount?.id,
          ...accountForm,
        },
      });
      if (res.success) {
        toast.success(editingAccount ? 'Account updated' : 'Account created');
        setShowAccountModal(false);
        loadData();
      } else {
        toast.error(res.error || 'Failed to save account');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return;
    try {
      const res = await deletePersonalAccountAction({ businessId, accountId });
      if (res.success) {
        toast.success('Account deleted');
        loadData();
      } else {
        toast.error(res.error || 'Failed to delete account');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  const handleOpenTxModal = (type = 'withdrawal', defaultAccountId = '') => {
    const accId = defaultAccountId || data.accounts[0]?.id || '';
    setTxForm({
      type,
      accountId: accId,
      targetAccountId: '',
      amount: '',
      category: type === 'deposit' || type === 'owner_drawing' ? 'Owner Profit Draw' : 'Housing & Utilities',
      date: new Date().toISOString().slice(0, 10),
      description: '',
    });
    setShowTxModal(true);
  };

  const handleSaveTx = async (e) => {
    e.preventDefault();
    if (!txForm.amount || Number(txForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!txForm.accountId) {
      toast.error('Please select an account');
      return;
    }
    if (txForm.type === 'transfer' && (!txForm.targetAccountId || txForm.targetAccountId === txForm.accountId)) {
      toast.error('Please select a valid destination account for transfer');
      return;
    }

    setSubmitting(true);
    try {
      const res = await recordPersonalTransactionAction({
        businessId,
        transaction: txForm,
      });
      if (res.success) {
        toast.success('Transaction recorded successfully');
        setShowTxModal(false);
        loadData();
      } else {
        toast.error(res.error || 'Failed to record transaction');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTx = async (txId) => {
    if (!confirm('Are you sure you want to delete this transaction record?')) return;
    try {
      const res = await deletePersonalTransactionAction({ businessId, transactionId: txId });
      if (res.success) {
        toast.success('Transaction removed');
        loadData();
      } else {
        toast.error(res.error || 'Failed to delete transaction');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return (data.transactions || []).filter(tx => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (accountFilter !== 'all' && tx.accountId !== accountFilter && tx.targetAccountId !== accountFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const descMatch = (tx.description || '').toLowerCase().includes(q);
        const catMatch = (tx.category || '').toLowerCase().includes(q);
        const amountMatch = String(tx.amount || '').includes(q);
        if (!descMatch && !catMatch && !amountMatch) return false;
      }
      return true;
    });
  }, [data.transactions, typeFilter, accountFilter, searchTerm]);

  // Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const map = {};
    (data.transactions || []).forEach(tx => {
      if (tx.type === 'withdrawal' || tx.type === 'expense' || tx.type === 'capital_injection') {
        const cat = tx.category || 'Other';
        map[cat] = (map[cat] || 0) + (Number(tx.amount) || 0);
      }
    });
    const totalExp = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(map)
      .map(([cat, amt]) => ({ category: cat, amount: amt, percent: Math.round((amt / totalExp) * 100) }))
      .sort((a, b) => b.amount - a.amount);
  }, [data.transactions]);

  const formatCurrency = (val) => {
    return `${currency} ${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
        <p className="text-sm font-semibold text-gray-500">Loading Personal Finance Hub...</p>
      </div>
    );
  }

  const { summary } = data;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-primary" />
            <h2 className="text-xl font-bold tracking-tight text-gray-900">Personal Finance & Owner Vault</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Private owner financial management — track personal bank accounts, balances, personal expenses, drawings & deposits.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={loadData} className="h-9 text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleOpenAccountModal()} className="h-9 text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Account
          </Button>
          <Button size="sm" onClick={() => handleOpenTxModal('owner_drawing')} className="h-9 text-xs bg-brand-primary hover:bg-brand-secondary text-white">
            <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
            Record Transaction
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Net Cash & Bank</span>
            <div className="p-2 bg-brand-50 rounded-lg text-brand-primary">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{formatCurrency(summary?.totalBalance)}</p>
          <p className="text-[11px] text-gray-500 mt-1">{summary?.accountCount || 0} personal accounts linked</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Monthly Income / Draws</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(summary?.monthlyIncome)}</p>
          <p className="text-[11px] text-gray-500 mt-1">This month deposits & draws</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Monthly Expenses</span>
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600 tabular-nums">{formatCurrency(summary?.monthlyExpense)}</p>
          <p className="text-[11px] text-gray-500 mt-1">This month personal spending</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Monthly Savings</span>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className={cn("text-2xl font-bold tabular-nums", (summary?.netSavings || 0) >= 0 ? "text-emerald-600" : "text-red-600")}>
            {formatCurrency(summary?.netSavings)}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">Net cash retained this month</p>
        </div>
      </div>

      {/* Bank Accounts Grid & Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-primary" />
            Personal Bank Accounts & Cash Wallets
          </h3>
          <Button variant="ghost" size="sm" onClick={() => handleOpenAccountModal()} className="text-xs text-brand-primary hover:text-brand-secondary">
            + New Account
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data.accounts || []).map((acc) => {
            const typeObj = ACCOUNT_TYPES.find(t => t.key === acc.type) || ACCOUNT_TYPES[0];
            const IconComponent = typeObj.icon;
            return (
              <div key={acc.id} className="border border-gray-200 rounded-xl p-4 hover:border-brand-primary/50 transition-colors bg-gray-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("p-2 rounded-lg", typeObj.color)}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{acc.name}</h4>
                        <p className="text-xs text-gray-500">{acc.bankName} • {acc.accountNumber || 'Primary'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button onClick={() => handleOpenAccountModal(acc)} className="p-1 text-gray-400 hover:text-brand-primary rounded">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteAccount(acc.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Current Balance</p>
                    <p className="text-xl font-bold text-gray-900 tabular-nums mt-0.5">{formatCurrency(acc.balance)}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 flex items-center gap-2 text-xs border-t border-gray-200">
                  <Button variant="outline" size="sm" onClick={() => handleOpenTxModal('deposit', acc.id)} className="h-7 text-[11px] px-2 flex-1">
                    <ArrowDownLeft className="w-3 h-3 text-emerald-600 mr-1" />
                    Deposit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleOpenTxModal('withdrawal', acc.id)} className="h-7 text-[11px] px-2 flex-1">
                    <ArrowUpRight className="w-3 h-3 text-red-600 mr-1" />
                    Withdraw
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleOpenTxModal('transfer', acc.id)} className="h-7 text-[11px] px-2 flex-1">
                    <ArrowLeftRight className="w-3 h-3 text-indigo-600 mr-1" />
                    Transfer
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Layout: Transactions Ledger + Category Expense Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-gray-900">Personal Financial Ledger</h3>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="owner_drawing">Owner Drawings</option>
                <option value="capital_injection">Capital Injections</option>
                <option value="transfer">Transfers</option>
              </select>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-gray-200 rounded-xl">
              <p className="text-xs text-gray-500 font-medium">No personal financial records match filter criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 font-semibold uppercase">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type & Account</th>
                    <th className="py-2.5 px-3">Category / Description</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.map((tx) => {
                    const isCredit = tx.type === 'deposit' || tx.type === 'owner_drawing';
                    const accName = data.accounts.find(a => a.id === tx.accountId)?.name || 'Personal Acc';
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/80">
                        <td className="py-2.5 px-3 whitespace-nowrap text-gray-600 font-medium">{tx.date}</td>
                        <td className="py-2.5 px-3">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold mb-0.5",
                            isCredit ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          )}>
                            {tx.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <p className="text-gray-900 font-medium">{accName}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-gray-900">{tx.category}</p>
                          <p className="text-[11px] text-gray-500 truncate max-w-[200px]">{tx.description || 'No notes'}</p>
                        </td>
                        <td className={cn("py-2.5 px-3 text-right font-bold tabular-nums", isCredit ? "text-emerald-600" : "text-gray-900")}>
                          {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button onClick={() => handleDeleteTx(tx.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Category Expense Breakdown (1 Col) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Personal Spending Analytics</h3>
          <p className="text-xs text-gray-500">Distribution of recorded personal expenses by category.</p>

          {categoryBreakdown.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500 border border-dashed border-gray-200 rounded-lg">
              No spending data available.
            </div>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-700">{item.category}</span>
                    <span className="text-gray-900 tabular-nums">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-brand-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, item.percent)}%` }}
                    />
                  </div>
                  <div className="flex justify-end text-[10px] text-gray-400 font-medium">{item.percent}% of personal expenditure</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">{editingAccount ? 'Edit Personal Account' : 'Add Personal Account'}</h3>

            <form onSubmit={handleSaveAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Account Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meezan Main Savings"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. HBL / Meezan / Cash"
                    value={accountForm.bankName}
                    onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Account Number / Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. **** 4892"
                    value={accountForm.accountNumber}
                    onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Account Type</label>
                  <select
                    value={accountForm.type}
                    onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none"
                  >
                    {ACCOUNT_TYPES.map(t => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Current Balance ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={accountForm.balance}
                    onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes..."
                  value={accountForm.notes}
                  onChange={(e) => setAccountForm({ ...accountForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAccountModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} size="sm" className="text-xs bg-brand-primary hover:bg-brand-secondary text-white">
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Record Personal Transaction</h3>

            <form onSubmit={handleSaveTx} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Transaction Type</label>
                <select
                  value={txForm.type}
                  onChange={(e) => setTxForm({
                    ...txForm,
                    type: e.target.value,
                    category: e.target.value === 'owner_drawing' ? 'Owner Profit Draw' : (e.target.value === 'deposit' ? 'Investment Dividend' : 'Housing & Utilities')
                  })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none font-semibold text-gray-900"
                >
                  <option value="withdrawal">Personal Expense / Withdrawal (-)</option>
                  <option value="owner_drawing">Owner Drawing (Profit Draw from Business) (+)</option>
                  <option value="deposit">Personal Income / Deposit (+)</option>
                  <option value="capital_injection">Owner Capital Injection into Business (-)</option>
                  <option value="transfer">Inter-Account Transfer</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Source Account *</label>
                  <select
                    value={txForm.accountId}
                    onChange={(e) => setTxForm({ ...txForm, accountId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none"
                  >
                    {data.accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
                    ))}
                  </select>
                </div>

                {txForm.type === 'transfer' ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Destination Account *</label>
                    <select
                      value={txForm.targetAccountId}
                      onChange={(e) => setTxForm({ ...txForm, targetAccountId: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none"
                    >
                      <option value="">Select Destination</option>
                      {data.accounts.filter(a => a.id !== txForm.accountId).map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                    <select
                      value={txForm.category}
                      onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none"
                    >
                      {(txForm.type === 'deposit' || txForm.type === 'owner_drawing' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Amount ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={txForm.amount}
                    onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none font-bold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={txForm.date}
                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Memo</label>
                <input
                  type="text"
                  placeholder="e.g. House rent payment / Owner profit draw"
                  value={txForm.description}
                  onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowTxModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} size="sm" className="text-xs bg-brand-primary hover:bg-brand-secondary text-white">
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Record Entry'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
