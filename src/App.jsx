/**
 * App Component
 * Main application with routing
 */

import { useEffect, useRef, useCallback } from "react";
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
const FinancePage = lazy(() => import("./pages/admin/FinancePage"));

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

const MAINTENANCE_MODE = true;

const MaintenancePage = () => (
  <div className="min-h-screen bg-[#f7faf9] flex items-center justify-center px-4 py-10">
    <main className="w-full max-w-3xl text-center">
      <div className="rounded-lg border border-[#d8e7e5] bg-white px-5 py-10 shadow-sm sm:px-8 sm:py-14">
        <p className="text-2xl font-semibold leading-relaxed text-[#1F2E2E] sm:text-3xl">
          പേയ്മെന്റ് എത്രയും വേഗം അടച്ചു തീർക്കുക.
        </p>
        <p className="mt-6 text-xl font-medium leading-relaxed text-[#2f4b4b] sm:text-2xl">
          Due to pending payment, the website is currently down.
        </p>
        <p className="mt-8 text-lg font-bold tracking-wide text-[#31757A] sm:text-xl">
          CONTACT : +91 88911 77845
        </p>
      </div>
    </main>
  </div>
);

const MaintenanceModeApp = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<MaintenancePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

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

function NormalApp() {
  const { initAuth, isAuthenticated, isAdmin, _hydrated, logout } =
    useAuthStore();
  const inactivityTimerRef = useRef(null);
  const resetInactivityTimer = useCallback(() => {
    clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      if (isAuthenticated) logout();
    }, 10 * 60 * 1000);
  }, [isAuthenticated, logout]);

  // Initialize auth on app load
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Auto-logout after inactivity (main app only)
  useEffect(() => {
    if (!isAuthenticated) return;
    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer));
    resetInactivityTimer();
    return () => {
      events.forEach((e) =>
        window.removeEventListener(e, resetInactivityTimer),
      );
      clearTimeout(inactivityTimerRef.current);
    };
  }, [isAuthenticated, resetInactivityTimer]);

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
            path="/admin/finance"
            element={
              <ProtectedRoute requireAdmin>
                <PortalSuspense>
                  <FinancePage />
                </PortalSuspense>
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
          <Route
            path="/admin/certificates"
            element={
              <ProtectedRoute requireAdmin>
                <CertificatesPage />
              </ProtectedRoute>
            }
          />
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

function App() {
  return MAINTENANCE_MODE ? <MaintenanceModeApp /> : <NormalApp />;
}

export default App;
