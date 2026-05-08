/**
 * Jamat Portal Dashboard
 * Isolated per-jamat dashboard — only shows enabled modules
 * Includes Customise My Portal section, Schema Builder, and DB Export
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightOnRectangleIcon,
  BuildingOffice2Icon,
  BellIcon,
  UsersIcon,
  PhoneIcon,
  ArchiveBoxIcon,
  DocumentTextIcon,
  Squares2X2Icon,
  PaintBrushIcon,
  EyeSlashIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
  TableCellsIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useJamatAuth } from "../../context/JamatAuthContext";
import {
  getJamatModuleDataAPI,
  addJamatModuleItemAPI,
  deleteJamatModuleItemAPI,
  updateJamatSettingsAPI,
  getModuleSchemaAPI,
  saveModuleSchemaAPI,
} from "../../services/portalService";
import { getErrorMessage } from "../../lib/utils";

const MODULE_META = {
  notices: {
    icon: BellIcon,
    label: "Notices",
    color: "from-purple-500 to-purple-600",
  },
  contacts: {
    icon: PhoneIcon,
    label: "Contacts",
    color: "from-blue-500 to-blue-600",
  },
  inventory: {
    icon: ArchiveBoxIcon,
    label: "Inventory",
    color: "from-amber-500 to-amber-600",
  },
  members: {
    icon: UsersIcon,
    label: "Members",
    color: "from-[#31757A] to-[#41A4A7]",
  },
  vouchers: {
    icon: DocumentTextIcon,
    label: "Vouchers",
    color: "from-rose-500 to-rose-600",
  },
  lands: {
    icon: Squares2X2Icon,
    label: "Lands",
    color: "from-green-500 to-green-600",
  },
};

const ModuleCard = ({ mod, count, onClick, hidden }) => {
  const meta = MODULE_META[mod] || {
    icon: DocumentTextIcon,
    label: mod,
    color: "from-gray-400 to-gray-500",
  };
  const Icon = meta.icon;
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer p-5 ${hidden ? "opacity-50" : ""}`}
    >
      <div
        className={`w-12 h-12 bg-linear-to-br ${meta.color} rounded-xl flex items-center justify-center mb-4`}
      >
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h4 className="font-semibold text-gray-900">{meta.label}</h4>
      <p className="text-2xl font-bold text-gray-800 mt-1">{count}</p>
      <p className="text-xs text-gray-400 mt-0.5">items</p>
    </motion.div>
  );
};

const JamatDashboard = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { token, jamatName, enabledModules, settings, logout, updateSettings } =
    useJamatAuth();

  const [activeModule, setActiveModule] = useState(null);
  const [moduleData, setModuleData] = useState({});
  const [moduleLoading, setModuleLoading] = useState({});
  const [showCustomise, setShowCustomise] = useState(false);

  // Theme customisation state
  const [theme, setTheme] = useState(
    settings?.theme || { primary: "#31757A", secondary: "#41A4A7" },
  );
  const [hiddenModules, setHiddenModules] = useState(
    settings?.hiddenModules || [],
  );
  const [savingSettings, setSavingSettings] = useState(false);

  // Schema builder state
  const [schemas, setSchemas] = useState({});           // { [mod]: { fields: [] } }
  const [showSchemaBuilder, setShowSchemaBuilder] = useState(false);
  const [schemaModule, setSchemaModule] = useState(null);
  const [schemaFields, setSchemaFields] = useState([]);
  const [savingSchema, setSavingSchema] = useState(false);

  // Add-item form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState({});
  const [addingItem, setAddingItem] = useState(false);



  const visibleModules = useMemo(
    () => enabledModules.filter((m) => !hiddenModules.includes(m)),
    [enabledModules, hiddenModules],
  );

  const fetchModuleData = useCallback(
    async (mod) => {
      if (moduleData[mod]) return; // cached
      setModuleLoading((p) => ({ ...p, [mod]: true }));
      try {
        const res = await getJamatModuleDataAPI(slug, mod, token);
        setModuleData((p) => ({
          ...p,
          [mod]: res?.data?.items ?? res?.items ?? [],
        }));
      } catch (err) {
        const status = err?.status ?? err?.response?.status;
        if (status === 401 || status === 403) {
          logout();
          navigate(`/${slug}/login`, { replace: true });
          return;
        }
        toast.error(`Failed to load ${mod}`);
        setModuleData((p) => ({ ...p, [mod]: [] }));
      } finally {
        setModuleLoading((p) => ({ ...p, [mod]: false }));
      }
    },
    [slug, token, moduleData, logout, navigate],
  );

  useEffect(() => {
    // Pre-fetch visible modules
    visibleModules.forEach(fetchModuleData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleModuleClick = (mod) => {
    setActiveModule(mod);
    fetchModuleData(mod);
  };

  const handleDeleteItem = async (mod, itemId) => {
    try {
      await deleteJamatModuleItemAPI(slug, mod, itemId, token);
      setModuleData((p) => ({
        ...p,
        [mod]: (p[mod] || []).filter((i) => i.id !== itemId),
      }));
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateJamatSettingsAPI(slug, token, { theme, hiddenModules });
      updateSettings({ theme, hiddenModules });
      toast.success("Settings saved!");
      setShowCustomise(false);
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate(`/${slug}/login`);
  };

  // ── Schema builder ──────────────────────────────────────────────────────────
  const openSchemaBuilder = useCallback(
    async (mod) => {
      setSchemaModule(mod);
      setShowSchemaBuilder(true);
      // Fetch existing schema if not cached
      if (!schemas[mod]) {
        try {
          const res = await getModuleSchemaAPI(slug, mod, token);
          const fields = res?.data?.schema?.fields ?? res?.schema?.fields ?? [];
          setSchemas((p) => ({ ...p, [mod]: { fields } }));
          setSchemaFields(fields);
        } catch {
          setSchemaFields([]);
        }
      } else {
        setSchemaFields(schemas[mod]?.fields ?? []);
      }
    },
    [slug, token, schemas],
  );

  const addSchemaField = () => {
    setSchemaFields((p) => [
      ...p,
      { name: "", label: "", type: "text", required: false, options: [] },
    ]);
  };

  const updateSchemaField = (idx, patch) => {
    setSchemaFields((p) =>
      p.map((f, i) => (i === idx ? { ...f, ...patch } : f)),
    );
  };

  const removeSchemaField = (idx) => {
    setSchemaFields((p) => p.filter((_, i) => i !== idx));
  };

  const handleSaveSchema = async () => {
    // Validate: all fields need a name
    const invalid = schemaFields.some((f) => !f.name.trim());
    if (invalid) {
      toast.error("Every field must have a unique key name");
      return;
    }
    setSavingSchema(true);
    try {
      await saveModuleSchemaAPI(slug, schemaModule, token, schemaFields);
      setSchemas((p) => ({ ...p, [schemaModule]: { fields: schemaFields } }));
      toast.success("Schema saved!");
      setShowSchemaBuilder(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save schema"));
    } finally {
      setSavingSchema(false);
    }
  };

  // ── Add item (dynamic form) ─────────────────────────────────────────────────
  const openAddForm = useCallback(
    async (mod) => {
      // Ensure schema loaded
      if (!schemas[mod]) {
        try {
          const res = await getModuleSchemaAPI(slug, mod, token);
          const fields = res?.data?.schema?.fields ?? res?.schema?.fields ?? [];
          setSchemas((p) => ({ ...p, [mod]: { fields } }));
        } catch {
          /* no schema yet — free-form */
        }
      }
      setAddFormData({});
      setShowAddForm(true);
    },
    [slug, token, schemas],
  );

  const handleAddItem = async () => {
    if (!activeModule) return;
    setAddingItem(true);
    try {
      const res = await addJamatModuleItemAPI(slug, activeModule, token, addFormData);
      // Backend returns { success, data: { id } } — store with real Firestore ID
      const newId = res?.data?.id ?? res?.id;
      const newItem = { ...addFormData, id: newId, createdAt: new Date().toISOString() };
      setModuleData((p) => ({
        ...p,
        [activeModule]: [newItem, ...(p[activeModule] || [])],
      }));
      toast.success("Item added");
      setShowAddForm(false);
      setAddFormData({});
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add item"));
    } finally {
      setAddingItem(false);
    }
  };



  // Apply theme CSS variables
  const themeStyle = {
    "--portal-primary": theme.primary,
    "--portal-secondary": theme.secondary,
  };

  return (
    <div className="min-h-screen bg-gray-50" style={themeStyle}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              }}
            >
              <BuildingOffice2Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1F2E2E] leading-none capitalize">
                {jamatName || slug?.replace(/_/g, " ")}
              </p>
              <p className="text-xs text-gray-500 leading-none mt-0.5">
                Management Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCustomise(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <PaintBrushIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Customise</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 mb-8 text-white shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
          }}
        >
          <p className="text-sm opacity-80">Welcome to</p>
          <h2 className="text-2xl font-bold mt-0.5 capitalize">
            {jamatName || slug?.replace(/_/g, " ")} Portal
          </h2>
          <p className="text-sm opacity-70 mt-1">
            {visibleModules.length} module
            {visibleModules.length !== 1 ? "s" : ""} active
          </p>
        </motion.div>

        {/* Module grid */}
        {activeModule === null ? (
          <>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Modules</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {enabledModules.map((mod) => (
                <ModuleCard
                  key={mod}
                  mod={mod}
                  count={(moduleData[mod] || []).length}
                  hidden={hiddenModules.includes(mod)}
                  onClick={() =>
                    !hiddenModules.includes(mod) && handleModuleClick(mod)
                  }
                />
              ))}
            </div>
          </>
        ) : (
          /* Module detail view */
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setActiveModule(null)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
              <h3 className="text-lg font-bold text-gray-800 capitalize flex-1">
                {MODULE_META[activeModule]?.label || activeModule}
              </h3>
              <button
                onClick={() => openSchemaBuilder(activeModule)}
                title="Define custom fields for this module"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <TableCellsIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Schema</span>
              </button>
              <button
                onClick={() => openAddForm(activeModule)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
              >
                <PlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Add Item</span>
              </button>
            </div>

            {moduleLoading[activeModule] ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-4 animate-pulse h-16"
                  />
                ))}
              </div>
            ) : (moduleData[activeModule] || []).length === 0 ? (
              <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No items yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(moduleData[activeModule] || []).map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-4 hover:shadow-sm transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {item.title || item.name || item.Name || item.id}
                      </p>
                      {item.createdAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteItem(activeModule, item.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Schema Builder Drawer ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showSchemaBuilder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSchemaBuilder(false)}
              className="fixed inset-0 bg-black/40 z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TableCellsIcon className="h-5 w-5 text-[#31757A]" />
                  Schema —{" "}
                  <span className="capitalize">
                    {MODULE_META[schemaModule]?.label || schemaModule}
                  </span>
                </h3>
                <button
                  onClick={() => setShowSchemaBuilder(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Field list */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {schemaFields.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No fields defined yet. Click "Add Field" to start.
                  </p>
                )}
                {schemaFields.map((field, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">
                            Key name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. phoneNumber"
                            value={field.name}
                            onChange={(e) =>
                              updateSchemaField(idx, { name: e.target.value })
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31757A]/30"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">
                            Display label
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Phone Number"
                            value={field.label}
                            onChange={(e) =>
                              updateSchemaField(idx, { label: e.target.value })
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31757A]/30"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeSchemaField(idx)}
                        className="mt-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">
                          Field type
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) =>
                            updateSchemaField(idx, { type: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31757A]/30 bg-white"
                        >
                          {[
                            "text",
                            "number",
                            "date",
                            "textarea",
                            "boolean",
                            "select",
                            "multiselect",
                          ].map((t) => (
                            <option key={t} value={t}>
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <input
                          type="checkbox"
                          id={`req-${idx}`}
                          checked={!!field.required}
                          onChange={(e) =>
                            updateSchemaField(idx, { required: e.target.checked })
                          }
                          className="h-4 w-4 accent-[#31757A]"
                        />
                        <label
                          htmlFor={`req-${idx}`}
                          className="text-xs text-gray-600 cursor-pointer"
                        >
                          Required
                        </label>
                      </div>
                    </div>

                    {/* Options — only for select / multiselect */}
                    {(field.type === "select" || field.type === "multiselect") && (
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          Options (comma-separated)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Chair, Member, Treasurer"
                          value={(field.options || []).join(", ")}
                          onChange={(e) =>
                            updateSchemaField(idx, {
                              options: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31757A]/30"
                        />
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={addSchemaField}
                  className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-[#31757A] hover:text-[#31757A] transition-colors flex items-center justify-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Field
                </button>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 shrink-0">
                <button
                  onClick={handleSaveSchema}
                  disabled={savingSchema}
                  className="w-full py-3 text-white font-semibold rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  }}
                >
                  {savingSchema ? (
                    "Saving…"
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      Save Schema
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Add Item Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddForm && activeModule && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="fixed inset-0 bg-black/40 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Modal header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">
                  Add to{" "}
                  <span className="capitalize">
                    {MODULE_META[activeModule]?.label || activeModule}
                  </span>
                </h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Form body */}
              <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {(schemas[activeModule]?.fields ?? []).length > 0 ? (
                  // Dynamic schema-based form
                  schemas[activeModule].fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {field.label || field.name}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>

                      {field.type === "textarea" ? (
                        <textarea
                          rows={3}
                          value={addFormData[field.name] ?? ""}
                          onChange={(e) =>
                            setAddFormData((p) => ({
                              ...p,
                              [field.name]: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31757A]/30 resize-none"
                        />
                      ) : field.type === "boolean" ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`add-${field.name}`}
                            checked={!!addFormData[field.name]}
                            onChange={(e) =>
                              setAddFormData((p) => ({
                                ...p,
                                [field.name]: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 accent-[#31757A]"
                          />
                          <label
                            htmlFor={`add-${field.name}`}
                            className="text-sm text-gray-600 cursor-pointer"
                          >
                            {field.label || field.name}
                          </label>
                        </div>
                      ) : field.type === "select" ? (
                        <select
                          value={addFormData[field.name] ?? ""}
                          onChange={(e) =>
                            setAddFormData((p) => ({
                              ...p,
                              [field.name]: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31757A]/30 bg-white"
                        >
                          <option value="">Select…</option>
                          {(field.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "multiselect" ? (
                        <div className="flex flex-wrap gap-2">
                          {(field.options || []).map((opt) => {
                            const selected = (
                              addFormData[field.name] || []
                            ).includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() =>
                                  setAddFormData((p) => {
                                    const cur = p[field.name] || [];
                                    return {
                                      ...p,
                                      [field.name]: selected
                                        ? cur.filter((v) => v !== opt)
                                        : [...cur, opt],
                                    };
                                  })
                                }
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                  selected
                                    ? "border-[#31757A] bg-[#E3F9F9] text-[#31757A]"
                                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <input
                          type={
                            field.type === "number"
                              ? "number"
                              : field.type === "date"
                              ? "date"
                              : "text"
                          }
                          value={addFormData[field.name] ?? ""}
                          onChange={(e) =>
                            setAddFormData((p) => ({
                              ...p,
                              [field.name]: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31757A]/30"
                        />
                      )}
                    </div>
                  ))
                ) : (
                  // Fallback free-form when no schema defined
                  <div className="space-y-3">
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                      No schema defined for this module. Use the Schema button to add
                      typed fields, or enter a title below.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Title / Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter a title…"
                        value={addFormData.title ?? ""}
                        onChange={(e) =>
                          setAddFormData((p) => ({
                            ...p,
                            title: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31757A]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Description (optional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Enter description…"
                        value={addFormData.description ?? ""}
                        onChange={(e) =>
                          setAddFormData((p) => ({
                            ...p,
                            description: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31757A]/30 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={addingItem}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-colors"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  }}
                >
                  {addingItem ? "Adding…" : "Add Item"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Customise Drawer */}
      <AnimatePresence>
        {showCustomise && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomise(false)}
              className="fixed inset-0 bg-black/40 z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <PaintBrushIcon className="h-5 w-5 text-[#31757A]" />
                    Customise Portal
                  </h3>
                  <button
                    onClick={() => setShowCustomise(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Theme colours */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Theme Colors
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-600">
                        Primary color
                      </label>
                      <input
                        type="color"
                        value={theme.primary}
                        onChange={(e) =>
                          setTheme((p) => ({ ...p, primary: e.target.value }))
                        }
                        className="h-9 w-20 rounded-lg border border-gray-200 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-600">
                        Secondary color
                      </label>
                      <input
                        type="color"
                        value={theme.secondary}
                        onChange={(e) =>
                          setTheme((p) => ({ ...p, secondary: e.target.value }))
                        }
                        className="h-9 w-20 rounded-lg border border-gray-200 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Module visibility */}
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Module Visibility
                  </h4>
                  <div className="space-y-2">
                    {enabledModules.map((mod) => {
                      const isHidden = hiddenModules.includes(mod);
                      return (
                        <div
                          key={mod}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                        >
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {MODULE_META[mod]?.label || mod}
                          </span>
                          <button
                            onClick={() =>
                              setHiddenModules((p) =>
                                isHidden
                                  ? p.filter((m) => m !== mod)
                                  : [...p, mod],
                              )
                            }
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              isHidden
                                ? "bg-gray-200 text-gray-500"
                                : "bg-[#E3F9F9] text-[#31757A]"
                            }`}
                          >
                            {isHidden ? (
                              <>
                                <EyeSlashIcon className="h-3.5 w-3.5" /> Hidden
                              </>
                            ) : (
                              <>
                                <EyeIcon className="h-3.5 w-3.5" /> Visible
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="w-full py-3 bg-linear-to-r from-[#31757A] to-[#41A4A7] text-white font-semibold rounded-xl disabled:opacity-60"
                >
                  {savingSettings ? "Saving…" : "Save Settings"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JamatDashboard;
