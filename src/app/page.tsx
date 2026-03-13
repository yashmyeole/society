"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/home");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 py-3 sm:h-16 sm:py-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-base sm:text-xl font-bold text-gray-900 leading-tight">
                Housing Society Manager
              </span>
            </div>
            <div className="flex w-full sm:w-auto gap-2 sm:gap-4">
              <Link
                href="/login"
                className="flex-1 sm:flex-none text-center px-4 sm:px-6 py-2 text-gray-700 font-medium hover:text-blue-600 transition rounded-lg"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex-1 sm:flex-none text-center px-4 sm:px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-linear-to-br from-blue-600 via-blue-500 to-blue-800 text-white py-14 sm:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                Manage Your Housing Society with Ease
              </h1>
              <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8">
                A complete financial management solution for housing societies.
                Track income, manage expenses, and generate detailed reports—all
                in one platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  href="/signup"
                  className="text-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition shadow-lg"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/login"
                  className="text-center px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  Sign In
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-blue-400 rounded-lg p-8 shadow-2xl">
                <div className="bg-blue-300 rounded h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-blue-700 font-semibold">
                      Financial Dashboard
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-14 sm:py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-base sm:text-xl text-gray-600">
              Everything you need to manage housing society finances
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Financial Tracking
              </h3>
              <p className="text-gray-600 mb-4">
                Comprehensive tracking of income and expenses with real-time
                balance calculations.
              </p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Income tracking with receipts</li>
                <li>✓ Expense categorization</li>
                <li>✓ Real-time balance updates</li>
                <li>✓ Dual-panel view</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Member Management
              </h3>
              <p className="text-gray-600 mb-4">
                Easily manage society members with contact information and
                member profiles.
              </p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Add and manage members</li>
                <li>✓ Flat number tracking</li>
                <li>✓ Contact information</li>
                <li>✓ Member directories</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Multi-Year Reports
              </h3>
              <p className="text-gray-600 mb-4">
                Organize and analyze finances across multiple financial years
                with detailed reports.
              </p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Year-wise organization</li>
                <li>✓ Detailed ledgers</li>
                <li>✓ Financial summaries</li>
                <li>✓ Export capabilities</li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Transaction Management
              </h3>
              <p className="text-gray-600 mb-4">
                Handle all types of transactions with flexible payment methods
                and detailed tracking.
              </p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Multiple payment methods</li>
                <li>✓ Cheque tracking</li>
                <li>✓ Receipt management</li>
                <li>✓ Transaction history</li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Secure Authentication
              </h3>
              <p className="text-gray-600 mb-4">
                Enterprise-grade security with Firebase authentication and data
                protection.
              </p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Secure login</li>
                <li>✓ Encrypted data</li>
                <li>✓ User isolation</li>
                <li>✓ Access control</li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Responsive Design
              </h3>
              <p className="text-gray-600 mb-4">
                Beautiful, modern interface that works seamlessly on all devices
                and screen sizes.
              </p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Mobile friendly</li>
                <li>✓ Tablet optimized</li>
                <li>✓ Desktop ready</li>
                <li>✓ Fast performance</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Capabilities Section */}
      <section className="py-14 sm:py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 sm:mb-16 text-center">
            What You Can Do
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="text-blue-600">📊</span>
                Create & Manage Societies
              </h3>
              <p className="text-gray-600 mb-4">
                Create multiple housing societies and manage each one
                independently with complete financial separation.
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>Add society details and information</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>Manage owner and contact information</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>Edit and update society details</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>Delete societies when needed</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="text-blue-600">💳</span>
                Track Income & Expenses
              </h3>
              <p className="text-gray-600 mb-4">
                Log all financial transactions with comprehensive details and
                real-time balance tracking.
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>Add income with receipt numbers</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>Track expenses by category</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>Support multiple payment methods</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>Edit and delete transactions</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="text-blue-600">📈</span>
                Generate Reports & Exports
              </h3>
              <p className="text-gray-600 mb-4">
                Create detailed financial reports and export data in multiple
                formats for analysis.
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>View comprehensive ledgers</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>Export to Excel and PDF</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>Year-wise financial summaries</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>Print receipts and reports</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="text-blue-600">👨‍👩‍👧‍👦</span>
                Manage Members
              </h3>
              <p className="text-gray-600 mb-4">
                Keep track of all society members with their contact information
                and details.
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>Add and view all members</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>Store flat numbers and contacts</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>Manage member information</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>Search and filter members</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-14 sm:py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 sm:mb-16 text-center">
            Built with Modern Tech
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-5xl mb-4">⚛️</div>
              <h3 className="text-lg font-semibold text-gray-900">Next.js</h3>
              <p className="text-gray-600 mt-2 text-sm">
                Modern React framework
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-5xl mb-4">🔥</div>
              <h3 className="text-lg font-semibold text-gray-900">Firebase</h3>
              <p className="text-gray-600 mt-2 text-sm">
                Real-time database & auth
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-5xl mb-4">🎨</div>
              <h3 className="text-lg font-semibold text-gray-900">
                Tailwind CSS
              </h3>
              <p className="text-gray-600 mt-2 text-sm">Beautiful styling</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-5xl mb-4">📘</div>
              <h3 className="text-lg font-semibold text-gray-900">
                TypeScript
              </h3>
              <p className="text-gray-600 mt-2 text-sm">Type-safe code</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-14 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Simplify Your Society Management?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Join housing societies already using our platform to manage their
            finances efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition inline-block"
            >
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-blue-700 transition inline-block"
            >
              Already a Member? Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">H</span>
                </div>
                <span className="text-white font-bold">
                  Housing Society Manager
                </span>
              </div>
              <p className="text-sm">
                Managing society finances made simple and efficient.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Financial Tracking
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Member Management
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Reports & Export
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    How it Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Security
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-sm">
              © 2026 Housing Society Manager. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
