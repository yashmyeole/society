# Ledger Feature Documentation

## Overview

The Ledger feature has been successfully implemented in the Reports section of the Society Management application. It allows users to view detailed income and expense records for specific members or expense persons and download the data as Excel (CSV) format.

## Files Created

- **`src/app/society/[id]/year/[yearId]/ledger/page.tsx`** - Main ledger page component

## Files Modified

- **`src/app/society/[id]/year/[yearId]/cashbook/page.tsx`** - Added "View Ledger" button to navigate to ledger page

## Features

### 1. **Person Selection Dropdown**

- Displays all society members (from the members list)
- Displays all expense persons (unique expense reasons from transactions)
- Users can select any person to view their ledger
- Dropdown automatically removes duplicates

### 2. **Fetch Ledger Functionality**

- Click "Fetch Ledger" button to retrieve all transactions for the selected person
- Filters both income and expense transactions:
  - **Income**: Filtered by `memberName`
  - **Expense**: Filtered by `reason` (expense person)
- Displays all matching transactions in chronological order

### 3. **Ledger Display Table**

- **Columns**:
  - Date: Transaction date in DD/MM/YYYY format
  - Details: Description of income/expense
  - Income (₹): Amount for income transactions
  - Expense (₹): Amount for expense transactions
  - Balance (₹): Running balance calculated transaction by transaction
- Color coding for easy reading:
  - Green for income amounts
  - Red for expense amounts
  - Blue for running balance

### 4. **Summary Cards**

- **Total Income**: Sum of all income transactions
- **Total Expense**: Sum of all expense transactions
- **Net Balance**: Difference between income and expense (color-coded: green if positive, red if negative)

### 5. **Excel Download**

- "Download Excel" button exports ledger data as CSV file
- CSV includes:
  - Header with society name, financial year, and selected person
  - All transactions with date, details, income, expense, and balance
  - Total row with sum calculations
- File naming convention: `{SocietyName}-{PersonName}-Ledger-{Year}.csv`

### 6. **Navigation**

- **"Back" button**: Returns to previous page
- **"Logout" button**: Logs out the user
- **"View Ledger" button on Cashbook page**: Navigates from cashbook to ledger

## Technical Implementation

### Data Structure

```typescript
interface Transaction {
  id: string;
  date: number;
  receiptNumber?: string;
  memberName: string;
  type: "debit" | "credit";
  paymentMethod: string;
  amount: number;
  reason?: string;
  transactionType: "income" | "expense";
}
```

### Key Functions

1. **`fetchData()`**: Retrieves society, year, members, and transactions from Firebase
2. **`handleFetchLedger()`**: Filters transactions based on selected person
3. **`calculateTotalIncome()`**: Computes total income for filtered transactions
4. **`calculateTotalExpense()`**: Computes total expense for filtered transactions
5. **`downloadExcel()`**: Generates and downloads CSV file with ledger data

### Running Balance Calculation

The running balance is calculated dynamically in the table:

- Starts from 0
- For each transaction up to current row:
  - Add amount if transaction type is "income"
  - Subtract amount if transaction type is "expense"
- Displayed in the Balance column for each row

## Security & Best Practices

✅ Protected Route: Uses `<ProtectedRoute>` component to ensure only authenticated users can access
✅ Firebase Integration: Data fetched only for current user (`user.uid`)
✅ Data Filtering: Transactions filtered by `yearId` and `userId` to ensure data privacy
✅ Error Handling: Try-catch blocks for all async operations
✅ User Feedback: Alert notifications for success/error messages
✅ Loading States: Shows "Loading..." message while fetching data

## User Flow

1. Navigate to Society → Year → Reports
2. View Cashbook (existing feature)
3. Click "View Ledger" button
4. Select a person from the dropdown
5. Click "Fetch Ledger" to view transactions
6. Review transactions in table format
7. Download Excel file for record-keeping or further analysis

## Styling & UX

- **Responsive Design**: Uses Tailwind CSS with mobile-friendly layout
- **Color Coding**: Easy visual distinction between income (green) and expense (red)
- **Hover Effects**: Table rows have subtle hover effect for better UX
- **Button Styling**:
  - Blue for PDF download
  - Green for CSV download
  - Purple for Ledger view
- **Consistent Layout**: Matches existing cashbook design and navigation patterns

## Testing Checklist

✅ Ledger page renders correctly
✅ Dropdown shows all members and expense persons
✅ Fetch button filters transactions correctly
✅ Running balance calculates accurately
✅ Summary cards show correct totals
✅ Excel download generates proper CSV file
✅ Navigation buttons work correctly
✅ Protected route prevents unauthorized access
✅ No console errors

## Future Enhancements (Optional)

- Add date range filter for specific periods
- Add search functionality for quick lookup
- Add PDF export similar to cashbook
- Add transaction editing from ledger view
- Add notes/comments for transactions
- Add pagination for large ledgers
- Add chart visualization for income vs expense trends

## Notes

- The ledger feature is now fully integrated with the cashbook
- Data is stored in Firebase Realtime Database
- All transactions are sorted chronologically
- Unique expense persons are automatically extracted from transaction reasons
