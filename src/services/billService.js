/**
 * Bill Service
 * API calls for billing and payment management
 */

import axiosInstance from "../api/axios.config";

/**
 * Account types (16 types from old system)
 */
export const ACCOUNT_TYPES = [
  { value: "Dua_Friday", label: "Dua Friday" },
  { value: "Donation", label: "Donation (സംഭാവന)" },
  { value: "Sunnath Fee", label: "Sunnath Fee" },
  { value: "Marriage Fee", label: "Marriage Fee" },
  {
    value: "Product Turnover",
    label: "Product Turnover (ഉൽപ്പന്നങ്ങൾ വിറ്റുവരവ്)",
  },
  { value: "Rental_Basis", label: "Rental Basis" },
  {
    value: "Devotional Dedication",
    label: "Devotional Dedication (കാണിക്ക വഞ്ചി)",
  },
  { value: "Dead Fee", label: "Funeral Ceremony (മയ്യത്ത് പരിപാലനം)" },
  { value: "New Membership", label: "New Membership" },
  { value: "Certificate Fee", label: "Certificate Fee" },
  { value: "Eid ul Adha", label: "Eid ul Adha" },
  { value: "Eid al-Fitr", label: "Eid al-Fitr" },
  { value: "Madrassa", label: "Madrassa" },
  { value: "Sadhu", label: "Sadhu" },
  { value: "Land", label: "Land" },
  { value: "Nercha", label: "Nercha" },
];

/**
 * Get all bills (paginated and filtered)
 * @param {Object} params - Query parameters
 * @returns {Promise} Bills list with pagination
 */
export const getAllBills = async (params = {}) => {
  const response = await axiosInstance.get("/bills", { params });
  return response;
};

/**
 * Get bill by ID
 * @param {string} id - Bill ID
 * @returns {Promise} Bill details
 */
export const getBillById = async (id) => {
  const response = await axiosInstance.get(`/bills/${id}`);
  return response;
};

/**
 * Get bill by receipt number
 * @param {string} receiptNo - Receipt number
 * @returns {Promise} Bill details
 */
export const getBillByReceiptNo = async (receiptNo) => {
  const response = await axiosInstance.get(`/bills/receipt/${receiptNo}`);
  return response;
};

/**
 * Get member's billing history
 * @param {string} mahalId - Mahal ID (ward/house format)
 * @param {Object} params - Query parameters (limit, page)
 * @returns {Promise} Member's bills
 */
export const getMemberBills = async (mahalId, params = {}) => {
  const response = await axiosInstance.get(`/bills/member/${mahalId}`, {
    params,
  });
  return response;
};

/**
 * Create new bill/payment (Quick Pay)
 * @param {Object} billData - Bill data { mahalId, amount, accountType, paymentMethod, notes }
 * @returns {Promise} Created bill with receipt
 */
export const createBill = async (billData) => {
  const response = await axiosInstance.post("/bills", billData);
  return response;
};

/**
 * Update bill
 * @param {string} id - Bill ID
 * @param {Object} billData - Updated bill data
 * @returns {Promise} Updated bill
 */
export const updateBill = async (id, billData) => {
  const response = await axiosInstance.put(`/bills/${id}`, billData);
  return response;
};

/**
 * Delete bill (Admin only)
 * @param {string} id - Bill ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteBill = async (id) => {
  const response = await axiosInstance.delete(`/bills/${id}`);
  return response;
};

/**
 * Get receipt data for PDF/print
 * @param {string} id - Bill ID
 * @returns {Promise} Receipt data
 */
export const getReceiptData = async (id) => {
  const response = await axiosInstance.get(`/bills/${id}/receipt`);
  return response;
};

/**
 * Get billing statistics (Admin only)
 * @param {Object} params - Date range filters
 * @returns {Promise} Billing stats
 */
export const getBillStats = async (params = {}) => {
  const response = await axiosInstance.get("/bills/stats", { params });
  return response;
};

/**
 * Convert number to words (Indian numbering system)
 * @param {number} num - Number to convert
 * @returns {string} Number in words
 */
export const numberToWords = (num) => {
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if ((num = num.toString()).length > 9) return "overflow";
  const n = ("000000000" + num)
    .substr(-9)
    .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return "";

  let str = "";
  str +=
    n[1] != 0
      ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + " Crore "
      : "";
  str +=
    n[2] != 0
      ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + " Lakh "
      : "";
  str +=
    n[3] != 0
      ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + " Thousand "
      : "";
  str +=
    n[4] != 0
      ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + " Hundred "
      : "";
  str +=
    n[5] != 0
      ? (str != "" ? "and " : "") +
        (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]]) +
        " Only"
      : "";

  return str.trim();
};

export default {
  getAllBills,
  getBillById,
  getBillByReceiptNo,
  getMemberBills,
  createBill,
  updateBill,
  deleteBill,
  getReceiptData,
  getBillStats,
  ACCOUNT_TYPES,
  numberToWords,
};
