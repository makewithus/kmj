/**
 * Portal Service
 * API calls for User Portal and Jamat Portal
 */

import axiosInstance from "../api/axios.config";

const BASE = "/portal";

// ─── User Portal ────────────────────────────────────────────────────────────

export const userPortalLoginAPI = (mahalId, phone) =>
  axiosInstance.post(`${BASE}/user/login`, { mahalId, phone });

export const getUserPortalFamilyAPI = (token) =>
  axiosInstance.get(`${BASE}/user/family`, {
    headers: { Authorization: `Bearer ${token}` },
  });

// ─── Jamat Portal (Admin management) ───────────────────────────────────────

export const createJamatPortalAPI = (data) =>
  axiosInstance.post(`${BASE}/jamat`, data);

export const listJamatPortalsAPI = () => axiosInstance.get(`${BASE}/jamat`);

export const deleteJamatPortalAPI = (slug) =>
  axiosInstance.delete(`${BASE}/jamat/${slug}`);

export const updateJamatCredentialsAPI = (slug, data) =>
  axiosInstance.put(`${BASE}/jamat/${slug}/credentials`, data);

// ─── Jamat Portal (Public) ──────────────────────────────────────────────────

export const checkJamatExistsAPI = (slug) =>
  axiosInstance.get(`${BASE}/jamat/${slug}/exists`);

export const jamatPortalLoginAPI = (slug, username, password) =>
  axiosInstance.post(`${BASE}/jamat/${slug}/login`, { username, password });

export const jamatForgotPasswordAPI = (slug, username, newPassword) =>
  axiosInstance.put(`${BASE}/jamat/${slug}/forgot-password`, {
    username,
    newPassword,
  });

// ─── Jamat Portal (Authenticated data) ─────────────────────────────────────

const jamatHeaders = (token) => ({ Authorization: `Bearer ${token}` });

export const getJamatSettingsAPI = (slug, token) =>
  axiosInstance.get(`${BASE}/jamat/${slug}/settings`, {
    headers: jamatHeaders(token),
  });

export const updateJamatSettingsAPI = (slug, token, settings) =>
  axiosInstance.put(`${BASE}/jamat/${slug}/settings`, settings, {
    headers: jamatHeaders(token),
  });

export const getJamatModuleDataAPI = (slug, module, token) =>
  axiosInstance.get(`${BASE}/jamat/${slug}/data/${module}`, {
    headers: jamatHeaders(token),
  });

export const addJamatModuleItemAPI = (slug, module, token, data) =>
  axiosInstance.post(`${BASE}/jamat/${slug}/data/${module}`, data, {
    headers: jamatHeaders(token),
  });

export const updateJamatModuleItemAPI = (slug, module, itemId, token, data) =>
  axiosInstance.put(`${BASE}/jamat/${slug}/data/${module}/${itemId}`, data, {
    headers: jamatHeaders(token),
  });

export const deleteJamatModuleItemAPI = (slug, module, itemId, token) =>
  axiosInstance.delete(`${BASE}/jamat/${slug}/data/${module}/${itemId}`, {
    headers: jamatHeaders(token),
  });

// ─── Custom Field Schemas ───────────────────────────────────────────────────

/** Get the custom field schema for a module */
export const getModuleSchemaAPI = (slug, module, token) =>
  axiosInstance.get(`${BASE}/jamat/${slug}/schema/${module}`, {
    headers: jamatHeaders(token),
  });

/**
 * Save (replace) custom field schema for a module.
 * @param {string} slug
 * @param {string} module
 * @param {string} token
 * @param {Array<{name,label,type,required,options?}>} fields
 */
export const saveModuleSchemaAPI = (slug, module, token, fields) =>
  axiosInstance.put(
    `${BASE}/jamat/${slug}/schema/${module}`,
    { fields },
    { headers: jamatHeaders(token) },
  );

// ─── Full Database Export / Migration ──────────────────────────────────────

/**
 * Download the entire jamat DB as a structured JSON object.
 * Works with either the jamat portal token or an admin token.
 */
export const exportJamatDatabaseAPI = (slug, token) =>
  axiosInstance.get(`${BASE}/jamat/${slug}/export`, {
    headers: jamatHeaders(token),
  });
