# Quick Reference Guide

## 🚀 Getting Started in 5 Minutes

### 1. Setup Firebase (2 min)

- [ ] Create Firebase project at https://console.firebase.google.com
- [ ] Enable Email/Password authentication
- [ ] Create Firestore database (production mode)
- [ ] Copy Firebase config

### 2. Configure Environment (1 min)

- [ ] Create `.env.local` in project root
- [ ] Paste Firebase credentials from Step 1

### 3. Run Locally (1 min)

```bash
npm install        # First time only
npm run dev        # Start development server
```

### 4. Access Application (1 min)

- Open http://localhost:3000
- Sign up with email and password
- Start creating societies and managing finances!

---

## 📚 Most Common Tasks

### Add a New Society

1. Go to Home page
2. Click "Create Society" button
3. Fill in society details
4. Click "Create Society"

### Create Financial Year Report

1. Click on society card
2. Click "Add Report" button
3. Enter year (e.g., 2024-2025)
4. Click "Create Report"

### Add Income Transaction

1. Click on financial year
2. Click "+ Add Income" button
3. Fill form:
   - Select date
   - Enter receipt number
   - Select member
   - Choose type (credit/debit)
   - Choose payment method
   - Enter amount
4. Click "Add Income"

### Add Expense Transaction

1. Click on financial year
2. Click "+ Add Expense" button
3. Fill form:
   - Select date
   - Select reason from dropdown
   - Choose payment method
   - Enter amount
4. Click "Add Expense"

### Add Members

1. On transactions page, click "Members" button
2. Click "+ Add Member" button
3. Fill form:
   - Enter flat number
   - Enter member name
   - Enter contact number
4. Click "Add Member"

---

## 🎯 File Locations

| Task                   | File Location                                              |
| ---------------------- | ---------------------------------------------------------- |
| Edit login page        | `src/app/login/page.tsx`                                   |
| Edit signup page       | `src/app/signup/page.tsx`                                  |
| Edit home page         | `src/app/home/page.tsx`                                    |
| Change colors          | Modify Tailwind classes in page files                      |
| Add expense reasons    | `src/app/society/[id]/year/[yearId]/transactions/page.tsx` |
| Modify Firebase config | `src/lib/firebase.ts`                                      |
| Edit global styles     | `src/app/globals.css`                                      |

---

## 🔧 Troubleshooting Quick Links

| Issue                     | Solution                                          |
| ------------------------- | ------------------------------------------------- |
| App won't start           | Run `npm install` first                           |
| Firebase connection fails | Check `.env.local` has all variables              |
| Data not saving           | Check Firebase security rules are applied         |
| Login issues              | Ensure Email/Password auth is enabled in Firebase |
| Build fails               | Run `npm run build` to see detailed errors        |
| Styling looks off         | Clear browser cache and hard refresh              |

---

## 📝 Environment Variables Template

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project-123.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-123
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=project-123.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://project-123.firebaseio.com
```

---

## 🗂️ Database Structure at a Glance

```
Firestore
├── societies/
│   └── {societyId}
│       ├── name
│       ├── address
│       ├── ownerName
│       ├── contactNumber
│       └── userId
├── financialYears/
│   └── {yearId}
│       ├── year
│       ├── societyId
│       └── userId
├── members/
│   └── {memberId}
│       ├── name
│       ├── flatNumber
│       ├── contactNumber
│       ├── societyId
│       └── userId
└── transactions/
    └── {transactionId}
        ├── date
        ├── amount
        ├── type (debit/credit)
        ├── transactionType (income/expense)
        ├── paymentMethod (cash/cheque/upi)
        ├── yearId
        ├── societyId
        └── userId
```

---

## 🎨 Color Reference

| Color         | Hex     | Usage                    |
| ------------- | ------- | ------------------------ |
| Primary Blue  | #2563eb | Buttons, headers         |
| Dark Blue     | #1d4ed8 | Hover states             |
| Success Green | #16a34a | Income, positive actions |
| Danger Red    | #dc2626 | Expenses, logout         |
| Purple        | #9333ea | Members, secondary       |
| Gray          | #6b7280 | Text, borders            |
| Light Gray    | #f9fafb | Background               |

---

## 📱 Keyboard Shortcuts (Future Feature)

| Shortcut       | Action               |
| -------------- | -------------------- |
| `Cmd/Ctrl + K` | Search societies     |
| `Cmd/Ctrl + N` | New society          |
| `Escape`       | Close modal          |
| `Tab`          | Navigate form fields |
| `Enter`        | Submit form          |

---

## 🔐 Firebase Security Rules (Copy-Paste Ready)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /societies/{docId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    match /financialYears/{docId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    match /members/{docId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    match /transactions/{docId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
  }
}
```

---

## 📊 Data Entry Guide

### Society Information

- **Name**: Full name of the housing society
- **Address**: Complete physical address
- **Owner Name**: Person responsible for management
- **Contact Number**: Primary contact phone number

### Financial Year Format

- Use format: `YYYY-YYYY` (e.g., `2024-2025`)
- One financial year per entry

### Member Information

- **Flat Number**: Format like `A-101`, `B-205`
- **Name**: Resident/owner name
- **Contact**: Mobile or landline number

### Transactions

- **Receipt Number**: Use format `REC-001`, `REC-002` etc.
- **Amount**: Enter as number without currency symbol
- **Date**: Select from date picker
- **Payment Method**: Choose cash, cheque, or UPI

---

## 🚀 Deployment Checklist

- [ ] Test all features locally
- [ ] Build project: `npm run build`
- [ ] No errors in build output
- [ ] `.env.local` is in `.gitignore`
- [ ] Commit code to GitHub
- [ ] Connect to Vercel
- [ ] Add environment variables in Vercel
- [ ] Deploy and test
- [ ] Verify all features work on live site

---

## 📞 Getting Help

1. **Local Development Issues**
   - Check `GETTING_STARTED.md`
   - Review error messages in console
   - Check `package.json` for scripts

2. **Firebase Issues**
   - Visit `firebase.google.com/docs`
   - Check Firebase Console logs
   - Verify security rules are applied

3. **Styling Issues**
   - Check Tailwind classes in component
   - Clear browser cache
   - Review `UI_GUIDE.md`

4. **Deployment Issues**
   - Check `DEPLOYMENT.md`
   - Review platform-specific docs
   - Check build logs

---

## 📈 Performance Tips

1. Keep financial years organized by creating new ones annually
2. Archive completed years to keep data clean
3. Use consistent naming conventions
4. Regularly backup important data
5. Monitor Firebase usage to avoid unexpected costs

---

## ✨ Pro Tips

- Double-check member names before adding transactions
- Use consistent receipt number format
- Review balance regularly for accuracy
- Keep contact information up to date
- Take advantage of payment method tracking for reconciliation

---

**Last Updated**: March 4, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
