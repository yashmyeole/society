"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  ref,
  child,
  get,
  push,
  set,
  query,
  orderByChild,
  equalTo,
  remove,
  update,
} from "firebase/database";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/Modal";
import { HeaderActions } from "@/components/HeaderActions";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface Society {
  id: string;
  name: string;
  address: string;
  contactNumber: string;
  ownerName: string;
  createdAt: number;
}

export default function HomePage() {
  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingSocietyId, setEditingSocietyId] = useState<string | null>(null);
  const [deletingSocietyId, setDeletingSocietyId] = useState<string | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contactNumber: "",
    ownerName: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchSocieties();
  }, [user]);

  const fetchSocieties = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const societiesRef = ref(db, "societies");
      const snapshot = await get(societiesRef);

      if (snapshot.exists()) {
        const allSocieties = snapshot.val();
        const userSocieties: Society[] = [];

        Object.entries(allSocieties).forEach(([key, value]: [string, any]) => {
          if (value.userId === user.uid) {
            userSocieties.push({
              id: key,
              ...value,
              createdAt: value.createdAt || Date.now(),
            });
          }
        });

        setSocieties(userSocieties);
      } else {
        setSocieties([]);
      }
    } catch (error) {
      console.error("Error fetching societies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSociety = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setSubmitError("");
    console.log("Starting society creation...");
    try {
      console.log("Creating ref to societies...");
      const societiesRef = ref(db, "societies");
      const newSocietyRef = push(societiesRef);
      console.log("Pushing new society with ID:", newSocietyRef.key);

      await set(newSocietyRef, {
        ...formData,
        userId: user.uid,
        createdAt: Date.now(),
      });

      console.log("Society created successfully!");
      setFormData({
        name: "",
        address: "",
        contactNumber: "",
        ownerName: "",
      });
      setIsModalOpen(false);
      fetchSocieties();
    } catch (error) {
      const errorMessage =
        (error as Error).message ||
        "Failed to create society. Please try again.";
      console.error("Error adding society:", error);
      console.error("Full error details:", JSON.stringify(error));
      setSubmitError(errorMessage);
      alert(`❌ Error: ${errorMessage}`);
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

  const handleEditSociety = (society: Society) => {
    setEditingSocietyId(society.id);
    setFormData({
      name: society.name,
      address: society.address,
      contactNumber: society.contactNumber,
      ownerName: society.ownerName,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSociety = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingSocietyId) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const societyRef = ref(db, `societies/${editingSocietyId}`);
      await update(societyRef, {
        name: formData.name,
        address: formData.address,
        contactNumber: formData.contactNumber,
        ownerName: formData.ownerName,
      });

      setIsEditModalOpen(false);
      setEditingSocietyId(null);
      setFormData({
        name: "",
        address: "",
        contactNumber: "",
        ownerName: "",
      });
      fetchSocieties();
    } catch (error) {
      console.error("Error updating society:", error);
      setSubmitError("Failed to update society. Please try again.");
      alert("❌ Failed to update society. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSociety = (societyId: string) => {
    setDeletingSocietyId(societyId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteSociety = async () => {
    if (!user || !deletingSocietyId) return;

    setSubmitting(true);

    try {
      const societyRef = ref(db, `societies/${deletingSocietyId}`);
      await remove(societyRef);

      setIsDeleteConfirmOpen(false);
      setDeletingSocietyId(null);
      fetchSocieties();
    } catch (error) {
      console.error("Error deleting society:", error);
      alert("❌ Failed to delete society. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Housing Society Manager
            </h1>
            <HeaderActions onLogout={handleLogout} />
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              My Societies
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
            >
              + Create Society
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : societies.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 text-lg">
                No societies yet. Create your first society!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {societies.map((society) => (
                <div
                  key={society.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
                >
                  <div
                    onClick={() => router.push(`/society/${society.id}`)}
                    className="p-6 flex-1 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {society.name}
                    </h3>
                    <div className="space-y-2 text-gray-600">
                      <p className="flex items-start">
                        <span className="font-semibold mr-2">Address:</span>
                        <span>{society.address}</span>
                      </p>
                      <p>
                        <span className="font-semibold">Owner:</span>{" "}
                        {society.ownerName}
                      </p>
                      <p>
                        <span className="font-semibold">Contact:</span>{" "}
                        {society.contactNumber}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-6 py-3 flex flex-col sm:flex-row gap-2 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSociety(society);
                      }}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors text-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSociety(society.id);
                      }}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors text-sm"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Create Society Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSubmitError("");
          }}
          title="Create New Society"
        >
          <form onSubmit={handleAddSociety} className="space-y-4">
            {submitError && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <p className="text-sm font-medium text-red-800">
                  {submitError}
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Society Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Yash Housing Society"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 123 Main Street, City"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Name *
              </label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) =>
                  setFormData({ ...formData, ownerName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., John Doe"
                disabled={submitting}
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
                  setFormData({ ...formData, contactNumber: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., +1 234 567 8900"
                disabled={submitting}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {submitting ? "Creating..." : "Create Society"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSubmitError("");
                }}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Society Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSubmitError("");
            setEditingSocietyId(null);
            setFormData({
              name: "",
              address: "",
              contactNumber: "",
              ownerName: "",
            });
          }}
          title="Edit Society"
        >
          <form onSubmit={handleUpdateSociety} className="space-y-4">
            {submitError && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <p className="text-sm font-medium text-red-800">
                  {submitError}
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Society Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Yash Housing Society"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 123 Main Street, City"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Name *
              </label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) =>
                  setFormData({ ...formData, ownerName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., John Doe"
                disabled={submitting}
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
                  setFormData({ ...formData, contactNumber: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., +1 234 567 8900"
                disabled={submitting}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {submitting ? "Updating..." : "Update Society"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSubmitError("");
                  setEditingSocietyId(null);
                  setFormData({
                    name: "",
                    address: "",
                    contactNumber: "",
                    ownerName: "",
                  });
                }}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteConfirmOpen}
          onClose={() => {
            setIsDeleteConfirmOpen(false);
            setDeletingSocietyId(null);
          }}
          title="Delete Society"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete this society? This action cannot
              be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={confirmDeleteSociety}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {submitting ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setDeletingSocietyId(null);
                }}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
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
