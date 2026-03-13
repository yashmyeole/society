"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { signOut } from "firebase/auth";
import { ref, child, get, push, set } from "firebase/database";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/Modal";
import { DatePicker } from "@/components/DatePicker";
import { HeaderActions } from "@/components/HeaderActions";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  formatDate,
  convertToDateInputFormat,
  convertFromDateInputFormat,
} from "@/lib/dateFormat";

interface Member {
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  date: number;
  receiptNumber: string;
  memberName: string;
  memberId: string;
  type: "debit" | "credit";
  paymentMethod: "cash" | "cheque" | "upi";
  amount: number;
  description?: string;
  reason?: string;
  transactionType: "income" | "expense";
  incomeType?: string;
  expenseType?: string;
  chequeNumber?: string;
  createdAt: number;
}

interface FinancialYear {
  year: string;
}

interface Society {
  name: string;
}

export default function TransactionsPage() {
  const params = useParams();
  const societyId = params.id as string;
  const yearId = params.yearId as string;
  const [society, setSociety] = useState<Society | null>(null);
  const [year, setYear] = useState<FinancialYear | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [incomeForm, setIncomeForm] = useState({
    date: "",
    receiptNumber: "",
    incomeType: "Member Contribution",
    memberId: "",
    type: "credit",
    paymentMethod: "cash",
    chequeNumber: "",
    amount: "",
  });
  const [expenseForm, setExpenseForm] = useState({
    date: "",
    expenseType: "Repair & Maintenance",
    reason: "",
    amount: "",
    paymentMethod: "cash",
    chequeNumber: "",
  });
  const { user } = useAuth();
  const router = useRouter();

  // Edit/Delete Transaction State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<
    string | null
  >(null);
  const [editForm, setEditForm] = useState({
    date: "",
    receiptNumber: "",
    memberId: "",
    memberName: "",
    incomeType: "",
    expenseType: "",
    reason: "",
    amount: "",
    paymentMethod: "cash",
    chequeNumber: "",
    type: "credit",
    transactionType: "income",
  });

  useEffect(() => {
    fetchData();
  }, [user, societyId, yearId]);

  const fetchData = async () => {
    if (!user || !societyId || !yearId) return;

    try {
      setLoading(true);

      // Fetch society
      const societyRef = ref(db, `societies/${societyId}`);
      const societySnapshot = await get(societyRef);
      if (societySnapshot.exists()) {
        setSociety(societySnapshot.val() as Society);
      }

      // Fetch financial year
      const yearRef = ref(db, `financialYears/${yearId}`);
      const yearSnapshot = await get(yearRef);
      if (yearSnapshot.exists()) {
        setYear(yearSnapshot.val() as FinancialYear);
      }

      // Fetch members
      const membersRef = ref(db, "members");
      const membersSnapshot = await get(membersRef);
      const membersData: Member[] = [];
      if (membersSnapshot.exists()) {
        const allMembers = membersSnapshot.val();
        Object.entries(allMembers).forEach(([key, value]: [string, any]) => {
          if (value.societyId === societyId && value.userId === user.uid) {
            membersData.push({
              id: key,
              name: value.name,
            });
          }
        });
      }
      setMembers(membersData);

      // Fetch transactions
      const transRef = ref(db, "transactions");
      const transSnapshot = await get(transRef);
      const transData: Transaction[] = [];
      if (transSnapshot.exists()) {
        const allTransactions = transSnapshot.val();
        Object.entries(allTransactions).forEach(
          ([key, value]: [string, any]) => {
            if (value.yearId === yearId && value.userId === user.uid) {
              transData.push({
                id: key,
                ...value,
                date: value.date || Date.now(),
                createdAt: value.createdAt || Date.now(),
              });
            }
          },
        );
      }
      // Sort by date descending
      transData.sort((a, b) => b.date - a.date);
      setTransactions(transData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !societyId || !yearId) return;

    // Only require member if income type is "Member Contribution"
    if (incomeForm.incomeType === "Member Contribution") {
      const selectedMember = members.find((m) => m.id === incomeForm.memberId);
      if (!selectedMember) {
        alert("Please select a member for Member Contribution");
        return;
      }
    }

    setSubmitting(true);
    try {
      const transRef = ref(db, "transactions");
      const newTransRef = push(transRef);

      // Parse date from dd/mm/yyyy format to timestamp
      const dateParts = incomeForm.date.split("/");
      const parsedDate = new Date(
        parseInt(dateParts[2]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[0]),
      );

      // Determine memberName and memberId based on income type
      let memberName = "";
      let memberId = "";

      if (
        incomeForm.incomeType === "Member Contribution" ||
        incomeForm.incomeType === "Conveyance Deed Contribution"
      ) {
        if (incomeForm.memberId) {
          const selectedMember = members.find(
            (m) => m.id === incomeForm.memberId,
          );
          memberName = selectedMember?.name || incomeForm.incomeType;
          memberId = incomeForm.memberId;
        } else {
          // If member not selected, use income type as name
          memberName = incomeForm.incomeType;
          memberId = "";
        }
      } else {
        // For other income types, use the income type as the name
        memberName = incomeForm.incomeType;
        memberId = "";
      }

      await set(newTransRef, {
        date: parsedDate.getTime(),
        receiptNumber: incomeForm.receiptNumber,
        memberName: memberName,
        memberId: memberId,
        incomeType: incomeForm.incomeType,
        type: incomeForm.type,
        paymentMethod: incomeForm.paymentMethod,
        chequeNumber:
          incomeForm.paymentMethod === "cheque" ? incomeForm.chequeNumber : "",
        amount: parseFloat(incomeForm.amount),
        transactionType: "income",
        societyId,
        yearId,
        userId: user.uid,
        createdAt: Date.now(),
      });

      setIncomeForm({
        date: "",
        receiptNumber: "",
        incomeType: "Member Contribution",
        memberId: "",
        type: "credit",
        paymentMethod: "cash",
        chequeNumber: "",
        amount: "",
      });
      setIsIncomeModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error adding income:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !societyId || !yearId) return;

    setSubmitting(true);
    try {
      const transRef = ref(db, "transactions");
      const newTransRef = push(transRef);

      // Parse date from dd/mm/yyyy format to timestamp
      const dateParts = expenseForm.date.split("/");
      const parsedDate = new Date(
        parseInt(dateParts[2]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[0]),
      );

      await set(newTransRef, {
        date: parsedDate.getTime(),
        expenseType: expenseForm.expenseType,
        reason: expenseForm.reason,
        amount: parseFloat(expenseForm.amount),
        paymentMethod: expenseForm.paymentMethod,
        chequeNumber:
          expenseForm.paymentMethod === "cheque"
            ? expenseForm.chequeNumber
            : "",
        transactionType: "expense",
        type: "debit",
        memberName: expenseForm.expenseType,
        memberId: "",
        societyId,
        yearId,
        userId: user.uid,
        createdAt: Date.now(),
      });

      setExpenseForm({
        date: "",
        expenseType: "Repair & Maintenance",
        reason: "",
        amount: "",
        paymentMethod: "cash",
        chequeNumber: "",
      });
      setIsExpenseModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error adding expense:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const incomeTransactions = transactions.filter(
    (t) => t.transactionType === "income",
  );
  const expenseTransactions = transactions.filter(
    (t) => t.transactionType === "expense",
  );

  const totalIncome = incomeTransactions.reduce(
    (sum, t) => sum + (t.type === "credit" ? t.amount : -t.amount),
    0,
  );
  const totalExpense = expenseTransactions.reduce(
    (sum, t) => sum + t.amount,
    0,
  );

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditForm({
      date: formatDate(transaction.date),
      receiptNumber: transaction.receiptNumber || "",
      memberId: transaction.memberId || "",
      memberName: transaction.memberName || "",
      incomeType: transaction.incomeType || "",
      expenseType: transaction.expenseType || "",
      reason: transaction.reason || "",
      amount: transaction.amount.toString(),
      paymentMethod: transaction.paymentMethod || "cash",
      chequeNumber: transaction.chequeNumber || "",
      type: transaction.type || "credit",
      transactionType: transaction.transactionType,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction || !user) return;
    setSubmitting(true);
    try {
      // Parse date from dd/mm/yyyy format to timestamp
      const dateParts = editForm.date.split("/");
      const parsedDate = new Date(
        parseInt(dateParts[2]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[0]),
      );

      const transRef = ref(db, `transactions/${editingTransaction.id}`);
      await set(transRef, {
        ...editingTransaction,
        date: parsedDate.getTime(),
        receiptNumber: editForm.receiptNumber,
        memberId: editForm.memberId,
        memberName: editForm.memberName,
        incomeType: editForm.incomeType,
        expenseType: editForm.expenseType,
        reason: editForm.reason,
        amount: parseFloat(editForm.amount),
        paymentMethod: editForm.paymentMethod,
        chequeNumber:
          editForm.paymentMethod === "cheque" ? editForm.chequeNumber : "",
        type: editForm.type,
        transactionType: editForm.transactionType,
      });
      setIsEditModalOpen(false);
      setEditingTransaction(null);
      fetchData();
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert("Failed to update transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setDeletingTransactionId(transactionId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!deletingTransactionId || !user) return;
    setSubmitting(true);
    try {
      const transRef = ref(db, `transactions/${deletingTransactionId}`);
      await set(transRef, null);
      setIsDeleteConfirmOpen(false);
      setDeletingTransactionId(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Failed to delete transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-start gap-3 flex-wrap">
              <div>
                <button
                  onClick={() => router.push(`/society/${societyId}`)}
                  className="text-blue-600 hover:text-blue-700 mb-2"
                >
                  ← Back
                </button>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {society?.name}
                </h1>
                <p className="text-gray-600">FY {year?.year}</p>
              </div>
              <HeaderActions
                onLogout={handleLogout}
                actions={[
                  {
                    id: "members",
                    label: "Members",
                    onClick: () =>
                      router.push(
                        `/society/${societyId}/year/${yearId}/members`,
                      ),
                    variant: "primary",
                  },
                ]}
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Income Section */}
              <div>
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Income
                  </h2>
                  <button
                    onClick={() => setIsIncomeModalOpen(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                  >
                    + Add Income
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                  <p className="text-gray-600">Total Income</p>
                  <p className="text-3xl font-bold text-green-600">
                    ₹{totalIncome.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  {incomeTransactions.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg shadow">
                      <p className="text-gray-500">
                        No income transactions yet
                      </p>
                    </div>
                  ) : (
                    incomeTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="bg-white rounded-lg shadow-md p-4"
                      >
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {transaction.memberName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(transaction.date)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Receipt: {transaction.receiptNumber}
                            </p>
                            <p className="text-xs text-gray-500">
                              {transaction.paymentMethod.toUpperCase()} |{" "}
                              {transaction.type}
                            </p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-start gap-2">
                            <button
                              title="Edit Transaction"
                              onClick={() => handleEditTransaction(transaction)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "18px",
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              title="Delete Transaction"
                              onClick={() =>
                                handleDeleteTransaction(transaction.id)
                              }
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "18px",
                              }}
                            >
                              🗑️
                            </button>
                            <p className="font-bold text-green-600">
                              +₹{transaction.amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Expense Section */}
              <div>
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Expenditure
                  </h2>
                  <button
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                  >
                    + Add Expense
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                  <p className="text-gray-600">Total Expenditure</p>
                  <p className="text-3xl font-bold text-red-600">
                    ₹{totalExpense.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  {expenseTransactions.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg shadow">
                      <p className="text-gray-500">
                        No expense transactions yet
                      </p>
                    </div>
                  ) : (
                    expenseTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="bg-white rounded-lg shadow-md p-4"
                      >
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {transaction.reason}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(transaction.date)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {transaction.paymentMethod.toUpperCase()}
                            </p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-start gap-2">
                            <button
                              title="Edit Transaction"
                              onClick={() => handleEditTransaction(transaction)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "18px",
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              title="Delete Transaction"
                              onClick={() =>
                                handleDeleteTransaction(transaction.id)
                              }
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "18px",
                              }}
                            >
                              🗑️
                            </button>
                            <p className="font-bold text-red-600">
                              -₹{transaction.amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Add Income Modal */}
        <Modal
          isOpen={isIncomeModalOpen}
          onClose={() => setIsIncomeModalOpen(false)}
          title="Add Income"
        >
          <form onSubmit={handleAddIncome} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Transaction *
              </label>
              <DatePicker
                required
                value={incomeForm.date}
                onChange={(ddmmyyyy) =>
                  setIncomeForm({ ...incomeForm, date: ddmmyyyy })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receipt Number *
              </label>
              <input
                type="text"
                required
                value={incomeForm.receiptNumber}
                onChange={(e) =>
                  setIncomeForm({
                    ...incomeForm,
                    receiptNumber: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., REC-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Income Type *
              </label>
              <select
                required
                value={incomeForm.incomeType}
                onChange={(e) =>
                  setIncomeForm({
                    ...incomeForm,
                    incomeType: e.target.value,
                    memberId: "", // Reset member when income type changes
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Member Contribution">Member Contribution</option>
                <option value="Conveyance Deed Contribution">
                  Conveyance Deed Contribution
                </option>
                <option value="Bank Interest">Bank Interest</option>
                <option value="Transfer Fee">Transfer Fee</option>
                <option value="Entrance Fee">Entrance Fee</option>
                <option value="Other Income">Other Income</option>
              </select>
            </div>

            {(incomeForm.incomeType === "Member Contribution" ||
              incomeForm.incomeType === "Conveyance Deed Contribution") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member{" "}
                  {incomeForm.incomeType === "Member Contribution"
                    ? "*"
                    : "(Optional)"}
                </label>
                <select
                  required
                  value={incomeForm.memberId}
                  onChange={(e) =>
                    setIncomeForm({ ...incomeForm, memberId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                value={incomeForm.type}
                onChange={(e) =>
                  setIncomeForm({
                    ...incomeForm,
                    type: e.target.value as "debit" | "credit",
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method *
              </label>
              <select
                value={incomeForm.paymentMethod}
                onChange={(e) =>
                  setIncomeForm({
                    ...incomeForm,
                    paymentMethod: e.target.value as "cash" | "cheque" | "upi",
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
              </select>
            </div>

            {incomeForm.paymentMethod === "cheque" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cheque Number *
                </label>
                <input
                  type="text"
                  required
                  value={incomeForm.chequeNumber}
                  onChange={(e) =>
                    setIncomeForm({
                      ...incomeForm,
                      chequeNumber: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={incomeForm.amount}
                onChange={(e) =>
                  setIncomeForm({ ...incomeForm, amount: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {submitting ? "Adding..." : "Add Income"}
              </button>
              <button
                type="button"
                onClick={() => setIsIncomeModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>

        {/* Add Expense Modal */}
        <Modal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          title="Add Expense"
        >
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Transaction *
              </label>
              <DatePicker
                required
                value={expenseForm.date}
                onChange={(ddmmyyyy) =>
                  setExpenseForm({ ...expenseForm, date: ddmmyyyy })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expense Type *
              </label>
              <select
                required
                value={expenseForm.expenseType}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    expenseType: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Repair & Maintenance">
                  Repair & Maintenance
                </option>
                <option value="Sweeper Salary">Sweeper Salary</option>
                <option value="Security Guard Salary">
                  Security Guard Salary
                </option>
                <option value="Pump Operator Salary">
                  Pump Operator Salary
                </option>
                <option value="Electric Bill">Electric Bill</option>
                <option value="Water Bill">Water Bill</option>
                <option value="Property Tax">Property Tax</option>
                <option value="Bank Charges">Bank Charges</option>
                <option value="Miscellaneous Expenses">
                  Miscellaneous Expenses
                </option>
                <option value="Other Expenses">Other Expenses</option>
                <option value="Conveyance">Conveyance</option>
                <option value="Conveyance Deed Expenses">
                  Conveyance Deed Expenses
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description / Notes
              </label>
              <input
                type="text"
                value={expenseForm.reason}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, reason: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Monthly sweeper salary, Repair details, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method *
              </label>
              <select
                value={expenseForm.paymentMethod}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    paymentMethod: e.target.value as "cash" | "cheque" | "upi",
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
              </select>
            </div>

            {expenseForm.paymentMethod === "cheque" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cheque Number *
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.chequeNumber}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      chequeNumber: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, amount: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {submitting ? "Adding..." : "Add Expense"}
              </button>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Transaction Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTransaction(null);
          }}
          title="Edit Transaction"
        >
          <form onSubmit={handleUpdateTransaction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <DatePicker
                required
                value={editForm.date}
                onChange={(ddmmyyyy) =>
                  setEditForm({ ...editForm, date: ddmmyyyy })
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receipt Number
              </label>
              <input
                type="text"
                value={editForm.receiptNumber}
                onChange={(e) =>
                  setEditForm({ ...editForm, receiptNumber: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {editForm.transactionType === "income" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Income Type *
                </label>
                <select
                  value={editForm.incomeType}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      incomeType: e.target.value,
                      memberId: "",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select income type</option>
                  <option value="Member Contribution">
                    Member Contribution
                  </option>
                  <option value="Conveyance Deed Contribution">
                    Conveyance Deed Contribution
                  </option>
                  <option value="Bank Interest">Bank Interest</option>
                  <option value="Transfer Fee">Transfer Fee</option>
                  <option value="Entrance Fee">Entrance Fee</option>
                  <option value="Other Income">Other Income</option>
                </select>
              </div>
            )}

            {editForm.transactionType === "expense" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Type *
                </label>
                <select
                  value={editForm.expenseType}
                  onChange={(e) =>
                    setEditForm({ ...editForm, expenseType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select expense type</option>
                  <option value="Repair & Maintenance">
                    Repair & Maintenance
                  </option>
                  <option value="Sweeper Salary">Sweeper Salary</option>
                  <option value="Security Guard Salary">
                    Security Guard Salary
                  </option>
                  <option value="Pump Operator Salary">
                    Pump Operator Salary
                  </option>
                  <option value="Electric Bill">Electric Bill</option>
                  <option value="Water Bill">Water Bill</option>
                  <option value="Property Tax">Property Tax</option>
                  <option value="Bank Charges">Bank Charges</option>
                  <option value="Miscellaneous Expenses">
                    Miscellaneous Expenses
                  </option>
                  <option value="Other Expenses">Other Expenses</option>
                  <option value="Conveyance">Conveyance</option>
                  <option value="Conveyance Deed Expenses">
                    Conveyance Deed Expenses
                  </option>
                </select>
              </div>
            )}

            {editForm.transactionType === "income" &&
              (editForm.incomeType === "Member Contribution" ||
                editForm.incomeType === "Conveyance Deed Contribution") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member{" "}
                    {editForm.incomeType === "Member Contribution"
                      ? "*"
                      : "(Optional)"}
                  </label>
                  <select
                    value={editForm.memberId}
                    onChange={(e) =>
                      setEditForm({ ...editForm, memberId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select a member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {editForm.transactionType === "income"
                  ? "Member Name / Description"
                  : "Reason / Notes"}
              </label>
              <input
                type="text"
                value={
                  editForm.transactionType === "income"
                    ? editForm.memberName
                    : editForm.reason
                }
                onChange={(e) => {
                  if (editForm.transactionType === "income") {
                    setEditForm({ ...editForm, memberName: e.target.value });
                  } else {
                    setEditForm({ ...editForm, reason: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                required
                value={editForm.amount}
                onChange={(e) =>
                  setEditForm({ ...editForm, amount: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method *
              </label>
              <select
                value={editForm.paymentMethod}
                onChange={(e) =>
                  setEditForm({ ...editForm, paymentMethod: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
              </select>
            </div>
            {editForm.paymentMethod === "cheque" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cheque Number *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.chequeNumber}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      chequeNumber: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingTransaction(null);
                }}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Transaction Modal */}
        <Modal
          isOpen={isDeleteConfirmOpen}
          onClose={() => {
            setIsDeleteConfirmOpen(false);
            setDeletingTransactionId(null);
          }}
          title="Delete Transaction"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete this transaction? This action
              cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={confirmDeleteTransaction}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                {submitting ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setDeletingTransactionId(null);
                }}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
