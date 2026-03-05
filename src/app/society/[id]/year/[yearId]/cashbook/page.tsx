"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { signOut } from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

interface FinancialYear {
  year: string;
  openingBalance?: number;
  closingBalance?: number;
}

interface Society {
  name: string;
  address: string;
}

export default function CashbookPage() {
  const params = useParams();
  const societyId = params.id as string;
  const yearId = params.yearId as string;
  const [society, setSociety] = useState<Society | null>(null);
  const [year, setYear] = useState<FinancialYear | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [closingBalance, setClosingBalance] = useState<number>(0);
  const [editingOpening, setEditingOpening] = useState(false);
  const [editingClosing, setEditingClosing] = useState(false);
  const [savingBalance, setSavingBalance] = useState(false);
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
        const yearData = yearSnapshot.val() as FinancialYear;
        setYear(yearData);
        setOpeningBalance(yearData.openingBalance || 0);
        setClosingBalance(yearData.closingBalance || 0);
      }

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
      // Sort by date ascending for cashbook
      transData.sort((a, b) => a.date - b.date);
      setTransactions(transData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBalance = async (type: "opening" | "closing") => {
    if (!user || !yearId) return;

    setSavingBalance(true);
    try {
      const yearRef = ref(db, `financialYears/${yearId}`);
      const yearSnapshot = await get(yearRef);
      const yearData = yearSnapshot.val();

      const updatedData = {
        ...yearData,
        [type === "opening" ? "openingBalance" : "closingBalance"]:
          type === "opening" ? openingBalance : closingBalance,
      };

      await set(yearRef, updatedData);
      setYear(updatedData);
      alert(
        `${type === "opening" ? "Opening" : "Closing"} balance saved successfully!`,
      );

      if (type === "opening") {
        setEditingOpening(false);
      } else {
        setEditingClosing(false);
      }
    } catch (error) {
      console.error("Error saving balance:", error);
      alert("Failed to save balance. Please try again.");
    } finally {
      setSavingBalance(false);
    }
  };

  const calculateRunningBalance = (index: number): number => {
    let balance = openingBalance;
    for (let i = 0; i <= index; i++) {
      const trans = transactions[i];
      if (trans.transactionType === "income") {
        balance += trans.amount;
      } else {
        balance -= trans.amount;
      }
    }
    return balance;
  };

  const totalIncome = transactions
    .filter((t) => t.transactionType === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.transactionType === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const finalBalance = openingBalance + totalIncome - totalExpense;

  const handleDownloadPDF = async () => {
    const element = document.getElementById("cashbook-content");
    if (!element) {
      alert("Cashbook content not found. Please refresh and try again.");
      return;
    }

    try {
      // Show loading state
      alert("Generating PDF... Please wait.");

      // Simple approach: capture the element directly
      const canvas = await html2canvas(element, {
        allowTaint: true,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate dimensions
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10; // Top margin

      // Add first page
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20; // Account for margins

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;
      }

      // Generate filename
      const filename = `${society?.name || "Cashbook"}-${year?.year || "Report"}.pdf`;
      pdf.save(filename);

      alert("✅ PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert(
        `Error: ${(error as Error).message}\n\nTry refreshing the page and try again.`,
      );
    }
  };

  const handleDownloadCSV = () => {
    try {
      // Create CSV header
      const csvHeader = [
        [`${society?.name} - CASH BOOK`, "", "", "", "", ""],
        [`FINANCIAL YEAR : ${year?.year}`, "", "", "", "", ""],
        [],
        ["DATE", "RECEIPT NO", "DETAILS", "DEBIT", "CREDIT", "BALANCE"],
      ];

      // Create data rows
      const csvData: string[][] = [];

      // Add opening balance row (NO DATE)
      csvData.push([
        "",
        "",
        "OPENING BALANCE",
        "",
        openingBalance.toFixed(2),
        openingBalance.toFixed(2),
      ]);

      // Add transaction rows
      transactions.forEach((transaction, index) => {
        const runningBalance = calculateRunningBalance(index);
        csvData.push([
          new Date(transaction.date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }),
          transaction.receiptNumber || "",
          transaction.transactionType === "income"
            ? transaction.memberName
            : transaction.reason || "",
          transaction.transactionType === "expense"
            ? transaction.amount.toFixed(2)
            : "",
          transaction.transactionType === "income"
            ? transaction.amount.toFixed(2)
            : "",
          runningBalance.toFixed(2),
        ]);
      });

      // Add total row
      if (transactions.length > 0) {
        csvData.push([
          "",
          "",
          "TOTAL",
          totalExpense.toFixed(2),
          totalIncome.toFixed(2),
          finalBalance.toFixed(2),
        ]);

        // Add closing balance row
        csvData.push([
          "",
          "",
          "CLOSING BALANCE (CALCULATED)",
          "",
          "",
          finalBalance.toFixed(2),
        ]);
      }

      // Combine header and data
      const allRows = [...csvHeader, ...csvData];

      // Convert to CSV string
      const csvContent = allRows
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      const filename = `${society?.name || "Cashbook"}-${year?.year || "Report"}.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert("✅ Cashbook CSV downloaded successfully!");
    } catch (error) {
      console.error("CSV Generation Error:", error);
      alert(`Error: ${(error as Error).message}\n\nTry again later.`);
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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-start">
            <div>
              <button
                onClick={() =>
                  router.push(
                    `/society/${societyId}/year/${yearId}/transactions`,
                  )
                }
                className="text-blue-600 hover:text-blue-700 mb-2"
              >
                ← Back to Transactions
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {society?.name} - Cashbook FY {year?.year}
              </h1>
              <p className="text-gray-600">{society?.address}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Balance Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Opening Balance */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Opening Balance
              </h2>
              {editingOpening ? (
                <div className="space-y-4">
                  <input
                    type="number"
                    value={openingBalance}
                    onChange={(e) =>
                      setOpeningBalance(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter opening balance"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveBalance("opening")}
                      disabled={savingBalance}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                    >
                      {savingBalance ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingOpening(false);
                        setOpeningBalance(year?.openingBalance || 0);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-3xl font-bold text-green-600">
                    ₹{openingBalance.toFixed(2)}
                  </p>
                  <button
                    onClick={() => setEditingOpening(true)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Closing Balance */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Closing Balance (Auto-Calculated)
              </h2>
              <div className="space-y-4">
                <p className="text-3xl font-bold text-blue-600">
                  ₹{finalBalance.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  Calculated as: Opening Balance + Income - Expenses
                </p>
                <p className="text-sm text-gray-500">
                  = ₹{openingBalance.toFixed(2)} + ₹{totalIncome.toFixed(2)} - ₹
                  {totalExpense.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Cashbook Table */}
          <div
            id="cashbook-content"
            style={{
              pageBreakInside: "avoid",
              color: "#000000",
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "24px 16px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#000000",
                  margin: "0 0 8px 0",
                }}
              >
                Cash Book - {society?.name}
              </h2>
              <p
                style={{
                  color: "#666666",
                  fontSize: "14px",
                  margin: "8px 0 0 0",
                }}
              >
                FY {year?.year}
              </p>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  fontSize: "14px",
                  borderCollapse: "collapse",
                }}
              >
                <thead style={{ backgroundColor: "#f3f4f6" }}>
                  <tr>
                    <th
                      style={{
                        borderBottom: "2px solid #d1d5db",
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#000000",
                      }}
                    >
                      Date
                    </th>
                    <th
                      style={{
                        borderBottom: "2px solid #d1d5db",
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#000000",
                      }}
                    >
                      Receipt No
                    </th>
                    <th
                      style={{
                        borderBottom: "2px solid #d1d5db",
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#000000",
                      }}
                    >
                      Details
                    </th>
                    <th
                      style={{
                        borderBottom: "2px solid #d1d5db",
                        padding: "12px",
                        textAlign: "center",
                        fontWeight: "600",
                        color: "#000000",
                      }}
                    >
                      Debit (₹)
                    </th>
                    <th
                      style={{
                        borderBottom: "2px solid #d1d5db",
                        padding: "12px",
                        textAlign: "center",
                        fontWeight: "600",
                        color: "#000000",
                      }}
                    >
                      Credit (₹)
                    </th>
                    <th
                      style={{
                        borderBottom: "2px solid #d1d5db",
                        padding: "12px",
                        textAlign: "center",
                        fontWeight: "600",
                        color: "#000000",
                      }}
                    >
                      Balance (₹)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening Balance Row */}
                  <tr
                    style={{
                      backgroundColor: "#eff6ff",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <td
                      colSpan={5}
                      style={{
                        padding: "12px",
                        fontWeight: "600",
                        color: "#000000",
                      }}
                    >
                      Opening Balance
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontWeight: "600",
                        color: "#2563eb",
                      }}
                    >
                      ₹{openingBalance.toFixed(2)}
                    </td>
                  </tr>

                  {/* Transaction Rows */}
                  {transactions.map((transaction, index) => (
                    <tr
                      key={transaction.id}
                      style={{ borderBottom: "1px solid #e5e7eb" }}
                    >
                      <td style={{ padding: "12px", color: "#000000" }}>
                        {new Date(transaction.date).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          },
                        )}
                      </td>
                      <td style={{ padding: "12px", color: "#000000" }}>
                        {transaction.receiptNumber || "-"}
                      </td>
                      <td style={{ padding: "12px", color: "#000000" }}>
                        {transaction.transactionType === "income"
                          ? transaction.memberName
                          : transaction.reason}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "600",
                          color: "#dc2626",
                        }}
                      >
                        {transaction.transactionType === "expense"
                          ? `₹${transaction.amount.toFixed(2)}`
                          : "-"}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "600",
                          color: "#16a34a",
                        }}
                      >
                        {transaction.transactionType === "income"
                          ? `₹${transaction.amount.toFixed(2)}`
                          : "-"}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "600",
                          color: "#2563eb",
                        }}
                      >
                        ₹{calculateRunningBalance(index).toFixed(2)}
                      </td>
                    </tr>
                  ))}

                  {/* Total Rows */}
                  {transactions.length > 0 && (
                    <>
                      <tr
                        style={{
                          backgroundColor: "#f3f4f6",
                          borderBottom: "2px solid #9ca3af",
                          fontWeight: "700",
                        }}
                      >
                        <td
                          colSpan={3}
                          style={{
                            padding: "12px",
                            color: "#000000",
                            fontWeight: "700",
                          }}
                        >
                          Total
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontWeight: "700",
                            color: "#dc2626",
                          }}
                        >
                          ₹{totalExpense.toFixed(2)}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontWeight: "700",
                            color: "#16a34a",
                          }}
                        >
                          ₹{totalIncome.toFixed(2)}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontWeight: "700",
                            color: "#2563eb",
                          }}
                        >
                          ₹{finalBalance.toFixed(2)}
                        </td>
                      </tr>
                    </>
                  )}

                  {/* Closing Balance Row */}
                  {transactions.length > 0 && (
                    <tr
                      style={{
                        backgroundColor: "#eff6ff",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <td
                        colSpan={5}
                        style={{
                          padding: "12px",
                          fontWeight: "600",
                          color: "#000000",
                        }}
                      >
                        Closing Balance (Calculated)
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "700",
                          fontSize: "18px",
                          color: "#2563eb",
                        }}
                      >
                        ₹{finalBalance.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {/* Empty State */}
                  {transactions.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: "32px",
                          textAlign: "center",
                          color: "#6b7280",
                        }}
                      >
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Section */}
            <div
              style={{
                backgroundColor: "#f9fafb",
                borderTop: "1px solid #e5e7eb",
                padding: "16px 24px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "16px",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#4b5563",
                    margin: "0 0 8px 0",
                  }}
                >
                  Opening Balance
                </p>
                <p
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#000000",
                    margin: "0",
                  }}
                >
                  ₹{openingBalance.toFixed(2)}
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#4b5563",
                    margin: "0 0 8px 0",
                  }}
                >
                  Total Income
                </p>
                <p
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#16a34a",
                    margin: "0",
                  }}
                >
                  ₹{totalIncome.toFixed(2)}
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#4b5563",
                    margin: "0 0 8px 0",
                  }}
                >
                  Total Expense
                </p>
                <p
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#dc2626",
                    margin: "0",
                  }}
                >
                  ₹{totalExpense.toFixed(2)}
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#4b5563",
                    margin: "0 0 8px 0",
                  }}
                >
                  Final Balance
                </p>
                <p
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#2563eb",
                    margin: "0",
                  }}
                >
                  ₹{finalBalance.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <div
            style={{
              marginTop: "32px",
              display: "flex",
              justifyContent: "center",
              gap: "16px",
            }}
          >
            <button
              onClick={handleDownloadPDF}
              style={{
                padding: "12px 32px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "16px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor =
                  "#1d4ed8";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor =
                  "#2563eb";
              }}
            >
              📄 Download PDF
            </button>
            <button
              onClick={handleDownloadCSV}
              style={{
                padding: "12px 32px",
                backgroundColor: "#16a34a",
                color: "#ffffff",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "16px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor =
                  "#15803d";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor =
                  "#16a34a";
              }}
            >
              � Download CSV
            </button>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
