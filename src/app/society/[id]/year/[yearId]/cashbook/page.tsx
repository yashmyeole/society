"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { signOut } from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { HeaderActions } from "@/components/HeaderActions";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import ExcelJS, { Alignment, Style, Borders } from "exceljs";
import { saveAs } from "file-saver";
import { formatDate } from "@/lib/dateFormat";

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

interface FinancialYear {
  year: string;
  bankOpeningBalance?: number;
  cashOpeningBalance?: number;
  bankClosingBalance?: number;
  cashClosingBalance?: number;
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
  const [bankOpeningBalance, setBankOpeningBalance] = useState<number>(0);
  const [cashOpeningBalance, setCashOpeningBalance] = useState<number>(0);
  const [bankClosingBalance, setBankClosingBalance] = useState<number>(0);
  const [cashClosingBalance, setCashClosingBalance] = useState<number>(0);
  const [editingBankOpening, setEditingBankOpening] = useState(false);
  const [editingCashOpening, setEditingCashOpening] = useState(false);
  const [savingBalance, setSavingBalance] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, [user, societyId, yearId]);

  // Recalculate closing balances when opening balances or transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      const bankTrans = transactions.filter(
        (t) => t.paymentMethod === "bank" || t.paymentMethod === "cheque",
      );
      const cashTrans = transactions.filter((t) => t.paymentMethod === "cash");

      let bankBalance = bankOpeningBalance;
      let cashBalance = cashOpeningBalance;

      bankTrans.forEach((trans) => {
        if (trans.transactionType === "income") {
          bankBalance += trans.amount;
        } else {
          bankBalance -= trans.amount;
        }
      });

      cashTrans.forEach((trans) => {
        if (trans.transactionType === "income") {
          cashBalance += trans.amount;
        } else {
          cashBalance -= trans.amount;
        }
      });

      setBankClosingBalance(bankBalance);
      setCashClosingBalance(cashBalance);
    }
  }, [bankOpeningBalance, cashOpeningBalance, transactions]);

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
      let yearData: any = null;
      if (yearSnapshot.exists()) {
        yearData = yearSnapshot.val() as FinancialYear;
        setYear(yearData);
        setBankOpeningBalance(yearData.bankOpeningBalance || 0);
        setCashOpeningBalance(yearData.cashOpeningBalance || 0);
        setBankClosingBalance(yearData.bankClosingBalance || 0);
        setCashClosingBalance(yearData.cashClosingBalance || 0);
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
      // Sort by date ascending
      transData.sort((a, b) => a.date - b.date);
      setTransactions(transData);

      // Calculate closing balances
      calculateAndSaveClosingBalances(transData, yearData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAndSaveClosingBalances = async (
    transData: Transaction[],
    yearData: any,
  ) => {
    const bankTrans = transData.filter(
      (t) => t.paymentMethod === "bank" || t.paymentMethod === "cheque",
    );
    const cashTrans = transData.filter((t) => t.paymentMethod === "cash");

    const bankOpen = yearData?.bankOpeningBalance || 0;
    const cashOpen = yearData?.cashOpeningBalance || 0;

    let bankBalance = bankOpen;
    let cashBalance = cashOpen;

    bankTrans.forEach((trans) => {
      if (trans.transactionType === "income") {
        bankBalance += trans.amount;
      } else {
        bankBalance -= trans.amount;
      }
    });

    cashTrans.forEach((trans) => {
      if (trans.transactionType === "income") {
        cashBalance += trans.amount;
      } else {
        cashBalance -= trans.amount;
      }
    });

    setBankClosingBalance(bankBalance);
    setCashClosingBalance(cashBalance);
  };

  const handleSaveBalance = async (type: "bankOpening" | "cashOpening") => {
    if (!user || !yearId) return;

    setSavingBalance(true);
    try {
      const yearRef = ref(db, `financialYears/${yearId}`);
      const yearSnapshot = await get(yearRef);
      const yearData = yearSnapshot.val();

      const fieldName =
        type === "bankOpening" ? "bankOpeningBalance" : "cashOpeningBalance";
      const fieldValue =
        type === "bankOpening" ? bankOpeningBalance : cashOpeningBalance;

      const updatedData = {
        ...yearData,
        [fieldName]: fieldValue,
      };

      await set(yearRef, updatedData);
      setYear(updatedData);
      alert(
        `${type === "bankOpening" ? "Bank" : "Cash"} Opening Balance saved!`,
      );

      if (type === "bankOpening") {
        setEditingBankOpening(false);
      } else {
        setEditingCashOpening(false);
      }
    } catch (error) {
      console.error("Error saving balance:", error);
      alert("Failed to save balance.");
    } finally {
      setSavingBalance(false);
    }
  };

  const getBankTransactions = () =>
    transactions.filter(
      (t) => t.paymentMethod === "bank" || t.paymentMethod === "cheque",
    );

  const getCashTransactions = () =>
    transactions.filter((t) => t.paymentMethod === "cash");

  const calculateBankBalance = (index: number): number => {
    const bankTrans = getBankTransactions();
    let balance = bankOpeningBalance;
    for (let i = 0; i <= index; i++) {
      const trans = bankTrans[i];
      if (trans.transactionType === "income") {
        balance += trans.amount;
      } else {
        balance -= trans.amount;
      }
    }
    return balance;
  };

  const calculateCashBalance = (index: number): number => {
    const cashTrans = getCashTransactions();
    let balance = cashOpeningBalance;
    for (let i = 0; i <= index; i++) {
      const trans = cashTrans[i];
      if (trans.transactionType === "income") {
        balance += trans.amount;
      } else {
        balance -= trans.amount;
      }
    }
    return balance;
  };

  const getBankTotals = () => {
    const bankTrans = getBankTransactions();
    const income = bankTrans
      .filter((t) => t.transactionType === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = bankTrans
      .filter((t) => t.transactionType === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense };
  };

  const getCashTotals = () => {
    const cashTrans = getCashTransactions();
    const income = cashTrans
      .filter((t) => t.transactionType === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = cashTrans
      .filter((t) => t.transactionType === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense };
  };

  ("file-saver");

  const handleDownloadXLSX = async () => {
    try {
      const bankTrans = getBankTransactions();
      const cashTrans = getCashTransactions();
      const bankTotals = getBankTotals();
      const cashTotals = getCashTotals();

      const workbook = new ExcelJS.Workbook();

      const center: Partial<Alignment> = {
        horizontal: "center",
        vertical: "middle",
      };

      const titleStyle: Partial<Style> = {
        font: { bold: true, size: 16 },
        alignment: center,
      };

      const subtitleStyle: Partial<Style> = {
        font: { bold: true, size: 12 },
        alignment: center,
      };

      /*
    BORDER STYLES
    */

      const headerBorder: Partial<Borders> = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };

      const verticalBorder: Partial<Borders> = {
        left: { style: "thin" },
        right: { style: "thin" },
      };

      const totalBorder: Partial<Borders> = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };

      const closingBorder: Partial<Borders> = {
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };

      /*
    HELPER → EMPTY ROW WITH VERTICAL BORDERS
    */

      const addEmptyBorderRow = (sheet: ExcelJS.Worksheet) => {
        const row = sheet.addRow(["", "", "", "", "", ""]);
        row.eachCell((cell) => {
          cell.border = verticalBorder;
        });
      };

      /*
    BUILD BANK / CASH SHEET
    */

      const buildSheet = (
        name: string,
        openingBalance: number,
        transactions: any[],
        totals: any,
        closingBalance: number,
      ) => {
        const sheet = workbook.addWorksheet(name);

        sheet.columns = [
          { width: 12 },
          { width: 14 },
          { width: 30 },
          { width: 14 },
          { width: 14 },
          { width: 16 },
        ];

        let r = 1;

        sheet.mergeCells(`A${r}:F${r}`);
        sheet.getCell(`A${r}`).value = society?.name;
        sheet.getCell(`A${r}`).style = titleStyle;
        r++;

        sheet.mergeCells(`A${r}:F${r}`);
        sheet.getCell(`A${r}`).value = name.toUpperCase();
        sheet.getCell(`A${r}`).style = subtitleStyle;
        r++;

        sheet.mergeCells(`A${r}:F${r}`);
        sheet.getCell(`A${r}`).value = `FINANCIAL YEAR: ${year?.year}`;
        sheet.getCell(`A${r}`).style = subtitleStyle;

        sheet.addRow([]);

        /*
      HEADER
      */

        const headerRow = sheet.addRow([
          "Date",
          "Receipt No",
          "Details",
          "Debit (₹)",
          "Credit (₹)",
          "Balance (₹)",
        ]);

        headerRow.eachCell((c) => {
          c.border = headerBorder;
          c.font = { bold: true };
          c.alignment = center;
        });

        let balance = openingBalance;

        /*
      OPENING
      */

        const openRow = sheet.addRow([
          "",
          "",
          `${name.includes("Bank") ? "Bank" : "Cash"} Opening Balance`,
          "",
          "",
          openingBalance,
        ]);

        openRow.getCell(3).font = { bold: true };
        openRow.getCell(6).numFmt = "0.00";
        openRow.eachCell((c) => (c.border = verticalBorder));

        addEmptyBorderRow(sheet);

        /*
      TRANSACTIONS
      */

        transactions.forEach((t) => {
          if (t.transactionType === "income") balance += t.amount;
          else balance -= t.amount;

          let details =
            t.transactionType === "income" ? t.memberName : t.reason || "";
          if (t.paymentMethod === "cheque" && t.chequeNumber) {
            details += ` (Cheque: ${t.chequeNumber})`;
          }

          const row = sheet.addRow([
            formatDate(t.date),
            t.receiptNumber || "",
            details,
            t.transactionType === "expense" ? t.amount : "",
            t.transactionType === "income" ? t.amount : "",
            balance,
          ]);

          row.getCell(4).numFmt = "0.00";
          row.getCell(5).numFmt = "0.00";
          row.getCell(6).numFmt = "0.00";

          row.eachCell((c) => (c.border = verticalBorder));
        });

        addEmptyBorderRow(sheet);

        /*
      TOTAL
      */

        const totalRow = sheet.addRow([
          "",
          "",
          "Total",
          totals.expense,
          totals.income,
          "",
        ]);

        totalRow.getCell(3).font = { bold: true };
        totalRow.getCell(4).numFmt = "0.00";
        totalRow.getCell(5).numFmt = "0.00";

        totalRow.eachCell((c) => (c.border = totalBorder));

        /*
      CLOSING
      */

        const closingRow = sheet.addRow([
          "",
          "",
          `${name.includes("Bank") ? "Bank" : "Cash"} Closing Balance`,
          "",
          "",
          closingBalance,
        ]);

        closingRow.getCell(3).font = { bold: true };
        closingRow.getCell(6).numFmt = "0.00";

        closingRow.eachCell((c) => (c.border = closingBorder));
      };

      /*
    BANK
    */

      buildSheet(
        "Bank Transactions",
        bankOpeningBalance,
        bankTrans,
        bankTotals,
        bankClosingBalance,
      );

      /*
    CASH
    */

      buildSheet(
        "Cash Transactions",
        cashOpeningBalance,
        cashTrans,
        cashTotals,
        cashClosingBalance,
      );

      /*
    SUMMARY SHEET
    */

      const summary = workbook.addWorksheet("Summary");

      summary.columns = [{ width: 30 }, { width: 18 }];

      summary.mergeCells("A1:B1");
      summary.getCell("A1").value = society?.name;
      summary.getCell("A1").style = titleStyle;

      summary.mergeCells("A2:B2");
      summary.getCell("A2").value = "SUMMARY";
      summary.getCell("A2").style = subtitleStyle;

      summary.mergeCells("A3:B3");
      summary.getCell("A3").value = `FINANCIAL YEAR: ${year?.year}`;
      summary.getCell("A3").style = subtitleStyle;

      summary.addRow([]);

      const summaryBorder: Partial<Borders> = {
        left: { style: "thin" },
        right: { style: "thin" },
        top: { style: "thin" },
        bottom: { style: "thin" },
      };

      const addSummary = (title: string, data: any) => {
        const titleRow = summary.addRow([title, ""]);
        titleRow.getCell(1).font = { bold: true };

        const rows = [
          ["Opening Balance", data.open],
          ["Income", data.income],
          ["Expense", data.expense],
          ["Closing Balance", data.close],
        ];

        rows.forEach((r) => {
          const row = summary.addRow(r);
          row.getCell(2).numFmt = "0.00";
          row.eachCell((c) => (c.border = summaryBorder));
        });

        summary.addRow([]);
      };

      addSummary("Bank Summary", {
        open: bankOpeningBalance,
        income: bankTotals.income,
        expense: bankTotals.expense,
        close: bankClosingBalance,
      });

      addSummary("Cash Summary", {
        open: cashOpeningBalance,
        income: cashTotals.income,
        expense: cashTotals.expense,
        close: cashClosingBalance,
      });

      addSummary("Total Summary", {
        open: bankOpeningBalance + cashOpeningBalance,
        income: bankTotals.income + cashTotals.income,
        expense: bankTotals.expense + cashTotals.expense,
        close: bankClosingBalance + cashClosingBalance,
      });

      const buffer = await workbook.xlsx.writeBuffer();

      saveAs(
        new Blob([buffer]),
        `${society?.name}-Cashbook-${year?.year}.xlsx`,
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("cashbook-content");
    if (!element) {
      alert("Cashbook content not found.");
      return;
    }

    try {
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
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;
      }

      const filename = `${society?.name || "Cashbook"}-${year?.year || "Report"}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("PDF Error:", error);
      alert(`Error: ${(error as Error).message}`);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <p className="text-lg font-semibold">Loading...</p>
        </div>
      </ProtectedRoute>
    );
  }

  const bankTrans = getBankTransactions();
  const cashTrans = getCashTransactions();
  const bankTotals = getBankTotals();
  const cashTotals = getCashTotals();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-blue-600 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold wrap-break-word">Cashbook - {society?.name}</h1>
            <HeaderActions
              onLogout={async () => {
                await signOut(auth);
                router.push("/");
              }}
              actions={[
                {
                  id: "back",
                  label: "Back",
                  onClick: () => router.back(),
                  variant: "primary",
                },
              ]}
            />
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Opening Balances */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold mb-4 text-gray-800">
                Bank Opening Balance
              </h2>
              {editingBankOpening ? (
                <div className="space-y-4">
                  <input
                    type="number"
                    value={bankOpeningBalance}
                    onChange={(e) =>
                      setBankOpeningBalance(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleSaveBalance("bankOpening")}
                      disabled={savingBalance}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {savingBalance ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingBankOpening(false)}
                      className="flex-1 px-4 py-2 bg-gray-300 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-3xl font-bold text-blue-600">
                    ₹{bankOpeningBalance.toFixed(2)}
                  </p>
                  <button
                    onClick={() => setEditingBankOpening(true)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold mb-4 text-gray-800">
                Cash Opening Balance
              </h2>
              {editingCashOpening ? (
                <div className="space-y-4">
                  <input
                    type="number"
                    value={cashOpeningBalance}
                    onChange={(e) =>
                      setCashOpeningBalance(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleSaveBalance("cashOpening")}
                      disabled={savingBalance}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      {savingBalance ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingCashOpening(false)}
                      className="flex-1 px-4 py-2 bg-gray-300 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-3xl font-bold text-green-600">
                    ₹{cashOpeningBalance.toFixed(2)}
                  </p>
                  <button
                    onClick={() => setEditingCashOpening(true)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Cashbook Content for PDF */}
          <div id="cashbook-content">
            {/* Bank Section */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-6">
                Bank Transactions
              </h2>

              <div className="overflow-x-auto mb-6">
                <table className="w-full min-w-190 border-collapse">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border border-gray-300 px-4 py-2 text-left font-bold text-gray-800">
                        Date
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-bold text-gray-800">
                        Receipt No
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-bold text-gray-800">
                        Details
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-right font-bold text-gray-800">
                        Debit (₹)
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-right font-bold text-gray-800">
                        Credit (₹)
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-right font-bold text-gray-800">
                        Balance (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-blue-50">
                      <td
                        colSpan={5}
                        className="border border-gray-300 px-4 py-2 font-bold text-gray-800"
                      >
                        Opening Balance
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-bold text-blue-600">
                        ₹{bankOpeningBalance.toFixed(2)}
                      </td>
                    </tr>
                    {bankTrans.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="border border-gray-300 px-4 py-2 text-center text-gray-700"
                        >
                          No bank transactions
                        </td>
                      </tr>
                    ) : (
                      bankTrans.map((trans, index) => (
                        <tr key={trans.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2 text-gray-800">
                            {formatDate(trans.date)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-gray-800">
                            {trans.receiptNumber || "-"}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-gray-800">
                            {trans.transactionType === "income"
                              ? trans.memberName
                              : trans.reason}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right text-red-600 font-bold">
                            {trans.transactionType === "expense"
                              ? `₹${trans.amount.toFixed(2)}`
                              : "-"}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right text-green-600 font-bold">
                            {trans.transactionType === "income"
                              ? `₹${trans.amount.toFixed(2)}`
                              : "-"}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right font-bold text-blue-600">
                            ₹{calculateBankBalance(index).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                    {bankTrans.length > 0 && (
                      <>
                        <tr className="bg-gray-100 font-bold">
                          <td
                            colSpan={3}
                            className="border border-gray-300 px-4 py-2 text-gray-800"
                          >
                            Total
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right text-red-600">
                            ₹{bankTotals.expense.toFixed(2)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right text-green-600">
                            ₹{bankTotals.income.toFixed(2)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right text-blue-600">
                            ₹{bankClosingBalance.toFixed(2)}
                          </td>
                        </tr>
                      </>
                    )}
                    <tr className="bg-blue-50 font-bold">
                      <td
                        colSpan={5}
                        className="border border-gray-300 px-4 py-2 text-gray-800"
                      >
                        Closing Balance
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right text-blue-600">
                        ₹{bankClosingBalance.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cash Section */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-2xl font-bold text-green-800 mb-6">
                Cash Transactions
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full min-w-190 border-collapse">
                  <thead>
                    <tr className="bg-green-100">
                      <th className="border border-gray-300 px-4 py-2 text-left font-bold text-gray-800">
                        Date
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-bold text-gray-800">
                        Receipt No
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-bold text-gray-800">
                        Details
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-right font-bold text-gray-800">
                        Debit (₹)
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-right font-bold text-gray-800">
                        Credit (₹)
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-right font-bold text-gray-800">
                        Balance (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-green-50">
                      <td
                        colSpan={5}
                        className="border border-gray-300 px-4 py-2 font-bold text-gray-800"
                      >
                        Opening Balance
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-bold text-green-600">
                        ₹{cashOpeningBalance.toFixed(2)}
                      </td>
                    </tr>
                    {cashTrans.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="border border-gray-300 px-4 py-2 text-center text-gray-700"
                        >
                          No cash transactions
                        </td>
                      </tr>
                    ) : (
                      cashTrans.map((trans, index) => (
                        <tr key={trans.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2 text-gray-800">
                            {formatDate(trans.date)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-gray-800">
                            {trans.receiptNumber || "-"}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-gray-800">
                            {trans.transactionType === "income"
                              ? trans.memberName
                              : trans.reason}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right text-red-600 font-bold">
                            {trans.transactionType === "expense"
                              ? `₹${trans.amount.toFixed(2)}`
                              : "-"}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right text-green-600 font-bold">
                            {trans.transactionType === "income"
                              ? `₹${trans.amount.toFixed(2)}`
                              : "-"}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right font-bold text-green-600">
                            ₹{calculateCashBalance(index).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                    {cashTrans.length > 0 && (
                      <>
                        <tr className="bg-gray-100 font-bold">
                          <td
                            colSpan={3}
                            className="border border-gray-300 px-4 py-2 text-gray-800"
                          >
                            Total
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right text-red-600">
                            ₹{cashTotals.expense.toFixed(2)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right text-green-600">
                            ₹{cashTotals.income.toFixed(2)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right text-green-600">
                            ₹{cashClosingBalance.toFixed(2)}
                          </td>
                        </tr>
                      </>
                    )}
                    <tr className="bg-green-50 font-bold">
                      <td
                        colSpan={5}
                        className="border border-gray-300 px-4 py-2 text-gray-800"
                      >
                        Closing Balance
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right text-green-600">
                        ₹{cashClosingBalance.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-800 mb-4">
                Bank Summary
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-800">
                  Opening: ₹{bankOpeningBalance.toFixed(2)}
                </p>
                <p className="text-gray-800">
                  Income: ₹{bankTotals.income.toFixed(2)}
                </p>
                <p className="text-gray-800">
                  Expense: ₹{bankTotals.expense.toFixed(2)}
                </p>
                <p className="font-bold text-base text-blue-700">
                  Closing: ₹{bankClosingBalance.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-green-800 mb-4">
                Cash Summary
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-800">
                  Opening: ₹{cashOpeningBalance.toFixed(2)}
                </p>
                <p className="text-gray-800">
                  Income: ₹{cashTotals.income.toFixed(2)}
                </p>
                <p className="text-gray-800">
                  Expense: ₹{cashTotals.expense.toFixed(2)}
                </p>
                <p className="font-bold text-base text-green-700">
                  Closing: ₹{cashClosingBalance.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Total Summary
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-800">
                  Opening: ₹
                  {(bankOpeningBalance + cashOpeningBalance).toFixed(2)}
                </p>
                <p className="text-gray-800">
                  Income: ₹{(bankTotals.income + cashTotals.income).toFixed(2)}
                </p>
                <p className="text-gray-800">
                  Expense: ₹
                  {(bankTotals.expense + cashTotals.expense).toFixed(2)}
                </p>
                <p className="font-bold text-base text-gray-800">
                  Closing: ₹
                  {(bankClosingBalance + cashClosingBalance).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="flex justify-center gap-3 mt-8 flex-wrap">
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm"
            >
              📄 Download PDF
            </button>
            <button
              onClick={handleDownloadXLSX}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm"
            >
              📊 Download XLSX
            </button>
            <button
              onClick={() =>
                router.push(`/society/${societyId}/year/${yearId}/ledger`)
              }
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-sm"
            >
              📋 View Ledger
            </button>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
