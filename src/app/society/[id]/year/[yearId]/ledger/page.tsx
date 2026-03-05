"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { signOut } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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

interface Member {
  id: string;
  name: string;
}

interface ExpensePerson {
  id: string;
  name: string;
}

interface FinancialYear {
  year: string;
}

interface Society {
  name: string;
  address: string;
}

export default function LedgerPage() {
  const params = useParams();
  const societyId = params.id as string;
  const yearId = params.yearId as string;
  const [society, setSociety] = useState<Society | null>(null);
  const [year, setYear] = useState<FinancialYear | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expensePersons, setExpensePersons] = useState<ExpensePerson[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<string>("");
  const [fetched, setFetched] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

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
              });
            }
          },
        );
      }
      // Sort by date ascending
      transData.sort((a, b) => a.date - b.date);
      setAllTransactions(transData);

      // Extract unique expense persons (from reason field) and members
      const expensePersonSet = new Set<string>();
      transData.forEach((trans) => {
        if (trans.transactionType === "expense" && trans.reason) {
          expensePersonSet.add(trans.reason);
        }
      });

      const uniqueExpensePersons: ExpensePerson[] = Array.from(
        expensePersonSet,
      ).map((name, index) => ({
        id: `expense-${index}`,
        name,
      }));

      setExpensePersons(uniqueExpensePersons);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchLedger = () => {
    if (!selectedPerson) {
      alert("Please select a person");
      return;
    }

    // Filter transactions based on selected person
    const filtered = allTransactions.filter((trans) => {
      if (trans.transactionType === "income") {
        return trans.memberName === selectedPerson;
      } else {
        return trans.reason === selectedPerson;
      }
    });

    setFilteredTransactions(filtered);
    setFetched(true);
  };

  const calculateTotalIncome = (): number => {
    return filteredTransactions
      .filter((t) => t.transactionType === "income")
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const calculateTotalExpense = (): number => {
    return filteredTransactions
      .filter((t) => t.transactionType === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const downloadExcel = () => {
    try {
      if (filteredTransactions.length === 0) {
        alert("No transactions to download");
        return;
      }

      // Create Excel-compatible CSV
      const totalIncome = calculateTotalIncome();
      const totalExpense = calculateTotalExpense();
      const netBalance = totalIncome - totalExpense;

      const csvHeader = [
        [`${society?.name} - LEDGER`, "", "", "", ""],
        [`FINANCIAL YEAR : ${year?.year}`, "", "", "", ""],
        [`PERSON : ${selectedPerson}`, "", "", "", ""],
        [],
        ["DATE", "DETAILS", "INCOME (₹)", "EXPENSE (₹)", "BALANCE (₹)"],
      ];

      const csvData: string[][] = [];
      let runningBalance = 0;

      // Add transaction rows
      filteredTransactions.forEach((transaction) => {
        if (transaction.transactionType === "income") {
          runningBalance += transaction.amount;
        } else {
          runningBalance -= transaction.amount;
        }

        csvData.push([
          new Date(transaction.date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }),
          transaction.transactionType === "income"
            ? `Income from ${transaction.memberName}`
            : `Expense: ${transaction.reason}`,
          transaction.transactionType === "income"
            ? transaction.amount.toFixed(2)
            : "",
          transaction.transactionType === "expense"
            ? transaction.amount.toFixed(2)
            : "",
          runningBalance.toFixed(2),
        ]);
      });

      // Add total row
      if (filteredTransactions.length > 0) {
        csvData.push([
          "",
          "TOTAL",
          totalIncome.toFixed(2),
          totalExpense.toFixed(2),
          netBalance.toFixed(2),
        ]);
      }

      // Combine header and data
      const allRows = [...csvHeader, ...csvData];

      // Convert to CSV string
      const csvContent = allRows
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${society?.name}-${selectedPerson}-Ledger-${year?.year}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download Error:", error);
      alert(`Error: ${(error as Error).message}`);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <p className="text-lg font-semibold text-gray-700">Loading...</p>
        </div>
      </ProtectedRoute>
    );
  }

  const allPersons = [
    ...members.map((m) => ({ id: m.id, name: m.name, type: "member" })),
    ...expensePersons.map((ep) => ({
      id: ep.id,
      name: ep.name,
      type: "expense",
    })),
  ];

  // Remove duplicates
  const uniquePersons = Array.from(
    new Map(allPersons.map((p) => [p.name, p])).values(),
  );

  const totalIncome = calculateTotalIncome();
  const totalExpense = calculateTotalExpense();
  const netBalance = totalIncome - totalExpense;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-blue-600 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Ledger Report</h1>
            <div className="flex gap-4">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-blue-500 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                ← Back
              </button>
              <button
                onClick={async () => {
                  await signOut(auth);
                  router.push("/");
                }}
                className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        <main className="container mx-auto p-6 max-w-5xl">
          {/* Header Info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {society?.name}
            </h2>
            <p className="text-gray-600 mb-1">Address: {society?.address}</p>
            <p className="text-gray-600">Financial Year: {year?.year}</p>
          </div>

          {/* Filter and Fetch Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Select Person
            </h3>
            <div className="flex flex-col gap-4">
              <select
                value={selectedPerson}
                onChange={(e) => setSelectedPerson(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a person --</option>
                {uniquePersons.map((person) => (
                  <option key={person.id} value={person.name}>
                    {person.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleFetchLedger}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
              >
                Fetch Ledger
              </button>
            </div>
          </div>

          {/* Ledger Results */}
          {fetched && (
            <>
              {filteredTransactions.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <p className="text-yellow-800 text-center">
                    No transactions found for {selectedPerson}
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Total Income
                      </h3>
                      <p className="text-3xl font-bold text-green-600">
                        ₹{totalIncome.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Total Expense
                      </h3>
                      <p className="text-3xl font-bold text-red-600">
                        ₹{totalExpense.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Net Balance
                      </h3>
                      <p
                        className={`text-3xl font-bold ${
                          netBalance >= 0 ? "text-blue-600" : "text-red-600"
                        }`}
                      >
                        ₹{netBalance.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Ledger Table */}
                  <div
                    id="ledger-content"
                    className="bg-white rounded-lg shadow-md overflow-hidden mb-6"
                  >
                    <div className="bg-gray-50 border-b border-gray-200 p-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        Ledger - {selectedPerson}
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-100 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                              Details
                            </th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                              Income (₹)
                            </th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                              Expense (₹)
                            </th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                              Balance (₹)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTransactions.map((transaction, index) => {
                            let balance = 0;
                            for (let i = 0; i <= index; i++) {
                              if (
                                filteredTransactions[i].transactionType ===
                                "income"
                              ) {
                                balance += filteredTransactions[i].amount;
                              } else {
                                balance -= filteredTransactions[i].amount;
                              }
                            }

                            return (
                              <tr
                                key={transaction.id}
                                className="border-b border-gray-200 hover:bg-gray-50"
                              >
                                <td className="px-6 py-3 text-sm text-gray-900">
                                  {new Date(
                                    transaction.date,
                                  ).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-900">
                                  {transaction.transactionType === "income"
                                    ? `Income from ${transaction.memberName}`
                                    : `Expense: ${transaction.reason}`}
                                </td>
                                <td className="px-6 py-3 text-sm text-right font-medium">
                                  {transaction.transactionType === "income" ? (
                                    <span className="text-green-600">
                                      ₹{transaction.amount.toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-3 text-sm text-right font-medium">
                                  {transaction.transactionType === "expense" ? (
                                    <span className="text-red-600">
                                      ₹{transaction.amount.toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-3 text-sm text-right font-bold text-blue-600">
                                  ₹{balance.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-bold">
                          <tr>
                            <td colSpan={2} className="px-6 py-3 text-sm">
                              TOTAL
                            </td>
                            <td className="px-6 py-3 text-sm text-right text-green-600">
                              ₹{totalIncome.toFixed(2)}
                            </td>
                            <td className="px-6 py-3 text-sm text-right text-red-600">
                              ₹{totalExpense.toFixed(2)}
                            </td>
                            <td className="px-6 py-3 text-sm text-right text-blue-600">
                              ₹{netBalance.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Download Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={downloadExcel}
                      className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold transition-colors flex items-center gap-2"
                    >
                      📊 Download Excel
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
