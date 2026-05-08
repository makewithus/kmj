/**
 * User Portal Login Page
 * Members login with Mahal ID + phone number
 * Only house owners are permitted
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useUserPortalAuth } from "../../context/UserPortalAuthContext";
import { userPortalLoginAPI } from "../../services/portalService";

const UserPortalLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useUserPortalAuth();

  const [form, setForm] = useState({ mahalId: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [showPhone, setShowPhone] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.mahalId.trim()) e.mahalId = "Mahal ID is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await userPortalLoginAPI(
        form.mahalId.trim(),
        form.phone.trim(),
      );
      login(res.data);
      toast.success("Welcome to your portal!");
      navigate("/user-portal/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#E3F9F9] via-white to-[#F0FAFA] flex items-center justify-center px-4">
      {/* Background decoration */}
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
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header bar */}
          <div className="h-1.5 bg-linear-to-r from-[#31757A] via-[#41A4A7] to-[#31757A]" />

          <div className="p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-linear-to-br from-[#31757A] to-[#41A4A7] rounded-2xl flex items-center justify-center shadow-lg shadow-[#31757A]/25 mb-4">
                <HomeIcon className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#1F2E2E]">
                Member Portal
              </h1>
              <p className="text-sm text-gray-500 mt-1 text-center">
                Login with your Mahal ID and registered phone number
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Mahal ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Mahal ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1/2"
                  value={form.mahalId}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, mahalId: e.target.value }));
                    if (errors.mahalId)
                      setErrors((p) => ({ ...p, mahalId: "" }));
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all outline-none
                    ${
                      errors.mahalId
                        ? "border-red-400 focus:border-red-500"
                        : "border-gray-200 focus:border-[#31757A]"
                    }`}
                />
                {errors.mahalId && (
                  <p className="text-xs text-red-500 mt-1">{errors.mahalId}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type={showPhone ? "text" : "password"}
                    placeholder="Registered phone number"
                    value={form.phone}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, phone: e.target.value }));
                      if (errors.phone) setErrors((p) => ({ ...p, phone: "" }));
                    }}
                    className={`w-full px-4 py-3 pr-11 border-2 rounded-xl text-sm transition-all outline-none
                      ${
                        errors.phone
                          ? "border-red-400 focus:border-red-500"
                          : "border-gray-200 focus:border-[#31757A]"
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPhone((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#31757A] transition-colors"
                  >
                    {showPhone ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Info hint */}
              <div className="bg-[#E3F9F9] rounded-xl p-3 flex items-start gap-2">
                <LockClosedIcon className="h-4 w-4 text-[#31757A] mt-0.5 shrink-0" />
                <p className="text-xs text-[#31757A]">
                  Only the head of household can access the portal. Your
                  password is your registered phone number.
                </p>
              </div>

              {/* Submit */}
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
            </form>

            {/* Back link */}
            <p className="text-center text-sm text-gray-500 mt-6">
              <Link
                to="/"
                className="text-[#31757A] font-semibold hover:underline"
              >
                ← Back to Home
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserPortalLoginPage;
