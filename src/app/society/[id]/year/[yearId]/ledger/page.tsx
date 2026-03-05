"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { signOut } from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ExcelJS, { Alignment } from "exceljs";
import { formatDate } from "@/lib/dateFormat";
import { saveAs } from "file-saver";

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
  chequeNumber?: string;
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

interface PersonOpeningBalance {
  personName: string;
  openingBalance: number;
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
  const [personOpeningBalances, setPersonOpeningBalances] = useState<
    Map<string, number>
  >(new Map());
  const [editingOpeningBalance, setEditingOpeningBalance] = useState<
    string | null
  >(null);
  const [tempOpeningBalance, setTempOpeningBalance] = useState<string>("");
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

      // Fetch opening balances for this year
      const openingBalancesRef = ref(
        db,
        `personOpeningBalances/${societyId}/${yearId}`,
      );
      const openingBalancesSnapshot = await get(openingBalancesRef);
      const balancesMap = new Map<string, number>();
      if (openingBalancesSnapshot.exists()) {
        const balancesData = openingBalancesSnapshot.val();
        Object.entries(balancesData).forEach(
          ([personName, balance]: [string, any]) => {
            balancesMap.set(personName, balance || 0);
          },
        );
      }
      setPersonOpeningBalances(balancesMap);
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

  const getOpeningBalance = (personName: string): number => {
    return personOpeningBalances.get(personName) || 0;
  };

  const handleEditOpeningBalance = (personName: string) => {
    setEditingOpeningBalance(personName);
    setTempOpeningBalance(
      (personOpeningBalances.get(personName) || 0).toString(),
    );
  };

  const handleSaveOpeningBalance = async () => {
    if (editingOpeningBalance === null) return;

    try {
      const balanceValue = parseFloat(tempOpeningBalance);
      if (isNaN(balanceValue)) {
        alert("Please enter a valid number");
        return;
      }

      const updatedBalances = new Map(personOpeningBalances);
      updatedBalances.set(editingOpeningBalance, balanceValue);
      setPersonOpeningBalances(updatedBalances);

      // Save to Firebase
      const balanceRef = ref(
        db,
        `personOpeningBalances/${societyId}/${yearId}/${editingOpeningBalance}`,
      );
      await set(balanceRef, balanceValue);

      setEditingOpeningBalance(null);
      setTempOpeningBalance("");
    } catch (error) {
      console.error("Error saving opening balance:", error);
      alert("Error saving opening balance");
    }
  };

  const downloadAllMembersExcel = async () => {
    try {
      if (allTransactions.length === 0) {
        alert("No transactions to download");
        return;
      }

      const workbook = new ExcelJS.Workbook();

      const center: Partial<Alignment> = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      const verticalBorder = {
        top: { style: "thin" as const },
        left: { style: "thin" as const },
        bottom: { style: "thin" as const },
        right: { style: "thin" as const },
      };
      const headerBorder = {
        top: { style: "thin" as const, color: { argb: "FF000000" } },
        left: { style: "thin" as const, color: { argb: "FF000000" } },
        bottom: { style: "thin" as const, color: { argb: "FF000000" } },
        right: { style: "thin" as const, color: { argb: "FF000000" } },
      };

      // Get all unique members (from income transactions) and expense persons
      const allPeople = new Set<string>();
      allTransactions.forEach((trans) => {
        if (trans.transactionType === "income") {
          allPeople.add(trans.memberName);
        } else {
          allPeople.add(trans.reason || "");
        }
      });

      const peopleArray = Array.from(allPeople)
        .filter((p) => p !== "")
        .sort();

      // Create a sheet for each person
      peopleArray.forEach((personName) => {
        const sheet = workbook.addWorksheet(personName.substring(0, 31)); // Excel has 31 char limit

        sheet.columns = [
          { width: 12 },
          { width: 12 },
          { width: 30 },
          { width: 12 },
          { width: 12 },
          { width: 12 },
        ];

        const titleRow = sheet.addRow([`${society?.name}`]);
        titleRow.getCell(1).font = {
          bold: true,
          size: 16,
          color: { argb: "FF1F4E78" },
        };
        titleRow.getCell(1).alignment = center;
        sheet.mergeCells("A1:F1");

        const subtitleRow = sheet.addRow([`LEDGER - ${personName}`]);
        subtitleRow.getCell(1).font = {
          bold: true,
          size: 12,
          color: { argb: "FF1F4E78" },
        };
        subtitleRow.getCell(1).alignment = center;
        sheet.mergeCells("A2:F2");

        const yearRow = sheet.addRow([`FINANCIAL YEAR: ${year?.year}`]);
        yearRow.getCell(1).font = {
          bold: true,
          size: 12,
          color: { argb: "FF1F4E78" },
        };
        yearRow.getCell(1).alignment = center;
        sheet.mergeCells("A3:F3");

        sheet.addRow([]);

        const headerRow = sheet.addRow([
          "Date",
          "Receipt No",
          "Details",
          "Income (₹)",
          "Expense (₹)",
          "Balance (₹)",
        ]);

        headerRow.eachCell((c) => {
          c.border = headerBorder;
          c.font = { bold: true };
          c.alignment = center;
          c.fill = {
            type: "pattern" as const,
            pattern: "solid",
            fgColor: { argb: "FF366092" },
          };
          c.font = { bold: true, color: { argb: "FFFFFFFF" } };
        });

        // Filter transactions for this person
        const personTransactions = allTransactions.filter((trans) => {
          if (trans.transactionType === "income") {
            return trans.memberName === personName;
          } else {
            return trans.reason === personName;
          }
        });

        const openingBalance = personOpeningBalances.get(personName) || 0;
        let runningBalance = openingBalance;
        const totalIncome = personTransactions
          .filter((t) => t.transactionType === "income")
          .reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = personTransactions
          .filter((t) => t.transactionType === "expense")
          .reduce((sum, t) => sum + t.amount, 0);

        personTransactions.forEach((transaction) => {
          if (transaction.transactionType === "income") {
            runningBalance += transaction.amount;
          } else {
            runningBalance -= transaction.amount;
          }

          let details =
            transaction.transactionType === "income"
              ? `Income from ${transaction.memberName}`
              : `Expense: ${transaction.reason}`;

          if (
            transaction.paymentMethod === "cheque" &&
            transaction.chequeNumber
          ) {
            details += ` (Cheque: ${transaction.chequeNumber})`;
          }

          const row = sheet.addRow([
            formatDate(transaction.date),
            transaction.receiptNumber || "",
            details,
            transaction.transactionType === "income" ? transaction.amount : "",
            transaction.transactionType === "expense" ? transaction.amount : "",
            runningBalance,
          ]);

          row.getCell(4).numFmt = "0.00";
          row.getCell(5).numFmt = "0.00";
          row.getCell(6).numFmt = "0.00";
          row.eachCell((c) => (c.border = verticalBorder));
        });

        const totalRow = sheet.addRow([
          "",
          "",
          "TOTAL",
          totalIncome,
          totalExpense,
          openingBalance + totalIncome - totalExpense,
        ]);

        totalRow.getCell(4).numFmt = "0.00";
        totalRow.getCell(5).numFmt = "0.00";
        totalRow.getCell(6).numFmt = "0.00";
        totalRow.eachCell((c) => {
          c.border = verticalBorder;
          c.font = { bold: true };
          c.fill = {
            type: "pattern" as const,
            pattern: "solid",
            fgColor: { argb: "FFE7E6E6" },
          };
        });
      });

      await workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${society?.name}-All-Members-Ledger-${year?.year}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error("Download Error:", error);
      alert(`Error: ${(error as Error).message}`);
    }
  };

  const downloadExcel = async () => {
    try {
      if (filteredTransactions.length === 0) {
        alert("No transactions to download");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Ledger");

      const center: Partial<Alignment> = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      const verticalBorder = {
        top: { style: "thin" as const },
        left: { style: "thin" as const },
        bottom: { style: "thin" as const },
        right: { style: "thin" as const },
      };
      const headerBorder = {
        top: { style: "thin" as const, color: { argb: "FF000000" } },
        left: { style: "thin" as const, color: { argb: "FF000000" } },
        bottom: { style: "thin" as const, color: { argb: "FF000000" } },
        right: { style: "thin" as const, color: { argb: "FF000000" } },
      };

      sheet.columns = [
        { width: 12 },
        { width: 12 },
        { width: 30 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
      ];

      const titleRow = sheet.addRow([`${society?.name}`]);
      titleRow.getCell(1).font = {
        bold: true,
        size: 16,
        color: { argb: "FF1F4E78" },
      };
      titleRow.getCell(1).alignment = center;
      sheet.mergeCells("A1:F1");

      const subtitleRow = sheet.addRow([`LEDGER - ${selectedPerson}`]);
      subtitleRow.getCell(1).font = {
        bold: true,
        size: 12,
        color: { argb: "FF1F4E78" },
      };
      subtitleRow.getCell(1).alignment = center;
      sheet.mergeCells("A2:F2");

      const yearRow = sheet.addRow([`FINANCIAL YEAR: ${year?.year}`]);
      yearRow.getCell(1).font = {
        bold: true,
        size: 12,
        color: { argb: "FF1F4E78" },
      };
      yearRow.getCell(1).alignment = center;
      sheet.mergeCells("A3:F3");

      sheet.addRow([]);

      const headerRow = sheet.addRow([
        "Date",
        "Receipt No",
        "Details",
        "Income (₹)",
        "Expense (₹)",
        "Balance (₹)",
      ]);

      headerRow.eachCell((c) => {
        c.border = headerBorder;
        c.font = { bold: true };
        c.alignment = center;
        c.fill = {
          type: "pattern" as const,
          pattern: "solid",
          fgColor: { argb: "FF366092" },
        };
        c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      });

      let runningBalance = getOpeningBalance(selectedPerson);
      const totalIncome = calculateTotalIncome();
      const totalExpense = calculateTotalExpense();

      filteredTransactions.forEach((transaction) => {
        if (transaction.transactionType === "income") {
          runningBalance += transaction.amount;
        } else {
          runningBalance -= transaction.amount;
        }

        let details =
          transaction.transactionType === "income"
            ? `Income from ${transaction.memberName}`
            : `Expense: ${transaction.reason}`;

        if (
          transaction.paymentMethod === "cheque" &&
          transaction.chequeNumber
        ) {
          details += ` (Cheque: ${transaction.chequeNumber})`;
        }

        const row = sheet.addRow([
          formatDate(transaction.date),
          transaction.receiptNumber || "",
          details,
          transaction.transactionType === "income" ? transaction.amount : "",
          transaction.transactionType === "expense" ? transaction.amount : "",
          runningBalance,
        ]);

        row.getCell(4).numFmt = "0.00";
        row.getCell(5).numFmt = "0.00";
        row.getCell(6).numFmt = "0.00";
        row.eachCell((c) => (c.border = verticalBorder));
      });

      const totalRow = sheet.addRow([
        "",
        "",
        "TOTAL",
        totalIncome,
        totalExpense,
        getOpeningBalance(selectedPerson) + totalIncome - totalExpense,
      ]);

      totalRow.getCell(4).numFmt = "0.00";
      totalRow.getCell(5).numFmt = "0.00";
      totalRow.getCell(6).numFmt = "0.00";
      totalRow.eachCell((c) => {
        c.border = verticalBorder;
        c.font = { bold: true };
        c.fill = {
          type: "pattern" as const,
          pattern: "solid",
          fgColor: { argb: "FFE7E6E6" },
        };
      });

      await workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${society?.name}-${selectedPerson}-Ledger-${year?.year}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
      });
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
  const netBalance =
    getOpeningBalance(selectedPerson) + totalIncome - totalExpense;

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

              {/* Opening Balance Section */}
              {selectedPerson && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Opening Balance for {selectedPerson}
                      </p>
                      {editingOpeningBalance === selectedPerson ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={tempOpeningBalance}
                            onChange={(e) =>
                              setTempOpeningBalance(e.target.value)
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter amount"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveOpeningBalance}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium text-sm transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingOpeningBalance(null)}
                            className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 font-medium text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold text-blue-600">
                            ₹{getOpeningBalance(selectedPerson).toFixed(2)}
                          </p>
                          <button
                            onClick={() =>
                              handleEditOpeningBalance(selectedPerson)
                            }
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-gray-600 mt-2">
                        {getOpeningBalance(selectedPerson) > 0
                          ? "Positive: Amount owed to member"
                          : getOpeningBalance(selectedPerson) < 0
                            ? "Negative: Member owes amount"
                            : "Zero: No opening balance"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={downloadAllMembersExcel}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium transition-colors"
              >
                📋 Download All Members Ledger
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Opening Balance
                      </h3>
                      <p
                        className={`text-3xl font-bold ${
                          getOpeningBalance(selectedPerson) > 0
                            ? "text-purple-600"
                            : getOpeningBalance(selectedPerson) < 0
                              ? "text-orange-600"
                              : "text-gray-600"
                        }`}
                      >
                        ₹{getOpeningBalance(selectedPerson).toFixed(2)}
                      </p>
                    </div>
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
                                  {formatDate(transaction.date)}
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
                  <div className="flex justify-center gap-4">
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
