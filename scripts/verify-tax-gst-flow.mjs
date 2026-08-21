import assert from 'node:assert/strict';
import { AccountingService } from '../lib/services/AccountingService.js';
import { PakistaniTaxService } from '../lib/services/PakistaniTaxService.js';

console.log('--- Verifying Tax & GST Flow & Architecture ---');

// Mock TX client for isolated unit testing
let createdEntries = [];
let mockJournalId = 'j-test-123';
const mockTxClient = {
    query: async (sql, params) => {
        if (sql.includes('tax_configurations')) {
            return { rows: [] };
        }
        if (sql.includes('fiscal_periods')) {
            return { rows: [] }; // Empty rows means no closed/locked period -> check passes
        }
        if (sql.includes('SELECT id, code, name, type FROM gl_accounts')) {
            return {
                rows: [
                    { id: 'acc-inventory', code: '1200', name: 'Inventory', type: 'asset' },
                    { id: 'acc-ap', code: '2001', name: 'Accounts Payable', type: 'liability' },
                    { id: 'acc-input-tax', code: '2103', name: 'Input Tax Credit', type: 'asset' },
                    { id: 'acc-ar', code: '1100', name: 'Accounts Receivable', type: 'asset' },
                    { id: 'acc-revenue', code: '4000', name: 'Sales Revenue', type: 'income' },
                    { id: 'acc-tax-payable', code: '2100', name: 'Sales Tax Payable', type: 'liability' },
                    { id: 'acc-cash', code: '1001', name: 'Cash on Hand', type: 'asset' },
                    { id: 'acc-bank', code: '1010', name: 'Bank Accounts', type: 'asset' },
                    { id: 'acc-expense', code: '5100', name: 'Office Expense', type: 'expense' },
                ]
            };
        }
        if (sql.includes('INSERT INTO journal_entries')) {
            return { rows: [{ id: mockJournalId, journal_number: 'JE-000001' }] };
        }
        if (sql.includes('INSERT INTO gl_entries')) {
            createdEntries.push(params);
            return { rows: [] };
        }
        if (sql.includes('SELECT nextval') || sql.includes('document_sequences')) {
            return { rows: [{ last_value: 1 }] };
        }
        return { rows: [] };
    }
};

// Test 1: PakistaniTaxService fallback default rate
const fallbackCfg = await PakistaniTaxService.getTaxConfig('00000000-0000-0000-0000-000000000000', mockTxClient);
assert.equal(fallbackCfg.sales_tax_rate, 18.00, 'PakistaniTaxService fallback rate should be 18% GST');
console.log('✓ PakistaniTaxService fallback GST rate is 18.00%');

// Test 2: AccountingService purchase GL posting with input tax
createdEntries = [];
await AccountingService.recordBusinessTransaction('purchase', {
    businessId: '00000000-0000-0000-0000-000000000001',
    referenceId: 'pur-101',
    amount: 118, // Total gross
    taxAmount: 18, // Input tax
    description: 'Test Purchase with 18% Input GST',
    userId: 'user-1'
}, mockTxClient);

assert.equal(createdEntries.length, 3, 'Purchase transaction should create 3 GL lines (Inventory, Input Tax, AP)');

const invLine = createdEntries.find(e => e[4] === 'acc-inventory');
const taxLine = createdEntries.find(e => e[4] === 'acc-input-tax');
const apLine  = createdEntries.find(e => e[4] === 'acc-ap');

assert.ok(invLine, 'Inventory line must exist');
assert.ok(taxLine, 'Input Tax Credit line must exist');
assert.ok(apLine,  'AP line must exist');

assert.equal(invLine[5], 100, 'Inventory debit should be net amount (100)');
assert.equal(taxLine[5], 18,  'Input Tax Credit debit should be tax amount (18)');
assert.equal(apLine[6],  118, 'AP credit should be gross total (118)');
console.log('✓ Purchase GL transaction correctly splits Net Inventory (DR 100), Input Tax Credit (DR 18), AP (CR 118)');

// Test 3: Expense GL recording with Input Tax
createdEntries = [];
await AccountingService.recordBusinessTransaction('expense', {
    businessId: '00000000-0000-0000-0000-000000000001',
    referenceId: 'exp-101',
    amount: 118,
    taxAmount: 18,
    expenseAccountId: 'acc-expense',
    paymentMethod: 'cash',
    description: 'Utility Bill with GST',
    userId: 'user-1'
}, mockTxClient);

assert.equal(createdEntries.length, 3, 'Expense transaction with tax should create 3 GL lines (Expense, Input Tax, Cash)');

const expLine = createdEntries.find(e => e[4] === 'acc-expense');
const expTaxLine = createdEntries.find(e => e[4] === 'acc-input-tax');
const cashLine = createdEntries.find(e => e[4] === 'acc-cash');

assert.ok(expLine, 'Expense line must exist');
assert.ok(expTaxLine, 'Input Tax Credit line must exist');
assert.ok(cashLine, 'Cash line must exist');

assert.equal(expLine[5], 100, 'Expense debit should be net amount (100)');
assert.equal(expTaxLine[5], 18, 'Input Tax Credit debit should be tax amount (18)');
assert.equal(cashLine[6], 118, 'Cash credit should be gross total (118)');
console.log('✓ Expense GL transaction correctly splits Net Expense (DR 100), Input Tax Credit (DR 18), Cash (CR 118)');

console.log('ALL TAX & GST ARCHITECTURE VERIFICATIONS PASSED SUCCESSFULLY!');
