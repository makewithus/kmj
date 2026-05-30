/**
 * Certificates Page
 * Admin generator for Marriage, Death, Admission, and Transfer certificates.
 */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Award, Download, Save } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/layout/AdminLayout";
import { CERTIFICATE_TYPES } from "../../lib/constants";
import { getErrorMessage } from "../../lib/utils";
import certificateService from "../../services/certificateService";

const detailFields = {
  Marriage: [
    ["spouseName", "Spouse Name", "text"],
    ["marriageDate", "Marriage Date", "date"],
    ["place", "Place", "text"],
  ],
  Death: [
    ["deathDate", "Date of Death", "date"],
    ["place", "Place of Death", "text"],
    ["cause", "Cause", "text"],
  ],
  Admission: [
    ["admissionDate", "Admission Date", "date"],
    ["className", "Class / Batch", "text"],
    ["admissionNo", "Admission No", "text"],
  ],
  Transfer: [
    ["fromLocation", "From Location", "text"],
    ["toLocation", "To Location", "text"],
    ["transferDate", "Transfer Date", "date"],
  ],
};

const getTypeLabel = (type) =>
  CERTIFICATE_TYPES.find((item) => item.value === type)?.label || type;

const formatDate = (value) => {
  if (!value) return "__________";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const certificateBody = (type, name, details) => {
  const safeName = name || "Recipient Name";

  if (type === "Marriage") {
    return `This is to certify that ${safeName} and ${
      details.spouseName || "Spouse Name"
    } were married on ${formatDate(details.marriageDate)} at ${
      details.place || "__________"
    } as per the records of Kalloor Masjid Jama-ath.`;
  }

  if (type === "Death") {
    return `This is to certify that ${safeName} passed away on ${formatDate(
      details.deathDate,
    )} at ${details.place || "__________"}. ${
      details.cause ? `Recorded cause: ${details.cause}.` : ""
    }`;
  }

  if (type === "Admission") {
    return `This is to certify that ${safeName} has been admitted on ${formatDate(
      details.admissionDate,
    )} to ${details.className || "__________"} with admission number ${
      details.admissionNo || "__________"
    }.`;
  }

  return `This is to certify that ${safeName} has been transferred from ${
    details.fromLocation || "__________"
  } to ${details.toLocation || "__________"} effective ${formatDate(
    details.transferDate,
  )}.`;
};

const CertificatesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = searchParams.get("type") || "Marriage";
  const [type, setType] = useState(initialType);
  const [name, setName] = useState("");
  const [details, setDetails] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const nextType = searchParams.get("type");
    if (nextType && CERTIFICATE_TYPES.some((item) => item.value === nextType)) {
      setType(nextType);
      setDetails({});
    }
  }, [searchParams]);

  const fields = useMemo(() => detailFields[type] || [], [type]);
  const title = getTypeLabel(type);
  const defaultBody = useMemo(() => certificateBody(type, name, details), [type, name, details]);
  const displayBody = details.customBody !== undefined ? details.customBody : defaultBody;

  // Reset customBody when type or name changes
  useEffect(() => {
    setDetails((prev) => {
      if (prev.customBody === undefined) return prev;
      const { customBody, ...rest } = prev;
      return rest;
    });
  }, [type, name]);

  const handleTypeChange = (value) => {
    setType(value);
    setDetails({});
    setSearchParams({ type: value });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Enter the certificate name");
      return;
    }

    setSaving(true);
    try {
      // Include the potentially edited custom body in the details object saved to server
      const payloadDetails = { ...details, customBody: displayBody };
      await certificateService.create({ type, name: name.trim(), details: payloadDetails });
      toast.success("Certificate saved successfully");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save certificate"));
    } finally {
      setSaving(false);
    }
  };

  const handlePdfDownload = () => {
    window.print();
  };

  return (
    <AdminLayout>
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #certificate-print, #certificate-print * { visibility: visible; }
            #certificate-print {
              position: fixed;
              inset: 0;
              width: 100%;
              padding: 48px;
              background: white;
            }
          }
        `}
      </style>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-[#1F2E2E]">Certificates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Select a certificate, enter the name, preview, and download as PDF.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#E3F9F9] px-4 py-2.5 text-sm font-semibold text-[#31757A] hover:bg-[#d3f1f1] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handlePdfDownload}
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-[#31757A] to-[#41A4A7] px-4 py-2.5 text-sm font-semibold text-white shadow-md"
          >
            <Download className="h-4 w-4" />
            PDF Download
          </button>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
            <Award className="h-5 w-5 text-[#31757A]" />
            Certificate Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Certificate Type
              </label>
              <select
                value={type}
                onChange={(event) => handleTypeChange(event.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-[#31757A]"
              >
                {CERTIFICATE_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Name
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter full name"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-[#31757A]"
              />
            </div>

            {fields.map(([key, label, inputType]) => (
              <div key={key}>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  {label}
                </label>
                <input
                  type={inputType}
                  value={details[key] || ""}
                  onChange={(event) =>
                    setDetails((prev) => ({
                      ...prev,
                      [key]: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-[#31757A]"
                />
              </div>
            ))}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Notes
              </label>
              <textarea
                rows={3}
                value={details.notes || ""}
                onChange={(event) =>
                  setDetails((prev) => ({ ...prev, notes: event.target.value }))
                }
                className="w-full resize-none rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-[#31757A]"
              />
            </div>
          </div>
        </section>

        <section
          id="certificate-print"
          className="min-h-[620px] rounded-2xl border border-[#31757A]/20 bg-white p-8 shadow-sm"
        >
          <div className="flex h-full flex-col border-4 border-double border-[#31757A]/40 p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#31757A]">
              Kalloor Masjid Jama-ath
            </p>
            <h2 className="mt-8 text-3xl font-bold text-[#1F2E2E]">{title}</h2>
            <div className="mx-auto mt-3 h-1 w-24 rounded-full bg-linear-to-r from-[#31757A] to-[#41A4A7]" />

            {/* Editable body content for screen view, static print-ready view for printing */}
            <div className="mt-14 print:hidden flex flex-col items-center">
              <label className="text-xs text-gray-400 mb-1">Click below to edit certificate content directly:</label>
              <textarea
                value={displayBody}
                onChange={(event) =>
                  setDetails((prev) => ({
                    ...prev,
                    customBody: event.target.value,
                  }))
                }
                rows={6}
                className="w-full border-2 border-dashed border-gray-200 hover:border-[#31757A] focus:border-[#31757A] focus:ring-0 rounded-2xl p-4 text-lg leading-9 text-gray-700 text-center transition-all bg-[#F9FBFB] outline-none resize-none font-sans"
                placeholder="Click here to edit the certificate body text..."
              />
              <button
                type="button"
                onClick={() => setDetails((prev) => {
                  const { customBody, ...rest } = prev;
                  return rest;
                })}
                className="mt-3 text-xs text-[#31757A] hover:underline font-semibold"
              >
                Reset to default template
              </button>
            </div>
            <p className="hidden print:block mt-14 text-lg leading-9 text-gray-700 whitespace-pre-line">
              {displayBody}
            </p>

            {details.notes && (
              <p className="mt-8 rounded-xl bg-gray-50 px-5 py-4 text-sm text-gray-600">
                {details.notes}
              </p>
            )}

            <div className="mt-auto grid grid-cols-2 gap-8 pt-20 text-sm text-gray-600">
              <div>
                <div className="mx-auto mb-2 h-px w-44 bg-gray-400" />
                Issue Date
                <p className="font-semibold text-gray-900">
                  {formatDate(new Date().toISOString())}
                </p>
              </div>
              <div>
                <div className="mx-auto mb-2 h-px w-44 bg-gray-400" />
                Authorized Signatory
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default CertificatesPage;
