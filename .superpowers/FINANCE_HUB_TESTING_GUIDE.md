# Finance Hub - Testing Guide

Quick guide to test all Finance Hub features after the fixes.

---

## Prerequisites

1. **Database Setup**
   ```bash
   npm run db:migrate
   ```

2. **Verify Installation**
   ```bash
   npm run verify:finance-hub
   ```

3. **Access Finance Hub**
   - Navigate to: `/business/{your-category}?tab=finance`
   - Or click "Finance" in the hub navigation

---

## Test Scenarios

### 1. Journal Entry Form ✅

**Test the Fixed Validation**

1. Navigate to Finance → Journal Entries
2. Click "New Entry"

**Test Case A: Empty Entry Validation**
- Leave accounts empty, try to submit
- ✅ Should show: "At least 2 complete entries required"
- ✅ Empty rows should have red borders

**Test Case B: Incomplete Entry**
- Select account for debit, but leave amount at 0
- Select account for credit with amount
- ✅ Debit row should show red border
- ✅ Submit should be blocked

**Test Case C: Valid Entry**
- **Debit Side:**
  - Account: Select "Cash" or any asset account
  - Amount: 10000
- **Credit Side:**
  - Account: Select "Owner's Equity" or revenue
  - Amount: 10000
- ✅ Balance indicator should show "BALANCED" in green
- ✅ Submit should work
- ✅ Success toast should appear
- ✅ Entry should appear in list

**Test Case D: Unbalanced Entry**
- Debit: 10000
- Credit: 5000
- ✅ Balance indicator should show "OFF BY 5000" in red
- ✅ Submit button should be disabled

**Test Case E: Multiple Lines**
- Click "Add" to add more debit/credit lines
- Create entry with:
  - Debit: Account A - 5000
  - Debit: Account B - 5000
  - Credit: Account C - 10000
- ✅ Should balance and submit successfully

---

### 2. Bank Reconciliation ✅

**Test the Fixed Null Safety**

1. Navigate to Finance → Bank Reconciliation

**Test Case A: Create Session**
- Click "New Reconciliation"
- Select a bank account from dropdown
- ✅ Dropdown should populate with accounts
- Set statement date: Today
- Closing balance: 50000
- Add statement lines:
  - Line 1: Description "Deposit", Credit: 5000
  - Line 2: Description "Check", Debit: 1000
- Click "Start Reconciliation"
- ✅ Should create session without errors
- ✅ Should open session detail view

**Test Case B: View Session**
- ✅ Session details should load
- ✅ Statement lines should display (left panel)
- ✅ GL entries should display (right panel)
- ✅ Stats should show: Total, Matched, Unmatched, Difference
- ✅ No console errors

**Test Case C: Match Transactions**
- Click "Match" on a statement line
- ✅ GL entries list should expand below
- Click on a GL entry to match
- ✅ Match should save
- ✅ Line should show "MATCHED" badge
- ✅ Stats should update

**Test Case D: Unmatch Transaction**
- Click "Unmatch" on a matched line
- ✅ Match should be removed
- ✅ Line should return to unmatched state
- ✅ Stats should update

**Test Case E: Complete Session**
- Match all statement lines
- ✅ "Mark Complete" button should appear
- Click "Mark Complete"
- ✅ Session status should change to "COMPLETED"
- ✅ Session should appear as completed in list

**Test Case F: Empty Session**
- Create session with no statement lines
- ✅ Should show "No statement lines"
- ✅ Should not crash

---

### 3. General Ledger ✅

**Test Report Generation**

1. Navigate to Finance → General Ledger

**Test Case A: All Accounts View**
- Leave "All Accounts" selected
- Set date range: Last 30 days
- Click "Filter"
- ✅ Should load entries from all accounts
- ✅ Columns: Date, Account, Description, Debit, Credit
- ✅ No "Balance" column (multi-account view)

**Test Case B: Single Account View**
- Select specific account (e.g., "Cash")
- Click "Filter"
- ✅ Should load entries for that account only
- ✅ Should show "Balance" column
- ✅ Running balance should calculate correctly

**Test Case C: CSV Export**
- Click "CSV" button
- ✅ Should download CSV file
- ✅ File should contain all visible entries
- ✅ Single account view should include balance column

**Test Case D: PDF Export**
- Click "PDF" button
- ✅ Should generate PDF
- ✅ PDF should be properly formatted
- ✅ Should include business name and date range

**Test Case E: Print**
- Click "Print" button
- ✅ Should open print dialog
- ✅ Preview should be formatted for printing

---

### 4. Journal Entries List ✅

**Test Listing & Filtering**

1. Navigate to Finance → Journal Entries

**Test Case A: View List**
- ✅ Should show list of journal entries
- ✅ Each entry should show: Number, Description, Date, Totals
- ✅ Desktop: Table view
- ✅ Mobile: Card view

**Test Case B: Expand Entry**
- Click on a journal entry row
- ✅ Should expand to show GL line details
- ✅ Should show account codes, names, debits, credits
- ✅ Click again to collapse

**Test Case C: Filter by Date**
- Set start and end dates
- Click "Apply"
- ✅ Should filter entries by date range

**Test Case D: Filter by Account**
- Select account from dropdown
- Click "Apply"
- ✅ Should show only entries touching that account

**Test Case E: Search**
- Enter text in search box
- Press Enter or click "Apply"
- ✅ Should search journal numbers and descriptions

**Test Case F: Pagination**
- If more than 30 entries exist
- ✅ Should show pagination controls
- ✅ "Previous" and "Next" buttons should work

---

### 5. Chart of Accounts ✅

**Test Account Management**

1. Navigate to Finance → Chart of Accounts

**Test Case A: View Accounts**
- ✅ Should show list of GL accounts
- ✅ Grouped by type (Assets, Liabilities, Equity, Revenue, Expenses)
- ✅ Each account shows: Code, Name, Type, Status

**Test Case B: Create Account**
- Click "New Account"
- Fill in:
  - Code: 5100
  - Name: "Consulting Revenue"
  - Type: Revenue
- Click "Save"
- ✅ Should create account
- ✅ Should appear in list

**Test Case C: Edit Account**
- Click "Edit" on an account
- Change the name
- Click "Save"
- ✅ Should update account
- ✅ Changes should reflect in list

**Test Case D: System Accounts**
- Try to edit a system account
- ✅ Code and Type should be read-only
- ✅ Can only edit Name and Description

---

### 6. Statements ✅

**Test Financial Reports**

1. Navigate to Finance → Statements

**Test Case A: Profit & Loss**
- Select "P&L" statement
- Set date range
- ✅ Should show revenue and expenses
- ✅ Should calculate net profit/loss
- ✅ Totals should be correct

**Test Case B: Balance Sheet**
- Select "Balance Sheet"
- Set as-of date
- ✅ Should show assets, liabilities, equity
- ✅ Should balance (Assets = Liabilities + Equity)

**Test Case C: Trial Balance**
- Select "Trial Balance"
- Set date range
- ✅ Should list all accounts with balances
- ✅ Total debits should equal total credits

**Test Case D: Export**
- Click "PDF" or "CSV"
- ✅ Should export statement in selected format

---

## Edge Cases to Test

### Null Data Handling
- [ ] Create journal entry, then delete referenced account (shouldn't crash views)
- [ ] View bank reconciliation with deleted GL entries
- [ ] Filter ledger by non-existent account ID

### Concurrent Operations
- [ ] Open journal form in two tabs, submit from both
- [ ] Match same bank statement line from two sessions

### Large Data Sets
- [ ] Ledger with 1000+ entries
- [ ] Journal entry with 20+ lines
- [ ] Bank reconciliation with 100+ GL entries

### Permission Scenarios
- [ ] User without `finance.view_gl` permission (should be blocked)
- [ ] User with view-only trying to create entries (should be blocked)

---

## Common Error Messages

### Expected (Proper Validation)

✅ **"At least 2 complete entries required"**
- Missing accounts or amounts
- Remove incomplete rows or fill them in

✅ **"Journal entry must be balanced (Debits = Credits)"**
- Debits don't match credits
- Adjust amounts to balance

✅ **"All entries must have a GL account selected"**
- (Should not appear with new validation - incomplete entries filtered)

✅ **"Account code already exists"**
- Trying to create duplicate account code
- Use a different code

### Unexpected (Report if Seen)

❌ **"Either account_id or accountCode is required"**
- Should be fixed - report if seen

❌ **"Cannot read properties of undefined (reading 'id')"**
- Should be fixed - report if seen

❌ **"Session not found"**
- Check if session was deleted
- Try creating a new session

---

## Performance Benchmarks

Expected load times:

| Operation | Expected Time |
|-----------|---------------|
| Load Journal Entries (30) | < 1 second |
| Load General Ledger (100 entries) | < 2 seconds |
| Create Journal Entry | < 500ms |
| Bank Reconciliation Match | < 300ms |
| Export CSV/PDF | < 3 seconds |

If operations take significantly longer:
- Check database indexes
- Review console for slow queries
- Consider pagination/filtering for large datasets

---

## Automated Testing

Run verification before testing:

```bash
# Verify all Finance components
npm run verify:finance-hub

# Verify Bank Reconciliation specifically
npm run verify:bank-reconciliation

# Check Finance GL wiring
npm run verify:finance-gl
```

---

## Reporting Issues

If you find issues:

1. **Check browser console** for errors
2. **Note the exact steps** to reproduce
3. **Check which component** is affected
4. **Note any error messages** shown to user
5. **Check verification scripts** passed/failed

Include:
- Browser and version
- User role and permissions
- Business/tenant ID
- Specific tab and action
- Full error message from console

---

## Success Criteria

After testing, you should be able to:

- ✅ Create journal entries without validation errors
- ✅ Match bank transactions without crashes
- ✅ View general ledger with running balances
- ✅ Export financial reports
- ✅ Manage chart of accounts
- ✅ Complete full accounting cycle without errors

**All Finance Hub features should work smoothly without console errors or crashes.**

---

**Ready to Test!** 🚀

Start with Journal Entries and Bank Reconciliation (the two fixed features), then test the rest to ensure everything works together.
