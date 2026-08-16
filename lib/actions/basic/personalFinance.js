'use server';

import prisma from '@/lib/prisma';

const DEFAULT_PERSONAL_ACCOUNTS = [
  {
    id: 'acc-default-1',
    name: 'Main Personal Savings',
    accountNumber: '**** 4892',
    type: 'bank',
    currency: 'PKR',
    balance: 450000,
    bankName: 'Meezan Bank',
    notes: 'Primary personal savings account',
  },
  {
    id: 'acc-default-2',
    name: 'Personal Cash Wallet',
    accountNumber: 'Cash',
    type: 'cash',
    currency: 'PKR',
    balance: 45000,
    bankName: 'Cash on Hand',
    notes: 'Emergency & daily cash',
  },
];

const DEFAULT_PERSONAL_TRANSACTIONS = [
  {
    id: 'tx-default-1',
    date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
    type: 'owner_drawing',
    accountId: 'acc-default-1',
    amount: 100000,
    category: 'Owner Drawing',
    description: 'Monthly owner profit draw from business',
    source: 'business_draw',
  },
  {
    id: 'tx-default-2',
    date: new Date(Date.now() - 86400000 * 5).toISOString().slice(0, 10),
    type: 'withdrawal',
    accountId: 'acc-default-1',
    amount: 35000,
    category: 'Housing & Utilities',
    description: 'Utility bills & home expenses',
    source: 'personal',
  },
  {
    id: 'tx-default-3',
    date: new Date(Date.now() - 86400000 * 8).toISOString().slice(0, 10),
    type: 'deposit',
    accountId: 'acc-default-1',
    amount: 50000,
    category: 'Investments',
    description: 'Personal investment dividend payout',
    source: 'personal',
  },
];

/**
 * Fetch personal finance data (accounts, transactions, categories, metrics) for a business.
 */
export async function getPersonalFinanceDataAction(businessId) {
  if (!businessId) return { success: false, error: 'Business ID is required' };

  try {
    const bs = await prisma.business_settings.findFirst({
      where: { business_id: businessId },
      select: { settings: true },
    });

    const settingsObj = (bs?.settings && typeof bs.settings === 'object') ? bs.settings : {};
    let personalData = settingsObj.personalFinance;

    if (!personalData || !Array.isArray(personalData.accounts)) {
      personalData = {
        accounts: DEFAULT_PERSONAL_ACCOUNTS,
        transactions: DEFAULT_PERSONAL_TRANSACTIONS,
        updatedAt: new Date().toISOString(),
      };
    }

    const accounts = personalData.accounts || [];
    const transactions = personalData.transactions || [];

    // Calculate metrics
    const totalBalance = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
    
    // Monthly income & expense calculation (current calendar month)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTx = transactions.filter(t => t.date && t.date.slice(0, 7) === currentMonth);
    
    const monthlyIncome = monthTx
      .filter(t => t.type === 'deposit' || t.type === 'owner_drawing' || t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const monthlyExpense = monthTx
      .filter(t => t.type === 'withdrawal' || t.type === 'capital_injection' || t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const netSavings = monthlyIncome - monthlyExpense;

    return {
      success: true,
      data: {
        accounts,
        transactions,
        summary: {
          totalBalance,
          monthlyIncome,
          monthlyExpense,
          netSavings,
          accountCount: accounts.length,
        },
      },
    };
  } catch (err) {
    console.error('getPersonalFinanceDataAction error:', err);
    return { success: false, error: err.message || 'Failed to fetch personal finance data' };
  }
}

/**
 * Save (create or update) a personal bank account.
 */
export async function savePersonalAccountAction({ businessId, account }) {
  if (!businessId) return { success: false, error: 'Business ID is required' };
  if (!account || !account.name) return { success: false, error: 'Account name is required' };

  try {
    const bs = await prisma.business_settings.findFirst({
      where: { business_id: businessId },
      select: { settings: true },
    });

    const currentSettings = (bs?.settings && typeof bs.settings === 'object') ? bs.settings : {};
    const existingPersonal = currentSettings.personalFinance || { accounts: [], transactions: [] };
    const accounts = Array.isArray(existingPersonal.accounts) ? [...existingPersonal.accounts] : [...DEFAULT_PERSONAL_ACCOUNTS];

    const accountId = account.id || `acc-${Date.now()}`;
    const targetIdx = accounts.findIndex(a => a.id === accountId);

    const normalizedAccount = {
      id: accountId,
      name: account.name.trim(),
      bankName: account.bankName ? account.bankName.trim() : 'Bank',
      accountNumber: account.accountNumber ? account.accountNumber.trim() : '',
      type: account.type || 'bank', // bank | cash | savings | credit | investment
      currency: account.currency || 'PKR',
      balance: Number(account.balance) || 0,
      notes: account.notes ? account.notes.trim() : '',
      updatedAt: new Date().toISOString(),
    };

    if (targetIdx >= 0) {
      accounts[targetIdx] = { ...accounts[targetIdx], ...normalizedAccount };
    } else {
      accounts.push(normalizedAccount);
    }

    const updatedPersonal = {
      ...existingPersonal,
      accounts,
      updatedAt: new Date().toISOString(),
    };

    const newSettings = {
      ...currentSettings,
      personalFinance: updatedPersonal,
    };

    await prisma.business_settings.upsert({
      where: { business_id: businessId },
      create: {
        business_id: businessId,
        settings: newSettings,
      },
      update: {
        settings: newSettings,
        updated_at: new Date(),
      },
    });

    return { success: true, account: normalizedAccount };
  } catch (err) {
    console.error('savePersonalAccountAction error:', err);
    return { success: false, error: err.message || 'Failed to save account' };
  }
}

/**
 * Delete a personal bank account.
 */
export async function deletePersonalAccountAction({ businessId, accountId }) {
  if (!businessId || !accountId) return { success: false, error: 'Business ID and Account ID are required' };

  try {
    const bs = await prisma.business_settings.findFirst({
      where: { business_id: businessId },
      select: { settings: true },
    });

    const currentSettings = (bs?.settings && typeof bs.settings === 'object') ? bs.settings : {};
    const existingPersonal = currentSettings.personalFinance || { accounts: [], transactions: [] };
    const accounts = (existingPersonal.accounts || []).filter(a => a.id !== accountId);

    const updatedPersonal = {
      ...existingPersonal,
      accounts,
      updatedAt: new Date().toISOString(),
    };

    const newSettings = {
      ...currentSettings,
      personalFinance: updatedPersonal,
    };

    await prisma.business_settings.update({
      where: { business_id: businessId },
      data: {
        settings: newSettings,
        updated_at: new Date(),
      },
    });

    return { success: true };
  } catch (err) {
    console.error('deletePersonalAccountAction error:', err);
    return { success: false, error: err.message || 'Failed to delete account' };
  }
}

/**
 * Record a personal financial transaction (deposit, withdrawal, transfer, owner drawing, capital injection).
 */
export async function recordPersonalTransactionAction({ businessId, transaction }) {
  if (!businessId) return { success: false, error: 'Business ID is required' };
  if (!transaction || !transaction.amount || !transaction.type) {
    return { success: false, error: 'Valid transaction type and amount are required' };
  }

  try {
    const bs = await prisma.business_settings.findFirst({
      where: { business_id: businessId },
      select: { settings: true },
    });

    const currentSettings = (bs?.settings && typeof bs.settings === 'object') ? bs.settings : {};
    const existingPersonal = currentSettings.personalFinance || { accounts: [], transactions: [] };
    const accounts = Array.isArray(existingPersonal.accounts) ? [...existingPersonal.accounts] : [...DEFAULT_PERSONAL_ACCOUNTS];
    const transactions = Array.isArray(existingPersonal.transactions) ? [...existingPersonal.transactions] : [...DEFAULT_PERSONAL_TRANSACTIONS];

    const amount = Math.abs(Number(transaction.amount) || 0);
    const txId = transaction.id || `tx-${Date.now()}`;

    const newTx = {
      id: txId,
      date: transaction.date || new Date().toISOString().slice(0, 10),
      type: transaction.type, // 'deposit' | 'withdrawal' | 'transfer' | 'owner_drawing' | 'capital_injection'
      accountId: transaction.accountId || (accounts[0]?.id ?? 'acc-default-1'),
      targetAccountId: transaction.targetAccountId || null,
      amount,
      category: transaction.category || 'General',
      description: transaction.description ? transaction.description.trim() : '',
      source: transaction.source || 'personal',
      createdAt: new Date().toISOString(),
    };

    // Update account balances based on transaction type
    const sourceAccIdx = accounts.findIndex(a => a.id === newTx.accountId);
    if (sourceAccIdx >= 0) {
      if (newTx.type === 'deposit' || newTx.type === 'owner_drawing') {
        accounts[sourceAccIdx].balance = (Number(accounts[sourceAccIdx].balance) || 0) + amount;
      } else if (newTx.type === 'withdrawal' || newTx.type === 'capital_injection') {
        accounts[sourceAccIdx].balance = (Number(accounts[sourceAccIdx].balance) || 0) - amount;
      } else if (newTx.type === 'transfer' && newTx.targetAccountId) {
        accounts[sourceAccIdx].balance = (Number(accounts[sourceAccIdx].balance) || 0) - amount;
        const targetAccIdx = accounts.findIndex(a => a.id === newTx.targetAccountId);
        if (targetAccIdx >= 0) {
          accounts[targetAccIdx].balance = (Number(accounts[targetAccIdx].balance) || 0) + amount;
        }
      }
    }

    transactions.unshift(newTx);

    const updatedPersonal = {
      ...existingPersonal,
      accounts,
      transactions,
      updatedAt: new Date().toISOString(),
    };

    const newSettings = {
      ...currentSettings,
      personalFinance: updatedPersonal,
    };

    await prisma.business_settings.upsert({
      where: { business_id: businessId },
      create: {
        business_id: businessId,
        settings: newSettings,
      },
      update: {
        settings: newSettings,
        updated_at: new Date(),
      },
    });

    return { success: true, transaction: newTx };
  } catch (err) {
    console.error('recordPersonalTransactionAction error:', err);
    return { success: false, error: err.message || 'Failed to record transaction' };
  }
}

/**
 * Delete a personal transaction and adjust affected account balance.
 */
export async function deletePersonalTransactionAction({ businessId, transactionId }) {
  if (!businessId || !transactionId) return { success: false, error: 'Business ID and Transaction ID are required' };

  try {
    const bs = await prisma.business_settings.findFirst({
      where: { business_id: businessId },
      select: { settings: true },
    });

    const currentSettings = (bs?.settings && typeof bs.settings === 'object') ? bs.settings : {};
    const existingPersonal = currentSettings.personalFinance || { accounts: [], transactions: [] };
    const accounts = Array.isArray(existingPersonal.accounts) ? [...existingPersonal.accounts] : [];
    const transactions = Array.isArray(existingPersonal.transactions) ? [...existingPersonal.transactions] : [];

    const targetTx = transactions.find(t => t.id === transactionId);
    if (!targetTx) return { success: false, error: 'Transaction not found' };

    const amount = Number(targetTx.amount) || 0;
    const sourceAccIdx = accounts.findIndex(a => a.id === targetTx.accountId);

    if (sourceAccIdx >= 0) {
      if (targetTx.type === 'deposit' || targetTx.type === 'owner_drawing') {
        accounts[sourceAccIdx].balance = (Number(accounts[sourceAccIdx].balance) || 0) - amount;
      } else if (targetTx.type === 'withdrawal' || targetTx.type === 'capital_injection') {
        accounts[sourceAccIdx].balance = (Number(accounts[sourceAccIdx].balance) || 0) + amount;
      } else if (targetTx.type === 'transfer' && targetTx.targetAccountId) {
        accounts[sourceAccIdx].balance = (Number(accounts[sourceAccIdx].balance) || 0) + amount;
        const targetAccIdx = accounts.findIndex(a => a.id === targetTx.targetAccountId);
        if (targetAccIdx >= 0) {
          accounts[targetAccIdx].balance = (Number(accounts[targetAccIdx].balance) || 0) - amount;
        }
      }
    }

    const updatedTransactions = transactions.filter(t => t.id !== transactionId);

    const updatedPersonal = {
      ...existingPersonal,
      accounts,
      transactions: updatedTransactions,
      updatedAt: new Date().toISOString(),
    };

    const newSettings = {
      ...currentSettings,
      personalFinance: updatedPersonal,
    };

    await prisma.business_settings.update({
      where: { business_id: businessId },
      data: {
        settings: newSettings,
        updated_at: new Date(),
      },
    });

    return { success: true };
  } catch (err) {
    console.error('deletePersonalTransactionAction error:', err);
    return { success: false, error: err.message || 'Failed to delete transaction' };
  }
}
