/**
 * Jamat Portal Login Page
 * Dynamic per-jamat login at /:slug/login
 */

import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingOffice2Icon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useJamatAuth } from "../../context/JamatAuthContext";
import {
  jamatPortalLoginAPI,
  jamatForgotPasswordAPI,
} from "../../services/portalService";

const JamatLoginPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { login } = useJamatAuth();

  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotForm, setForgotForm] = useState({
    username: "",
    newPassword: "",
  });
  const [forgotErrors, setForgotErrors] = useState({});
  const [forgotLoading, setForgotLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Username is required";
    if (!form.password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await jamatPortalLoginAPI(
        slug,
        form.username.trim(),
        form.password,
      );
      login(res.data);
      toast.success(`Welcome to ${res.data.jamatName || slug} portal!`);
      navigate(`/${slug}/dashboard`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const validateForgot = () => {
    const e = {};
    if (!forgotForm.username.trim()) e.username = "Username is required";
    if (!forgotForm.newPassword || forgotForm.newPassword.length < 6)
      e.newPassword = "Password must be at least 6 characters";
    setForgotErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleForgotSubmit = async (ev) => {
    ev.preventDefault();
    if (!validateForgot()) return;
    setForgotLoading(true);
    try {
      await jamatForgotPasswordAPI(
        slug,
        forgotForm.username.trim(),
        forgotForm.newPassword,
      );
      toast.success("Password updated successfully");
      setShowForgot(false);
      setForgotForm({ username: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#E3F9F9] via-white to-[#F0FAFA] flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#31757A]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#41A4A7]/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="h-1.5 bg-linear-to-r from-[#31757A] via-[#41A4A7] to-[#31757A]" />

          <div className="p-8">
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-linear-to-br from-[#31757A] to-[#41A4A7] rounded-2xl flex items-center justify-center shadow-lg shadow-[#31757A]/25 mb-4">
                <BuildingOffice2Icon className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#1F2E2E] capitalize">
                {slug?.replace(/_/g, " ")} Portal
              </h1>
              <p className="text-sm text-gray-500 mt-1">Admin access</p>
            </div>

            <AnimatePresence mode="wait">
              {!showForgot ? (
                /* ── Login form ── */
                <motion.form
                  key="login"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Username
                    </label>
                    <input
                      type="text"
                      placeholder="Username"
                      value={form.username}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, username: e.target.value }));
                        if (errors.username)
                          setErrors((p) => ({ ...p, username: "" }));
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all outline-none
                        ${errors.username ? "border-red-400" : "border-gray-200 focus:border-[#31757A]"}`}
                    />
                    {errors.username && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.username}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={form.password}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, password: e.target.value }));
                          if (errors.password)
                            setErrors((p) => ({ ...p, password: "" }));
                        }}
                        className={`w-full px-4 py-3 pr-11 border-2 rounded-xl text-sm transition-all outline-none
                          ${errors.password ? "border-red-400" : "border-gray-200 focus:border-[#31757A]"}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#31757A]"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-linear-to-r from-[#31757A] to-[#41A4A7] text-white font-semibold rounded-xl
                      hover:from-[#276165] hover:to-[#31757A] transition-all shadow-lg shadow-[#31757A]/25
                      disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
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
                        Verifying…
                      </span>
                    ) : (
                      "Login"
                    )}
                  </button>

                  <p className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-sm text-[#31757A] hover:underline font-medium"
                    >
                      Forgot Password?
                    </button>
                  </p>
                </motion.form>
              ) : (
                /* ── Forgot password form ── */
                <motion.form
                  key="forgot"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleForgotSubmit}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setShowForgot(false)}
                      className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ArrowLeftIcon className="h-4 w-4 text-gray-600" />
                    </button>
                    <h3 className="font-semibold text-gray-800">
                      Reset Password
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Username
                    </label>
                    <input
                      type="text"
                      placeholder="Your username"
                      value={forgotForm.username}
                      onChange={(e) => {
                        setForgotForm((p) => ({
                          ...p,
                          username: e.target.value,
                        }));
                        if (forgotErrors.username)
                          setForgotErrors((p) => ({ ...p, username: "" }));
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-xl text-sm outline-none
                        ${forgotErrors.username ? "border-red-400" : "border-gray-200 focus:border-[#31757A]"}`}
                    />
                    {forgotErrors.username && (
                      <p className="text-xs text-red-500 mt-1">
                        {forgotErrors.username}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Min 6 characters"
                      value={forgotForm.newPassword}
                      onChange={(e) => {
                        setForgotForm((p) => ({
                          ...p,
                          newPassword: e.target.value,
                        }));
                        if (forgotErrors.newPassword)
                          setForgotErrors((p) => ({ ...p, newPassword: "" }));
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-xl text-sm outline-none
                        ${forgotErrors.newPassword ? "border-red-400" : "border-gray-200 focus:border-[#31757A]"}`}
                    />
                    {forgotErrors.newPassword && (
                      <p className="text-xs text-red-500 mt-1">
                        {forgotErrors.newPassword}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 bg-linear-to-r from-[#31757A] to-[#41A4A7] text-white font-semibold rounded-xl
                      hover:from-[#276165] hover:to-[#31757A] transition-all disabled:opacity-60"
                  >
                    {forgotLoading ? "Updating…" : "Change Password"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="text-center text-sm text-gray-400 mt-6">
              <Link to="/" className="hover:text-[#31757A] transition-colors">
                ← Back to Home
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default JamatLoginPage;
