/**
 * Dashboard Access Page
 * Admin creates and manages Jamat portals from here
 */

import { useState, useEffect, useCallback } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BuildingOffice2Icon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  LinkIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import AdminLayout from "../../components/layout/AdminLayout";
import { ANIMATION_VARIANTS } from "../../lib/constants";
import { cn } from "../../lib/utils";
import {
  createJamatPortalAPI,
  listJamatPortalsAPI,
  deleteJamatPortalAPI,
  updateJamatCredentialsAPI,
} from "../../services/portalService";

const ALL_MODULES = [
  { id: "notices", label: "Notices" },
  { id: "contacts", label: "Contacts" },
  { id: "inventory", label: "Inventory" },
  { id: "members", label: "Members" },
  { id: "vouchers", label: "Vouchers" },
  { id: "lands", label: "Lands" },
  { id: "bills", label: "Bills" },
  { id: "reports", label: "Reports" },
];

const generatePassword = () => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(
    { length: 12 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
};

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-[#31757A]"
      title="Copy"
    >
      {copied ? (
        <CheckIcon className="h-4 w-4 text-green-500" />
      ) : (
        <ClipboardDocumentIcon className="h-4 w-4" />
      )}
    </button>
  );
};

const DashboardAccessPage = () => {
  const navigate = useNavigate();
  const [portals, setPortals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdCreds, setCreatedCreds] = useState(null);
  const [revealedSlugs, setRevealedSlugs] = useState({});
  const [editingSlug, setEditingSlug] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", newPassword: "" });
  const [editSaving, setEditSaving] = useState(false);

  const toggleReveal = (slug) =>
    setRevealedSlugs((p) => ({ ...p, [slug]: !p[slug] }));

  const openEdit = (portal) => {
    setEditingSlug(portal.slug);
    setEditForm({
      username: portal.credentials?.username || "",
      newPassword: "",
    });
  };

  const handleCredentialsSave = async (slug) => {
    if (!editForm.newPassword || editForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setEditSaving(true);
    try {
      const res = await updateJamatCredentialsAPI(slug, {
        username: editForm.username,
        newPassword: editForm.newPassword,
      });
      const updated = res.data;
      setPortals((prev) =>
        prev.map((p) =>
          p.slug === slug
            ? {
                ...p,
                credentials: {
                  username: updated?.username || editForm.username,
                  plainPassword: editForm.newPassword,
                },
              }
            : p,
        ),
      );
      toast.success("Credentials updated");
      setEditingSlug(null);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to update credentials",
      );
    } finally {
      setEditSaving(false);
    }
  };

  const [form, setForm] = useState({
    jamatName: "",
    username: "",
    password: "",
    enabledModules: [],
  });
  const [errors, setErrors] = useState({});

  const fetchPortals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listJamatPortalsAPI();
      setPortals(res.data?.portals || []);
    } catch {
      // silently ignore — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = () => {
    const e = {};
    if (!form.jamatName.trim()) e.jamatName = "Jamat name is required";
    if (!form.username.trim()) e.username = "Username is required";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6)
      e.password = "Password must be at least 6 characters";
    if (form.enabledModules.length === 0)
      e.modules = "Select at least one module";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await createJamatPortalAPI(form);
      const slug = res.data?.slug;
      toast.success(`Portal "${form.jamatName}" created!`);
      // Save plaintext creds to show in modal before navigating
      setCreatedCreds({
        slug,
        jamatName: form.jamatName,
        username: form.username,
        password: form.password,
        loginUrl: `${window.location.origin}/${slug}/login`,
      });
      setForm({
        jamatName: "",
        username: "",
        password: "",
        enabledModules: [],
      });
      setShowForm(false);
      fetchPortals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create portal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (slug) => {
    if (!confirm(`Delete portal "${slug}"? This cannot be undone.`)) return;
    try {
      await deleteJamatPortalAPI(slug);
      toast.success("Portal deleted");
      setPortals((p) => p.filter((x) => x.slug !== slug));
    } catch {
      toast.error("Failed to delete portal");
    }
  };

  const toggleModule = (id) => {
    setForm((p) => ({
      ...p,
      enabledModules: p.enabledModules.includes(id)
        ? p.enabledModules.filter((m) => m !== id)
        : [...p.enabledModules, id],
    }));
    if (errors.modules) setErrors((p) => ({ ...p, modules: "" }));
  };

  const getPortalUrl = (slug) => `${window.location.origin}/${slug}/login`;

  return (
    <AdminLayout>
      {/* ── Credentials Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {createdCreds && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-linear-to-r from-[#31757A] to-[#41A4A7] px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    <EyeIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg leading-tight">
                      Portal Created
                    </h3>
                    <p className="text-white/70 text-xs">
                      {createdCreds.jamatName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCreatedCreds(null)}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  ⚠️ Save these credentials now — the password is not stored in
                  plain text and cannot be recovered.
                </p>

                {[
                  { label: "Portal URL", value: createdCreds.loginUrl },
                  { label: "Username", value: createdCreds.username },
                  { label: "Password", value: createdCreds.password },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                      {label}
                    </p>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                      <code className="flex-1 text-sm text-gray-800 break-all font-mono select-all">
                        {value}
                      </code>
                      <CopyButton text={value} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 pb-5 flex gap-3">
                <button
                  onClick={() => {
                    navigate(`/${createdCreds.slug}/login`);
                    setCreatedCreds(null);
                  }}
                  className="flex-1 py-2.5 bg-linear-to-r from-[#31757A] to-[#41A4A7] text-white font-semibold rounded-xl hover:from-[#276165] hover:to-[#31757A] transition-all shadow-md"
                >
                  Open Portal Login
                </button>
                <button
                  onClick={() => setCreatedCreds(null)}
                  className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <motion.div
        variants={ANIMATION_VARIANTS.fadeIn}
        initial="hidden"
        animate="visible"
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2E2E]">
              Dashboard Access
            </h1>
            <p className="text-gray-500 mt-1">
              Create and manage isolated Jamat portals
            </p>
          </div>
          <button
            onClick={() => setShowForm((p) => !p)}
            className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-[#31757A] to-[#41A4A7] text-white font-semibold rounded-xl shadow-lg shadow-[#31757A]/25 hover:from-[#276165] hover:to-[#31757A] transition-all"
          >
            <PlusIcon className="h-5 w-5" />
            Create Portal
          </button>
        </div>
      </motion.div>

      {/* Create Portal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BuildingOffice2Icon className="h-5 w-5 text-[#31757A]" />
                New Jamat Portal
              </h3>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  {/* Jamat Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Jamat Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AlJamat"
                      value={form.jamatName}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, jamatName: e.target.value }));
                        if (errors.jamatName)
                          setErrors((p) => ({ ...p, jamatName: "" }));
                      }}
                      className={`w-full px-4 py-2.5 border-2 rounded-xl text-sm outline-none transition-all
                        ${errors.jamatName ? "border-red-400" : "border-gray-200 focus:border-[#31757A]"}`}
                    />
                    {errors.jamatName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.jamatName}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Used as the portal URL slug (alphanumeric + underscore)
                    </p>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. aljamat_admin"
                      value={form.username}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, username: e.target.value }));
                        if (errors.username)
                          setErrors((p) => ({ ...p, username: "" }));
                      }}
                      className={`w-full px-4 py-2.5 border-2 rounded-xl text-sm outline-none transition-all
                        ${errors.username ? "border-red-400" : "border-gray-200 focus:border-[#31757A]"}`}
                    />
                    {errors.username && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.username}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Min 6 characters"
                      value={form.password}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, password: e.target.value }));
                        if (errors.password)
                          setErrors((p) => ({ ...p, password: "" }));
                      }}
                      className={`flex-1 px-4 py-2.5 border-2 rounded-xl text-sm outline-none transition-all font-mono
                        ${errors.password ? "border-red-400" : "border-gray-200 focus:border-[#31757A]"}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const pwd = generatePassword();
                        setForm((p) => ({ ...p, password: pwd }));
                        if (errors.password)
                          setErrors((p) => ({ ...p, password: "" }));
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#E3F9F9] text-[#31757A] font-semibold text-sm rounded-xl hover:bg-[#31757A] hover:text-white transition-all border-2 border-[#31757A]/20 whitespace-nowrap"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                      Auto Generate
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Modules checkboxes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Enabled Modules <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ALL_MODULES.map((mod) => {
                      const checked = form.enabledModules.includes(mod.id);
                      return (
                        <label
                          key={mod.id}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all select-none",
                            checked
                              ? "border-[#31757A] bg-[#E3F9F9] text-[#31757A]"
                              : "border-gray-200 hover:border-gray-300 text-gray-600",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleModule(mod.id)}
                            className="hidden"
                          />
                          <div
                            className={cn(
                              "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0",
                              checked
                                ? "bg-[#31757A] border-[#31757A]"
                                : "border-gray-300",
                            )}
                          >
                            {checked && (
                              <CheckIcon className="h-2.5 w-2.5 text-white" />
                            )}
                          </div>
                          <span className="text-sm font-medium">
                            {mod.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {errors.modules && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.modules}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-linear-to-r from-[#31757A] to-[#41A4A7] text-white font-semibold rounded-xl disabled:opacity-60 hover:from-[#276165] hover:to-[#31757A] transition-all shadow-md"
                  >
                    {submitting ? "Creating…" : "Create Portal"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2.5 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portals list */}
      <motion.div
        variants={ANIMATION_VARIANTS.slideDown}
        initial="hidden"
        animate="visible"
      >
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">
              Active Portals
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({portals.length})
              </span>
            </h3>
            <button
              onClick={fetchPortals}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
            >
              <ArrowPathIcon
                className={cn("h-4 w-4", loading && "animate-spin")}
              />
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : portals.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <BuildingOffice2Icon className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No portals created yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 text-sm text-[#31757A] font-semibold hover:underline"
              >
                Create your first portal
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {portals.map((portal) => (
                <div key={portal.slug}>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Icon */}
                    <div className="w-10 h-10 bg-linear-to-br from-[#31757A] to-[#41A4A7] rounded-xl flex items-center justify-center shrink-0">
                      <BuildingOffice2Icon className="h-5 w-5 text-white" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">
                        {portal.jamatName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                          /{portal.slug}/login
                        </code>
                        <CopyButton text={getPortalUrl(portal.slug)} />
                      </div>

                      {/* Credentials row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400 font-medium">
                            User:
                          </span>
                          <code className="text-xs text-gray-700 font-mono">
                            {portal.credentials?.username || "—"}
                          </code>
                          <CopyButton
                            text={portal.credentials?.username || ""}
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400 font-medium">
                            Pass:
                          </span>
                          <code className="text-xs text-gray-700 font-mono">
                            {revealedSlugs[portal.slug]
                              ? portal.credentials?.plainPassword || "—"
                              : "••••••••"}
                          </code>
                          <button
                            onClick={() => toggleReveal(portal.slug)}
                            className="p-0.5 text-gray-400 hover:text-[#31757A] transition-colors"
                            title={revealedSlugs[portal.slug] ? "Hide" : "Show"}
                          >
                            {revealedSlugs[portal.slug] ? (
                              <EyeSlashIcon className="h-3.5 w-3.5" />
                            ) : (
                              <EyeIcon className="h-3.5 w-3.5" />
                            )}
                          </button>
                          {revealedSlugs[portal.slug] && (
                            <CopyButton
                              text={portal.credentials?.plainPassword || ""}
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(portal.enabledModules || []).map((m) => (
                          <span
                            key={m}
                            className="text-xs bg-[#E3F9F9] text-[#31757A] px-2 py-0.5 rounded-full font-medium capitalize"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() =>
                          editingSlug === portal.slug
                            ? setEditingSlug(null)
                            : openEdit(portal)
                        }
                        className={`p-2 rounded-lg transition-colors ${editingSlug === portal.slug ? "bg-[#E3F9F9] text-[#31757A]" : "text-gray-400 hover:bg-[#E3F9F9] hover:text-[#31757A]"}`}
                        title="Reset credentials"
                      >
                        <KeyIcon className="h-4 w-4" />
                      </button>
                      <a
                        href={`/${portal.slug}/login`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-[#31757A] hover:bg-[#E3F9F9] rounded-lg transition-colors"
                        title="Open portal"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(portal.slug)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete portal"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>

                  {/* Inline credential reset form */}
                  <AnimatePresence>
                    {editingSlug === portal.slug && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-4 pt-0">
                          <div className="bg-[#E3F9F9]/50 border border-[#31757A]/20 rounded-xl p-4">
                            <p className="text-xs font-semibold text-[#31757A] mb-3 uppercase tracking-wide flex items-center gap-1.5">
                              <KeyIcon className="h-3.5 w-3.5" /> Reset
                              Credentials
                            </p>
                            <div className="grid sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  Username
                                </label>
                                <input
                                  type="text"
                                  value={editForm.username}
                                  onChange={(e) =>
                                    setEditForm((p) => ({
                                      ...p,
                                      username: e.target.value,
                                    }))
                                  }
                                  className="w-full px-3 py-2 border-2 border-gray-200 focus:border-[#31757A] rounded-lg text-sm outline-none transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  New Password
                                </label>
                                <div className="flex gap-1">
                                  <input
                                    type="text"
                                    placeholder="Min 6 chars"
                                    value={editForm.newPassword}
                                    onChange={(e) =>
                                      setEditForm((p) => ({
                                        ...p,
                                        newPassword: e.target.value,
                                      }))
                                    }
                                    className="flex-1 min-w-0 px-3 py-2 border-2 border-gray-200 focus:border-[#31757A] rounded-lg text-sm outline-none transition-all font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditForm((p) => ({
                                        ...p,
                                        newPassword: generatePassword(),
                                      }))
                                    }
                                    className="p-2 bg-white border-2 border-gray-200 hover:border-[#31757A] rounded-lg transition-colors text-gray-500 hover:text-[#31757A]"
                                    title="Auto generate"
                                  >
                                    <ArrowPathIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-end gap-2">
                                <button
                                  onClick={() =>
                                    handleCredentialsSave(portal.slug)
                                  }
                                  disabled={editSaving}
                                  className="flex-1 py-2 bg-linear-to-r from-[#31757A] to-[#41A4A7] text-white text-sm font-semibold rounded-lg disabled:opacity-60 hover:from-[#276165] transition-all"
                                >
                                  {editSaving ? "Saving…" : "Save"}
                                </button>
                                <button
                                  onClick={() => setEditingSlug(null)}
                                  className="p-2 border-2 border-gray-200 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default DashboardAccessPage;
