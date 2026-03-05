# Cashbook Feature - Quick Reference

## Access the Cashbook

**Home → Select Society → Select Financial Year → Click "Cashbook" Button**

## What You See

### Top: Balance Cards

```
┌─────────────────┐     ┌─────────────────┐
│ Opening Balance │     │ Closing Balance │
│  ₹ 5,000.00    │     │  ₹ 15,000.00   │
│  [Edit]        │     │  [Edit]        │
└─────────────────┘     └─────────────────┘
```

### Middle: Transaction Table

- Shows all income & expenses in chronological order
- Running balance updates after each transaction
- Total row summarizes income, expense, and net balance
- Closing balance row shows final amount

### Bottom: Summary & Download

```
Opening Balance: ₹5,000 | Income: ₹8,000 | Expense: ₹200 | Balance: ₹12,800
[📥 Download PDF]
```

## Common Tasks

### Edit Opening Balance

1. Click "Edit" on Opening Balance card
2. Enter new amount
3. Click "Save"

### Edit Closing Balance

1. Click "Edit" on Closing Balance card
2. Enter new amount
3. Click "Save"

### Download as PDF

1. Scroll to bottom
2. Click "📥 Download PDF"
3. File downloads as `{SocietyName}-Cashbook-{Year}.pdf`

### Add Income/Expense

- Use "Transactions" page (not cashbook)
- Changes appear in cashbook automatically

### View Previous Year

- Go back to societies list
- Select previous year
- Click "Cashbook"

## Understanding the Table

| Column     | Shows                           |
| ---------- | ------------------------------- |
| Date       | When transaction occurred       |
| Receipt No | Cheque/receipt number           |
| Details    | Member name or expense reason   |
| Debit      | Money OUT (red, expenses)       |
| Credit     | Money IN (green, income)        |
| Balance    | Cash position after transaction |

## Color Meanings

- 🟢 Green = Income / Opening Balance
- 🔴 Red = Expense
- 🔵 Blue = Closing Balance / Final Balance

## Formulas

**Running Balance:**

```
Balance = Opening Balance + Income - Expense
```

**Final Balance:**

```
Final = Opening + Total Income - Total Expense
```

## PDF Download Tips

- Works on all browsers
- Includes all transactions and balances
- Landscape format for better table display
- Multi-page if cashbook is large
- Good for printing or archiving

## Troubleshooting

| Problem            | Solution                                |
| ------------------ | --------------------------------------- |
| PDF won't download | Try different browser, check disk space |
| Cashbook empty     | Add transactions on Transactions page   |
| Balance wrong      | Check opening balance is correct        |
| Can't edit balance | Ensure you're logged in, try refreshing |

## Tips

- Download PDF at year-end for records
- Compare calculated vs entered closing balance
- Review regularly for accuracy
- Keep PDFs for audit purposes

---

**Need more help?** See CASHBOOK_USER_GUIDE.md for detailed instructions.
