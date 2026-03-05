"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { signOut } from "firebase/auth";
import { ref, child, get, push, set } from "firebase/database";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/Modal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { formatDate } from "@/lib/dateFormat";

interface Member {
  id: string;
  name: string;
  flatNumber: string;
  contactNumber: string;
  createdAt: number;
}

interface Society {
  name: string;
}

interface FinancialYear {
  year: string;
}

export default function MembersPage() {
  const params = useParams();
  const societyId = params.id as string;
  const yearId = params.yearId as string;
  const [society, setSociety] = useState<Society | null>(null);
  const [year, setYear] = useState<FinancialYear | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    flatNumber: "",
    name: "",
    contactNumber: "",
  });
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
              ...value,
              createdAt: value.createdAt || Date.now(),
            });
          }
        });
      }
      setMembers(membersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !societyId) return;

    setSubmitting(true);
    try {
      const membersRef = ref(db, "members");
      const newMemberRef = push(membersRef);

      await set(newMemberRef, {
        ...formData,
        societyId,
        userId: user.uid,
        createdAt: Date.now(),
      });

      setFormData({
        flatNumber: "",
        name: "",
        contactNumber: "",
      });
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error adding member:", error);
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-start">
              <div>
                <button
                  onClick={() =>
                    router.push(
                      `/society/${societyId}/year/${yearId}/transactions`,
                    )
                  }
                  className="text-blue-600 hover:text-blue-700 mb-2"
                >
                  ← Back
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                  {society?.name}
                </h1>
                <p className="text-gray-600">Members Management</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Society Members
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Add Member
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 text-lg mb-4">No members yet</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Add First Member
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {member.name}
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      <span className="font-semibold">Flat:</span>{" "}
                      {member.flatNumber}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-semibold">Contact:</span>{" "}
                      {member.contactNumber}
                    </p>
                    <p className="text-xs text-gray-500 pt-4">
                      Added: {formatDate(member.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Add Member Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add New Member"
        >
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flat Number *
              </label>
              <input
                type="text"
                required
                value={formData.flatNumber}
                onChange={(e) =>
                  setFormData({ ...formData, flatNumber: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., A-101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number *
              </label>
              <input
                type="tel"
                required
                value={formData.contactNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactNumber: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., +1 234 567 8900"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {submitting ? "Adding..." : "Add Member"}
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
