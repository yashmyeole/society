# Housing Society Manager

A modern, full-stack application for managing housing society finances and members. Built with Next.js, Firebase, and Tailwind CSS.

## Features

- **User Authentication**: Secure Firebase authentication with login and signup
- **Society Management**: Create and manage multiple housing societies
- **Financial Tracking**:
  - Income tracking with receipts and transaction methods
  - Expense tracking with categorized reasons
  - Dual-panel view for income and expenditure
  - Real-time balance calculations
- **Member Management**: Add, view, and manage society members
- **Multi-Year Reports**: Organize finances by financial years
- **Responsive Design**: Beautiful UI that works on all devices

## Tech Stack

- **Frontend**: Next.js 16+ with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **State Management**: React Hooks + Context API

## Prerequisites

- Node.js 18+ and npm
- Firebase account with a Firestore database
- Environment variables configured

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd home_housing
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create a Firestore database in production mode
   - Copy your Firebase config credentials

4. **Set up environment variables**
   Create a `.env.local` file in the project root with your Firebase credentials:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
   ```

## Database Schema

### Collections

1. **societies**
   - id (auto)
   - name
   - address
   - ownerName
   - contactNumber
   - userId (reference to user)
   - createdAt

2. **financialYears**
   - id (auto)
   - year
   - societyId (reference to society)
   - userId (reference to user)
   - createdAt

3. **members**
   - id (auto)
   - name
   - flatNumber
   - contactNumber
   - societyId (reference to society)
   - userId (reference to user)
   - createdAt

4. **transactions**
   - id (auto)
   - date
   - receiptNumber
   - memberName
   - memberId
   - type (debit/credit)
   - paymentMethod (cash/cheque/upi)
   - amount
   - transactionType (income/expense)
   - reason (for expenses)
   - societyId (reference to society)
   - yearId (reference to financial year)
   - userId (reference to user)
   - createdAt

## Running the Application

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                          # Root layout with Auth provider
│   ├── page.tsx                            # Root redirect page
│   ├── login/
│   │   └── page.tsx                        # Login page
│   ├── signup/
│   │   └── page.tsx                        # Signup page
│   ├── home/
│   │   └── page.tsx                        # Societies list
│   └── society/
│       └── [id]/
│           ├── page.tsx                    # Financial years
│           └── year/
│               └── [yearId]/
│                   ├── transactions/
│                   │   └── page.tsx        # Income/Expense tracking
│                   └── members/
│                       └── page.tsx        # Members management
├── components/
│   ├── Modal.tsx                           # Reusable modal component
│   └── ProtectedRoute.tsx                  # Protected route wrapper
├── context/
│   └── AuthContext.tsx                     # Authentication context
└── lib/
    └── firebase.ts                         # Firebase configuration
```

## How to Use

### 1. Create Account

- Go to signup page and create a new account with email and password
- You'll be redirected to the home page after successful registration

### 2. Create a Society

- Click "Create Society" button
- Fill in society details: name, address, owner name, and contact number
- Click "Create Society"

### 3. Add Financial Year

- Click on a society card to view its financial reports
- Click "Add Report" to create a new financial year
- Enter the financial year (e.g., 2024-2025)

### 4. Manage Finances

- Click on a financial year to view transactions
- **Add Income**: Click "+ Add Income", enter date, receipt number, member name, transaction type, payment method, and amount
- **Add Expense**: Click "+ Add Expense", enter date, reason (from dropdown), payment method, and amount
- View real-time balance calculations

### 5. Manage Members

- Click "Members" button in the transaction view
- Click "+ Add Member" to add a new member
- Enter flat number, name, and contact number

## Key Features Explained

### Authentication

- Users can sign up with email and password
- Secure login with Firebase Authentication
- Protected routes that redirect unauthorized users to login

### Society Management

- Create new societies with details (name, address, owner, contact)
- View all created societies in a card layout
- Click on a society to view financial reports

### Financial Management

- Create multiple financial year reports for each society
- Add income transactions with member tracking
- Add expense transactions with categorized reasons
- Real-time balance calculations
- Dual-panel view showing income and expenditure

### Member Management

- Add society members with contact information
- View all members for a society
- Link members to income transactions

## Expense Categories

The following expense categories are available by default:

- Sweeper
- Security Guard
- Maintenance
- Utilities
- Repairs
- Insurance
- Administrative
- Other

To add more categories, edit the expense reason dropdown in the transactions page.

## Customization

### Add New Expense Reasons

Edit `/src/app/society/[id]/year/[yearId]/transactions/page.tsx` and add options to the expense reason dropdown.

### Modify Tailwind Styling

Update `src/app/globals.css` or add inline Tailwind classes to components.

## Troubleshooting

1. **Firebase connection issues**
   - Verify all environment variables are correctly set
   - Check Firebase rules allow authenticated users to read/write
   - Ensure Firestore database is in production mode

2. **Build errors**
   - Delete `node_modules` and `.next` folder
   - Run `npm install` again

3. **Authentication issues**
   - Ensure Firebase Authentication is enabled
   - Check that Email/Password provider is enabled

## Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Security Best Practices

- Never commit `.env.local` to version control
- Use Firebase security rules to protect data
- Implement proper authentication and authorization

## Future Enhancements

- [ ] PDF report generation
- [ ] Email notifications
- [ ] Data export to Excel
- [ ] Advanced analytics and charts
- [ ] User role management

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
