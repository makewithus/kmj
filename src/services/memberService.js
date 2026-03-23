/**
 * Member Service
 * API calls for member/census management
 */

import axiosInstance from "../api/axios.config";

/**
 * Get all members (paginated and filtered)
 * @param {Object} params - Query parameters (page, limit, search, ward, gender, etc.)
 * @returns {Promise} Members list with pagination
 */
export const getAllMembers = async (params = {}) => {
  const response = await axiosInstance.get("/members", { params });
  return response;
};

/**
 * Search members
 * @param {string} query - Search query
 * @param {string} type - Search type (all|name|id|aadhaar|phone)
 * @returns {Promise} Matched members
 */
export const searchMembers = async (query, type = "all") => {
  const response = await axiosInstance.get("/members/search", {
    params: { q: query, type },
  });
  return response;
};

/**
 * Get member by ID
 * @param {string} id - Member ID
 * @returns {Promise} Member details
 */
export const getMemberById = async (id) => {
  const response = await axiosInstance.get(`/members/${id}`);
  return response;
};

/**
 * Get family members
 * @param {string} familyId - Family/Mahal ID (ward/house format)
 * @returns {Promise} Family members list
 */
export const getFamilyMembers = async (familyId) => {
  const response = await axiosInstance.get(`/members/family/${familyId}`);
  return response;
};

/**
 * Create new member (census entry)
 * @param {Object} memberData - Member data (25 fields)
 * @returns {Promise} Created member
 */
export const createMember = async (memberData) => {
  const response = await axiosInstance.post("/members", memberData);
  return response;
};

/**
 * Update member
 * @param {string} id - Member ID
 * @param {Object} memberData - Updated member data
 * @returns {Promise} Updated member
 */
export const updateMember = async (id, memberData) => {
  const response = await axiosInstance.put(`/members/${id}`, memberData);
  return response;
};

/**
 * Delete member
 * @param {string} id - Member ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteMember = async (id) => {
  const response = await axiosInstance.delete(`/members/${id}`);
  return response;
};

/**
 * Get member statistics (Admin only)
 * @returns {Promise} Member stats
 */
export const getMemberStats = async () => {
  const response = await axiosInstance.get("/members/stats");
  return response;
};

/**
 * Get total count of members (for pagination calculation)
 * @param {Object} params - Optional filters (ward, gender, relation)
 * @returns {Promise} Total count and pages info
 */
export const getMemberCount = async (params = {}) => {
  const response = await axiosInstance.get("/members/count", { params });
  return response;
};

/**
 * Bulk import members (Admin only)
 * @param {Array} members - Array of member objects
 * @returns {Promise} Import results
 */
export const importMembers = async (members) => {
  const response = await axiosInstance.post("/members/import", { members });
  return response;
};

export default {
  getAllMembers,
  searchMembers,
  getMemberById,
  getFamilyMembers,
  createMember,
  updateMember,
  deleteMember,
  getMemberStats,
  getMemberCount,
  importMembers,
};
