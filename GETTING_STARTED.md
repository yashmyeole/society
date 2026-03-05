# Getting Started with Housing Society Manager

## Quick Start Guide

### Step 1: Setup Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable Email/Password provider
4. Create Firestore Database:
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in production mode"
   - Select a location
5. Get your Firebase Config:
   - Go to Project Settings
   - Copy the config object from the web app

### Step 2: Environment Setup

1. Create `.env.local` file in project root
2. Add your Firebase credentials:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project_id.firebaseio.com
```

### Step 3: Firebase Security Rules

Update your Firestore security rules to allow authenticated users to access their data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to access only their own data
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

### Step 4: Run the Application

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start using the app!

## Usage Workflow

### First Time Setup

1. **Sign Up**
   - Click on the signup link
   - Enter email and password
   - Create your account

2. **Create Your First Society**
   - Click "Create Society"
   - Fill in:
     - Society Name: e.g., "Yash Housing Society"
     - Address: e.g., "123 Main Street, City"
     - Owner Name: Your name
     - Contact Number: Your phone number
   - Click "Create Society"

3. **Add Financial Year**
   - Click on the society card
   - Click "Add Report"
   - Enter year: e.g., "2024-2025"
   - Click "Create Report"

4. **Add Members**
   - Click on the financial year
   - Click "Members"
   - Click "+ Add Member"
   - Enter:
     - Flat Number: e.g., "A-101"
     - Member Name: Resident's name
     - Contact Number: Their phone
   - Click "Add Member"

5. **Track Finances**
   - In the transactions view, you can:
     - **Add Income**: Click "+ Add Income"
       - Select transaction date
       - Enter receipt number
       - Select member
       - Choose type (credit/debit)
       - Choose payment method (cash/cheque/UPI)
       - Enter amount
     - **Add Expense**: Click "+ Add Expense"
       - Select transaction date
       - Select reason from dropdown
       - Choose payment method
       - Enter amount

## Common Tasks

### View Transaction Summary

- Navigate to the financial year
- See total income and expenditure at the top of each section
- Scroll through the transaction list

### Export Data

Currently, data is stored in Firebase Firestore. You can:

- Access raw data from Firebase Console
- Export data manually for reports

### Change Password

- Use Firebase Console → Authentication → click user
- Or implement password reset feature (optional enhancement)

## Tips & Tricks

1. **Receipt Numbers**: Use a consistent format like REC-001, REC-002, etc.
2. **Transaction Dates**: All dates are stored and can be sorted
3. **Payment Methods**: Each transaction records how payment was made (important for reconciliation)
4. **Member Tracking**: Link income to specific members for accountability

## Troubleshooting

### Login Issues

- Ensure Firebase Authentication is enabled
- Check your email address is registered
- Clear browser cache and cookies

### Data Not Saving

- Check browser console for errors (F12 → Console)
- Verify Firebase credentials in .env.local
- Check Firebase Firestore security rules

### Slow Performance

- Firebase free tier has rate limits
- Consider upgrading to Blaze plan for production
- Optimize queries in the app

## Support & Contact

For issues or feature requests:

1. Check the README.md for more information
2. Review Firebase documentation
3. Check browser console for error messages

## Next Steps

1. Familiarize yourself with the app interface
2. Create test data to understand the workflow
3. Review and customize expense categories if needed
4. Set up proper Firebase security rules before going live

Happy managing! 🏠
