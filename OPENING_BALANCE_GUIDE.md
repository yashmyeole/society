# Opening Balance Feature for Ledger - Implementation Guide

## Overview

The opening balance feature allows you to set an initial balance for each member or expense person at the start of a financial year. This is crucial for accurate ledger calculations when there are dues from previous years or overpayments that need to carry forward.

## What is Opening Balance?

### Positive Opening Balance (+)

- **Meaning**: Amount is owed TO the member
- **Example**: If a member paid ₹2000 extra last year, set opening balance as +2000
- **Impact**: The ledger starts with ₹2000 credit to the member
- **During Year**: Any income collected reduces this amount first before creating new credit

### Negative Opening Balance (-)

- **Meaning**: Member owes this amount
- **Example**: If a member owed ₹1500 last year, set opening balance as -1500
- **Impact**: The ledger starts with ₹1500 due from the member
- **During Year**: Any payments received reduce this amount first before creating new credit

### Zero Opening Balance (0)

- No dues or overpayments from previous year
- Ledger starts fresh for the financial year

## How to Use

### Setting Opening Balance

1. **Navigate to Ledger Section**
   - Go to Society → Financial Year → Ledger

2. **Select a Person**
   - Choose the member or expense person from the dropdown

3. **View Opening Balance Section**
   - A blue section appears showing current opening balance
   - Click "Edit" button

4. **Enter the Amount**
   - Enter positive or negative amount (use minus sign for negative)
   - Examples:
     - `+1000` or just `1000` → Member paid extra last year
     - `-1500` → Member owes from last year
     - `0` → No opening balance

5. **Save**
   - Click "Save" button
   - Opening balance is saved to database

6. **Cancel**
   - Click "Cancel" to discard changes without saving

## Balance Calculation Logic

### Formula

```
Ledger Balance for a Transaction =
    Opening Balance
    + Sum of all Income transactions
    - Sum of all Expense transactions
```

### Example Scenario

**Person: Member A**

| Item                           | Amount | Running Balance                          |
| ------------------------------ | ------ | ---------------------------------------- |
| **Opening Balance**            | -      | **₹500** (positive - overpaid last year) |
| Transaction 1: Income Received | +₹1000 | ₹1500                                    |
| Transaction 2: Expense Bill    | -₹200  | ₹1300                                    |
| Transaction 3: Income Received | +₹500  | ₹1800                                    |
| **TOTAL**                      | +₹1300 | **₹1800** (₹500 opening + ₹1300 net)     |

### Example with Negative Opening Balance

**Person: Vendor B**

| Item                           | Amount | Running Balance                                 |
| ------------------------------ | ------ | ----------------------------------------------- |
| **Opening Balance**            | -      | **-₹2000** (owes from last year)                |
| Transaction 1: Expense Payment | -₹2000 | -₹4000                                          |
| Transaction 2: Expense Payment | -₹1500 | -₹5500                                          |
| **TOTAL**                      | -₹3500 | **-₹5500** (₹2000 opening + ₹3500 net expenses) |

## Data Storage

Opening balances are stored in Firebase at:

```
personOpeningBalances/
  {societyId}/
    {yearId}/
      {personName}: {amount}
```

**Example:**

```
personOpeningBalances/
  society123/
    year2024-25/
      "Raj Kumar": 500
      "Cleaning Vendor": -2000
      "Electricity": 0
```

## Features in Reports

### Ledger Display

- **Opening Balance Card**: Shows at a glance before fetching
- **Editable Inline**: Can edit directly while viewing ledger
- **Summary Card**: Opening balance appears in summary section (4 cards)

### Balance Column

- First row shows opening balance as starting point
- Each transaction updates the running balance
- Final balance = Opening Balance + Total Income - Total Expense

### Excel Exports

#### Individual Person Ledger

- Download single person's ledger (after selecting a person)
- Excel file includes opening balance in calculations
- Total row reflects: Opening Balance + Income - Expense

#### All Members Ledger

- Download all members' ledgers in one file
- Each member gets a separate sheet
- Each sheet includes that member's opening balance

## Important Notes

### Calculation Accuracy ⚠️

The system ensures perfect accuracy by:

1. **Starting with Opening Balance**: All calculations begin from this value
2. **Sequential Processing**: Transactions processed in date order
3. **Real-time Updates**: Balance updates reflect immediately
4. **Excel Consistency**: Downloads show same calculations as displayed

### When to Set Opening Balance

✅ **DO set opening balance when:**

- Previous year had overpayments that carry forward
- Member/vendor has outstanding dues
- You're starting ledger for a new year
- Migrating from manual records

❌ **DON'T set opening balance when:**

- Starting completely fresh with no prior transactions
- Previous year is tracked separately
- First time creating ledger for this person

### Best Practices

1. **Before Starting Ledger**: Set all opening balances for the year
2. **Document**: Keep records of why certain opening balances were set
3. **Verify**: Cross-check opening balance with previous year's closing
4. **Consistent Sign Convention**:
   - Positive = overpayment/credit to member
   - Negative = dues/credit to society
5. **Review**: Periodically review opening balances for accuracy

## Troubleshooting

### Opening Balance Not Showing

- Refresh the page
- Select person again
- Check Firebase has write permissions

### Calculations Look Wrong

- Verify opening balance is set correctly
- Check transaction dates are in chronological order
- Ensure positive/negative sign is correct

### Cannot Edit Opening Balance

- Make sure a person is selected
- Check Firebase permissions for `personOpeningBalances` path
- Try refreshing page if UI doesn't respond

## Database Structure

### Path Structure

```
personOpeningBalances/
  {societyId}/
    {yearId}/
      {personName}: number
```

### Data Integrity

- Opening balances are year-specific
- Each person can have different opening balance per year
- Numbers stored as decimal for precision (e.g., 1000.50)
- Negative values stored naturally (e.g., -2000)

## Example Workflow

### Scenario: New Year Setup

**Year: 2024-25, Society: Sunrise Apartments**

1. Go to Ledger section for 2024-25
2. Select "Raj Kumar" (Member)
   - He had +₹1500 overpayment last year
   - Set opening balance to: `1500`
3. Select "Cleaning Vendor"
   - They are owed ₹3000 for last year's unpaid invoice
   - Set opening balance to: `-3000`
4. Select "Electricity Expense"
   - No prior dues
   - Opening balance: `0` (or leave blank)
5. Start entering transactions for 2024-25
6. Balances automatically reflect including opening amounts

All calculations now properly account for carried-forward balances!

---

## Technical Details

### State Management

- `personOpeningBalances`: Map<string, number> - Stores all opening balances
- `editingOpeningBalance`: string | null - Tracks which person is being edited
- `tempOpeningBalance`: string - Holds the input value during editing

### Functions

- `getOpeningBalance(personName)`: Returns opening balance for person
- `handleEditOpeningBalance(personName)`: Enables edit mode
- `handleSaveOpeningBalance()`: Saves to database
- All download functions include opening balance in calculations

### Firebase Integration

- Read: Fetched on page load from `personOpeningBalances/{societyId}/{yearId}`
- Write: Updated when "Save" is clicked
- Path: `personOpeningBalances/{societyId}/{yearId}/{personName}`
