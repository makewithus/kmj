/**
 * App Component
 * Main application with routing
 */

import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "./components/common/Toast";
import ProtectedRoute from "./components/common/ProtectedRoute";
import useAuthStore from "./store/authStore";
import { UserPortalAuthProvider } from "./context/UserPortalAuthContext";
import JamatPortalWrapper from "./components/common/JamatPortalWrapper";
import {
  JamatProtectedRoute,
  UserPortalProtectedRoute,
} from "./components/common/PortalProtectedRoutes";
import PortalResolver from "./components/common/PortalResolver";

// Portal Pages (lazy-loaded)
import { lazy, Suspense } from "react";
const UserPortalLoginPage = lazy(
  () => import("./pages/user-portal/UserPortalLoginPage"),
);
const UserPortalDashboard = lazy(
  () => import("./pages/user-portal/UserPortalDashboard"),
);
const JamatLoginPage = lazy(() => import("./pages/jamat/JamatLoginPage"));
const JamatDashboard = lazy(() => import("./pages/jamat/JamatDashboard"));
const DashboardAccessPage = lazy(
  () => import("./pages/admin/DashboardAccessPage"),
);

const PortalSuspense = ({ children }) => (
  <Suspense
    fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg
          className="animate-spin h-6 w-6 text-[#31757A]"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
      </div>
    }
  >
    {children}
  </Suspense>
);

// Layouts
import PublicLayout from "./components/layout/PublicLayout";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";

// Public Pages
import HomePage from "./pages/public/HomePage";
import AboutPage from "./pages/public/AboutPage";
import EventsPage from "./pages/public/EventsPage";
import ServicesPage from "./pages/public/ServicesPage";
import ContactPage from "./pages/public/ContactPage";

// Dashboard Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserDashboard from "./pages/user/UserDashboard";
import ProfilePage from "./pages/user/ProfilePage";
import FamilyPage from "./pages/user/FamilyPage";
import MemberForm from "./pages/user/MemberForm";
import BillsPageUser from "./pages/user/BillsPage";

// Admin Pages
import MembersPage from "./pages/admin/MembersPage";
import MemberFormPage from "./pages/admin/MemberFormPage";
import QuickPayPage from "./pages/admin/QuickPayPage";
import BillsPage from "./pages/admin/BillsPage";
import NoticesPage from "./pages/admin/NoticesPage";
import VouchersPage from "./pages/admin/VouchersPage";
import LandPage from "./pages/admin/LandPage";
import InventoryPage from "./pages/admin/InventoryPage";
import ReportsPage from "./pages/admin/ReportsPage";
import CertificatesPage from "./pages/admin/CertificatesPage";
import ContactsPage from "./pages/admin/ContactsPage";
import AdminProfilePage from "./pages/admin/AdminProfilePage";

// Public Pages (additional)
import ReceiptPage from "./pages/public/ReceiptPage";

// 404 Page
const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-neutral-50">
    <div className="text-center">
      <h1 className="text-9xl font-bold text-neutral-900">404</h1>
      <p className="text-2xl text-neutral-600 mt-4">Page Not Found</p>
      <a
        href="/"
        className="mt-6 inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
      >
        Go Home
      </a>
    </div>
  </div>
);

function App() {
  const { initAuth, isAuthenticated, isAdmin, _hydrated } = useAuthStore();

  // Initialize auth on app load
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Spinner shown during persist rehydration
  if (!_hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg
          className="animate-spin h-6 w-6 text-[#31757A]"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <UserPortalAuthProvider>
        <ToastContainer />

        <Routes>
          {/* Public Pages with Layout */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>

          {/* Auth Routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate
                  to={isAdmin() ? "/admin/dashboard" : "/user/dashboard"}
                  replace
                />
              ) : (
                <LoginPage />
              )
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? (
                <Navigate
                  to={isAdmin() ? "/admin/dashboard" : "/user/dashboard"}
                  replace
                />
              ) : (
                <RegisterPage />
              )
            }
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members"
            element={
              <ProtectedRoute requireAdmin>
                <MembersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members/add"
            element={
              <ProtectedRoute requireAdmin>
                <MemberFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members/edit/:id"
            element={
              <ProtectedRoute requireAdmin>
                <MemberFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/quick-pay"
            element={
              <ProtectedRoute requireAdmin>
                <QuickPayPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bills"
            element={
              <ProtectedRoute requireAdmin>
                <BillsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notices"
            element={
              <ProtectedRoute requireAdmin>
                <NoticesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vouchers"
            element={
              <ProtectedRoute requireAdmin>
                <VouchersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/lands"
            element={
              <ProtectedRoute requireAdmin>
                <LandPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inventory"
            element={
              <ProtectedRoute requireAdmin>
                <InventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute requireAdmin>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/contacts"
            element={
              <ProtectedRoute requireAdmin>
                <ContactsPage />
              </ProtectedRoute>
            }
          />
          {/* <Route
          path="/admin/certificates"
          element={
            <ProtectedRoute requireAdmin>
              <CertificatesPage />
            </ProtectedRoute>
          }
        /> */}
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute requireAdmin>
                <AdminProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/receipt/:id"
            element={
              <ProtectedRoute requireAdmin>
                <ReceiptPage />
              </ProtectedRoute>
            }
          />

          {/* User Routes */}
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/family"
            element={
              <ProtectedRoute>
                <FamilyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/family/add"
            element={
              <ProtectedRoute>
                <MemberForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/family/edit/:id"
            element={
              <ProtectedRoute>
                <MemberForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/bills"
            element={
              <ProtectedRoute>
                <BillsPageUser />
              </ProtectedRoute>
            }
          />

          {/* Admin Dashboard Access */}
          <Route
            path="/admin/dashboard-access"
            element={
              <ProtectedRoute requireAdmin>
                <PortalSuspense>
                  <DashboardAccessPage />
                </PortalSuspense>
              </ProtectedRoute>
            }
          />

          {/* User Portal Routes */}
          <Route
            path="/user-portal/login"
            element={
              <PortalSuspense>
                <UserPortalLoginPage />
              </PortalSuspense>
            }
          />
          <Route
            path="/user-portal/dashboard"
            element={
              <PortalSuspense>
                <UserPortalProtectedRoute>
                  <UserPortalDashboard />
                </UserPortalProtectedRoute>
              </PortalSuspense>
            }
          />

          {/* Dynamic Jamat Portal Routes — /:slug/login, /:slug/dashboard */}
          <Route path="/:slug" element={<JamatPortalWrapper />}>
            <Route
              index
              element={
                <PortalSuspense>
                  <PortalResolver />
                </PortalSuspense>
              }
            />
            <Route
              path="login"
              element={
                <PortalSuspense>
                  <JamatLoginPage />
                </PortalSuspense>
              }
            />
            <Route
              path="dashboard"
              element={
                <PortalSuspense>
                  <JamatProtectedRoute>
                    <JamatDashboard />
                  </JamatProtectedRoute>
                </PortalSuspense>
              }
            />
          </Route>

          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </UserPortalAuthProvider>
    </BrowserRouter>
  );
}

export default App;
