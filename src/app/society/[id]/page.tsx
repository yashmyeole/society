"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { signOut } from "firebase/auth";
import { ref, child, get, push, set } from "firebase/database";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/Modal";
import { HeaderActions } from "@/components/HeaderActions";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { formatDate } from "@/lib/dateFormat";

interface FinancialYear {
  id: string;
  year: string;
  createdAt: number;
}

interface Society {
  id: string;
  name: string;
  address: string;
}

export default function SocietyPage() {
  const params = useParams();
  const societyId = params.id as string;
  const [society, setSociety] = useState<Society | null>(null);
  const [years, setYears] = useState<FinancialYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [year, setYear] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchSocietyAndYears();
  }, [user, societyId]);

  const fetchSocietyAndYears = async () => {
    if (!user || !societyId) return;

    try {
      setLoading(true);

      // Fetch society
      const societyRef = ref(db, `societies/${societyId}`);
      const societySnapshot = await get(societyRef);
      if (societySnapshot.exists()) {
        setSociety({
          id: societyId,
          ...societySnapshot.val(),
        } as Society);
      }

      // Fetch financial years
      const yearsRef = ref(db, "financialYears");
      const yearsSnapshot = await get(yearsRef);
      if (yearsSnapshot.exists()) {
        const allYears = yearsSnapshot.val();
        const userYears: FinancialYear[] = [];

        Object.entries(allYears).forEach(([key, value]: [string, any]) => {
          if (value.societyId === societyId && value.userId === user.uid) {
            userYears.push({
              id: key,
              ...value,
              createdAt: value.createdAt || Date.now(),
            });
          }
        });

        setYears(userYears);
      } else {
        setYears([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !societyId) return;

    setSubmitting(true);
    try {
      const yearsRef = ref(db, "financialYears");
      const newYearRef = push(yearsRef);

      await set(newYearRef, {
        year,
        societyId,
        userId: user.uid,
        createdAt: Date.now(),
      });

      setYear("");
      setIsModalOpen(false);
      fetchSocietyAndYears();
    } catch (error) {
      console.error("Error adding year:", error);
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center gap-3 flex-wrap">
            <div>
              <button
                onClick={() => router.push("/home")}
                className="text-blue-600 hover:text-blue-700 mb-2"
              >
                ← Back to Home
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {society?.name}
              </h1>
              <p className="text-gray-600 wrap-break-word">
                {society?.address}
              </p>
            </div>
            <HeaderActions onLogout={handleLogout} />
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Financial Years
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
            >
              + Add Report
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : years.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 text-lg">
                No financial years yet. Add your first report!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {years.map((fy) => (
                <div
                  key={fy.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div
                    onClick={() =>
                      router.push(
                        `/society/${societyId}/year/${fy.id}/transactions`,
                      )
                    }
                    className="p-6 cursor-pointer"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      FY {fy.year}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Created: {formatDate(fy.createdAt)}
                    </p>
                  </div>
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() =>
                        router.push(
                          `/society/${societyId}/year/${fy.id}/transactions`,
                        )
                      }
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      Transactions
                    </button>
                    <button
                      onClick={() =>
                        router.push(
                          `/society/${societyId}/year/${fy.id}/cashbook`,
                        )
                      }
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors font-medium"
                    >
                      Cashbook
                    </button>
                    <button
                      onClick={() =>
                        router.push(
                          `/society/${societyId}/year/${fy.id}/ledger`,
                        )
                      }
                      className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors font-medium"
                    >
                      Ledger
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Add Financial Year Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add Financial Year Report"
        >
          <form onSubmit={handleAddYear} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Financial Year (e.g., 2024-2025) *
              </label>
              <input
                type="text"
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 2024-2025"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {submitting ? "Creating..." : "Create Report"}
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
