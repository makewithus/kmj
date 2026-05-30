/**
 * Finance Service
 * API calls for finance management (admin side)
 */

import axiosInstance from "../api/axios.config";

export const financeService = {
  /**
   * Get finance overview (Total income, total expense, net profit, breakdown)
   * @returns {Promise} API response
   */
  getStats: async () => {
    const response = await axiosInstance.get("/finance/stats");
    return response;
  },
};

export default financeService;
