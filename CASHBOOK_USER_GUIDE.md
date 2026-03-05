# Cashbook User Guide

## What is the Cashbook?

The Cashbook is a professional financial record that displays all your transactions (income and expenses) in chronological order, starting from an opening balance and ending with a closing balance. It shows the cash position at every step.

## How to Access the Cashbook

1. **Login** to the application
2. **Select a Society** from the "My Societies" page
3. **Select a Financial Year** from the society's financial years list
4. **Click the "Cashbook" button** to view the complete cashbook

## Understanding the Cashbook Layout

### Top Section: Balance Cards

```
┌─────────────────────────────┐  ┌──────────────────────────────┐
│    Opening Balance          │  │   Closing Balance            │
│    ₹ 5,000.00              │  │   ₹ 15,000.00               │
│    [Edit Button]           │  │   [Edit Button]             │
└─────────────────────────────┘  └──────────────────────────────┘
```

**Opening Balance**: The cash you had at the start of the financial year
**Closing Balance**: The cash you should have at the end of the financial year

### Main Section: Transaction Table

The cashbook displays transactions in a table format:

```
┌────────┬──────────┬────────────────┬─────────┬─────────┬───────────┐
│ Date   │ Receipt  │ Details        │ Debit   │ Credit  │ Balance   │
│        │ No       │                │ (₹)     │ (₹)     │ (₹)       │
├────────┼──────────┼────────────────┼─────────┼─────────┼───────────┤
│Opening Balance                                           │ 5,000.00 │
├────────┼──────────┼────────────────┼─────────┼─────────┼───────────┤
│01/09/13│ 102      │ Ranjana Chate  │    -    │ 400.00  │ 5,400.00 │
│01/09/13│ 202      │ Anil Sapkal    │    -    │ 400.00  │ 5,800.00 │
│01/09/13│    -     │ Sweeper Salary │ 800.00  │    -    │ 5,000.00 │
├────────┼──────────┼────────────────┼─────────┼─────────┼───────────┤
│ TOTAL  │          │                │ 800.00  │ 800.00  │ 5,000.00 │
├────────┼──────────┼────────────────┼─────────┼─────────┼───────────┤
│Closing Balance (Calculated)                             │ 5,000.00 │
└────────┴──────────┴────────────────┴─────────┴─────────┴───────────┘
```

### Column Explanations

| Column          | What It Shows                                   |
| --------------- | ----------------------------------------------- |
| **Date**        | When the transaction occurred (DD/MM/YYYY)      |
| **Receipt No**  | Cheque number or receipt number (if applicable) |
| **Details**     | Member name (for income) or reason for expense  |
| **Debit (₹)**   | Money going OUT (expenses only)                 |
| **Credit (₹)**  | Money coming IN (income only)                   |
| **Balance (₹)** | Running cash balance after this transaction     |

### Bottom Section: Summary

```
┌──────────────────┬────────────────┬───────────────┬──────────────┐
│ Opening Balance  │ Total Income   │ Total Expense │ Final Balance│
│ ₹5,000.00        │ ₹8,000.00      │ ₹200.00       │ ₹12,800.00  │
└──────────────────┴────────────────┴───────────────┴──────────────┘
```

## Managing Opening and Closing Balances

### Editing Opening Balance

1. On the Cashbook page, find the **Opening Balance** card at the top
2. Click the **"Edit" button**
3. Enter the new amount
4. Click **"Save"** to save, or **"Cancel"** to discard
5. A success message will appear

### Editing Closing Balance

1. Find the **Closing Balance** card
2. Click the **"Edit" button**
3. Enter the expected closing balance
4. Click **"Save"** to confirm

**Note**: The system also calculates a closing balance based on transactions. Compare it with your physical cash count.

## Understanding the Numbers

### How the Running Balance Works

**Example:**

- Opening Balance: ₹5,000
- Transaction 1: Income of ₹400 → Balance: ₹5,400
- Transaction 2: Income of ₹400 → Balance: ₹5,800
- Transaction 3: Expense of ₹800 → Balance: ₹5,000

The balance updates after each transaction, showing you exactly how much cash you have at any point in time.

### How the Final Balance is Calculated

```
Final Balance = Opening Balance + Total Income - Total Expense
```

**Example:**

- Opening Balance: ₹5,000
- Total Income: ₹8,000
- Total Expense: ₹200
- **Final Balance: ₹5,000 + ₹8,000 - ₹200 = ₹12,800**

## Downloading the Cashbook as PDF

### Steps to Download

1. Open the Cashbook page
2. Scroll to the bottom
3. Click the **"📥 Download PDF"** button
4. The PDF will download to your computer

### What's Included in the PDF

✅ Society name and address
✅ Financial year period
✅ Opening and closing balances
✅ All transactions with dates and amounts
✅ Running balance for each transaction
✅ Summary totals
✅ Professional formatting suitable for printing

### File Name Format

The PDF is saved as: `{SocietyName}-Cashbook-{FinancialYear}.pdf`

Example: `Yash Housing Society-Cashbook-2024-2025.pdf`

### Using the PDF

- **Print**: Print for physical records
- **Email**: Share with members or authorities
- **Archive**: Keep for annual records
- **Analysis**: Use for financial reporting

## Tips and Best Practices

### 1. Keep Balances Updated

- Update opening balance at the start of each year
- Review closing balance with actual cash count
- Address any discrepancies immediately

### 2. Regular Review

- Check the cashbook weekly or monthly
- Look for unusual transactions
- Verify that all transactions are recorded

### 3. Transaction Entry

- Enter transactions on the day they occur
- Use clear descriptions (member names, expense reasons)
- Include receipt or cheque numbers
- Ensure payment method is recorded

### 4. Reconciliation

- At year-end, compare:
  - Closing balance (from cashbook)
  - Actual cash in hand
  - If different, investigate the difference

### 5. PDF Archival

- Download PDF at the end of each year
- Store securely with other financial records
- Keep for audit purposes (typically 7 years)

## Common Scenarios

### Scenario 1: Opening a New Cashbook

1. Create a financial year (e.g., "2024-2025")
2. Edit the **Opening Balance** to match your starting cash
3. Add all your transactions (income and expenses)
4. At year-end, set the **Closing Balance**
5. Download the PDF

### Scenario 2: Reviewing Previous Year's Data

1. Navigate to the previous financial year
2. Click "Cashbook" to view transactions
3. Review income, expenses, and balances
4. Download PDF for records

### Scenario 3: Cash Discrepancy

1. Physically count the cash
2. Compare with Final Balance in cashbook
3. If different:
   - Check for unrecorded transactions
   - Verify all amounts are correct
   - Look for duplicate entries
   - Add or correct any missing transactions

### Scenario 4: Quarterly Report

1. Open the current year's cashbook
2. Note the income and expense totals
3. Download the PDF
4. Share with committee members or auditor

## Troubleshooting

### Q: The cashbook is empty

**A**: Check if you've added any transactions. If yes:

- Make sure you're viewing the correct financial year
- Verify the transactions were saved (check transactions page)
- Try refreshing the page

### Q: Opening/Closing balance won't save

**A**:

- Check your internet connection
- Ensure you're logged in
- Try entering the amount again
- Contact support if the issue persists

### Q: PDF download fails

**A**:

- Try a different browser
- Check if pop-ups are blocked
- Ensure you have sufficient disk space
- Try again after a few moments

### Q: Running balance seems incorrect

**A**:

- Verify opening balance is correct
- Check transaction amounts
- Ensure transactions are in chronological order
- Review income vs expense types

## FAQs

**Q: Can I edit transactions from the cashbook?**
A: No, edit transactions from the Transactions page. Changes will update the cashbook automatically.

**Q: Can I add new transactions from cashbook?**
A: No, use the Transactions page to add income and expenses. The cashbook is a read-only view.

**Q: How far back does the cashbook show?**
A: The cashbook shows all transactions for the selected financial year only.

**Q: What if I delete a transaction?**
A: The running balances will automatically recalculate. The PDF will need to be downloaded again.

**Q: Is the PDF encrypted?**
A: The PDF is generated as a standard document. You can open it with any PDF viewer.

**Q: Can I print the cashbook?**
A: Yes, you can print from the PDF. Or, use the browser print function on the cashbook page.

**Q: What do "Debit" and "Credit" mean?**
A:

- **Debit (Expenses)**: Money going OUT - shown in red
- **Credit (Income)**: Money coming IN - shown in green

**Q: Why is my closing balance different from the calculated balance?**
A: You may have manually set a closing balance that differs from the calculated one. Review transactions to find discrepancies.

## Contact & Support

For questions or issues with the cashbook feature:

1. Check this guide first
2. Contact your application administrator
3. Review the transaction details page

---

**Remember**: A well-maintained cashbook is crucial for financial transparency and accountability in your housing society!
