/**
 * User Portal Dashboard
 * Displays family members for the logged-in house owner
 */

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import {
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  UserIcon,
  PhoneIcon,
  IdentificationIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useUserPortalAuth } from "../../context/UserPortalAuthContext";
import { getUserPortalFamilyAPI } from "../../services/portalService";

const ANIMATION = {
  container: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } },
};

const MemberCard = memo(({ member, isOwner }) => (
  <motion.div
    variants={ANIMATION.item}
    className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all p-5 ${
      isOwner
        ? "border-[#31757A]/40 ring-2 ring-[#31757A]/15"
        : "border-gray-100"
    }`}
  >
    <div className="flex items-start gap-4">
      {/* Avatar */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 ${
          isOwner
            ? "bg-linear-to-br from-[#31757A] to-[#41A4A7]"
            : "bg-linear-to-br from-gray-400 to-gray-500"
        }`}
      >
        {String(member.Fname || member.Name || "?")[0].toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-gray-900 truncate">
            {member.Fname || member.Name || "—"}
          </h3>
          {isOwner && (
            <span className="text-xs bg-[#E3F9F9] text-[#31757A] font-semibold px-2 py-0.5 rounded-full">
              House Owner
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{member.Relation || "—"}</p>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
          {member.Mobile && (
            <span className="flex items-center gap-1.5">
              <PhoneIcon className="h-3.5 w-3.5 text-[#31757A]" />
              {member.Mobile}
            </span>
          )}
          {member.Gender && (
            <span className="flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5 text-gray-400" />
              {member.Gender}
            </span>
          )}
          {member.Aadhaar && (
            <span className="flex items-center gap-1.5">
              <IdentificationIcon className="h-3.5 w-3.5 text-gray-400" />
              ****{String(member.Aadhaar).slice(-4)}
            </span>
          )}
          {member.Dob && (
            <span className="flex items-center gap-1.5">
              <CalendarDaysIcon className="h-3.5 w-3.5 text-gray-400" />
              {new Date(member.Dob).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
        </div>
        {Number(member.pendingAmount || 0) > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-red-600 font-semibold bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5 w-fit">
            <span>Pending Fine / Amount: ₹{Number(member.pendingAmount).toLocaleString("en-IN")}</span>
          </div>
        )}
      </div>
    </div>
  </motion.div>
));

const UserPortalDashboard = () => {
  const navigate = useNavigate();
  const { token, member: owner, logout } = useUserPortalAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Memoize owner id comparison to avoid re-computing on every render
  const ownerMemberId = useMemo(() => owner?.id ?? "", [owner?.id]);

  const totalPending = useMemo(() => {
    return members.reduce((sum, m) => sum + (Number(m.pendingAmount) || 0), 0);
  }, [members]);

  const fetchFamily = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUserPortalFamilyAPI(token);
      setMembers(res?.data?.members ?? res?.members ?? []);
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      if (status === 401 || status === 403) {
        // Session expired or invalid — clear and redirect to portal login
        logout();
        navigate("/user-portal/login", { replace: true });
      } else {
        toast.error(err?.message || "Failed to load family members");
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigate]);

  useEffect(() => {
    fetchFamily();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/user-portal/login");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#E3F9F9]/40 via-white to-[#F0FAFA]">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-linear-to-br from-[#31757A] to-[#41A4A7] rounded-xl flex items-center justify-center">
              <HomeIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1F2E2E] leading-none">
                Member Portal
              </p>
              <p className="text-xs text-gray-500 leading-none mt-0.5">
                Mahal ID: {owner?.mahalId}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-r from-[#31757A] to-[#41A4A7] rounded-2xl p-6 mb-8 text-white shadow-xl shadow-[#31757A]/20"
        >
          <p className="text-sm opacity-80">Welcome back,</p>
          <h2 className="text-2xl font-bold mt-0.5">
            {owner?.name || "Member"}
          </h2>
          <p className="text-sm opacity-70 mt-1">
            Address: {owner?.address || "—"} &nbsp;·&nbsp; Mahal ID:{" "}
            {owner?.mahalId}
          </p>
          {totalPending > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-yellow-500/25 border border-yellow-400/40 rounded-xl px-4 py-2 text-sm text-yellow-100 font-semibold shadow-inner">
              <span>⚠️ Notice: Outstanding Fine/Pending Amount: ₹{totalPending.toLocaleString("en-IN")}</span>
            </div>
          )}
        </motion.div>

        {/* Family members section */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-[#E3F9F9] rounded-lg flex items-center justify-center">
            <UserGroupIcon className="h-5 w-5 text-[#31757A]" />
          </div>
          <h3 className="text-lg font-bold text-[#1F2E2E]">
            Family Members
            {!loading && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({members.length})
              </span>
            )}
          </h3>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <UserGroupIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No family members found</p>
          </div>
        ) : (
          <motion.div
            variants={ANIMATION.container}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:grid-cols-2"
          >
            {members.map((m) => (
              <MemberCard
                key={m._id || m.id}
                member={m}
                isOwner={
                  !!(
                    ownerMemberId &&
                    (m._id === ownerMemberId || m.id === ownerMemberId)
                  )
                }
              />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default UserPortalDashboard;
