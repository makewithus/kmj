/**
 * Notice Service
 * API calls for notice board management - Simplified version
 */

import axiosInstance from "../api/axios.config";

/**
 * Get all active (non-expired) notices (Public)
 * @param {Object} params - Query parameters (page, limit, includeExpired)
 * @returns {Promise} Notices list
 */
export const getAllNotices = async (params = {}) => {
  const response = await axiosInstance.get("/notices", { params });
  return response;
};

/**
 * Get notice by ID (Public)
 * @param {string} id - Notice ID
 * @returns {Promise} Notice details
 */
export const getNoticeById = async (id) => {
  const response = await axiosInstance.get(`/notices/${id}`);
  return response;
};

/**
 * Create new notice (Admin only)
 * @param {Object} noticeData - Notice data { title, content, expiryDate }
 * @returns {Promise} Created notice
 */
export const createNotice = async (noticeData) => {
  const response = await axiosInstance.post("/notices", noticeData);
  return response;
};

/**
 * Update notice (Admin only)
 * @param {string} id - Notice ID
 * @param {Object} noticeData - Updated notice data
 * @returns {Promise} Updated notice
 */
export const updateNotice = async (id, noticeData) => {
  const response = await axiosInstance.put(`/notices/${id}`, noticeData);
  return response;
};

/**
 * Delete notice (Admin only)
 * @param {string} id - Notice ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteNotice = async (id) => {
  const response = await axiosInstance.delete(`/notices/${id}`);
  return response;
};

/**
 * Increment notice view count (Public)
 * @param {string} id - Notice ID
 * @returns {Promise} Updated view count
 */
export const incrementViews = async (id) => {
  const response = await axiosInstance.post(`/notices/${id}/view`);
  return response;
};

export default {
  getAllNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  incrementViews,
};
