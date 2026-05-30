import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import toast from "react-hot-toast";
import AdminLayout from "../../components/layout/AdminLayout";
import { Card, Button } from "../../components/common";
import financeService from "../../services/financeService";
import { ANIMATION_VARIANTS } from "../../lib/constants";

const FinancePage = () => {
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    breakdown: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const response = await financeService.getStats();
      if (response?.success) {
        setStats(response.data);
      } else {
        toast.error("Failed to load finance data");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to load finance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <AdminLayout>
      {/* Page Header */}
      <motion.div
        variants={ANIMATION_VARIANTS.fadeIn}
        initial="hidden"
        animate="visible"
        className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-[#1F2E2E] via-[#31757A] to-[#41A4A7] bg-clip-text text-transparent leading-relaxed flex items-center gap-3">
            Financial Dashboard
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Monitor mosque revenue, operational expenses, and net profit margins
          </p>
        </div>
        <Button
          variant="outline"
          leftIcon={<RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />}
          onClick={fetchFinanceData}
          disabled={loading}
          className="border-2 border-[#31757A] text-[#31757A] hover:bg-[#E3F9F9]/50 font-semibold"
        >
          Refresh Stats
        </Button>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#31757A]"></div>
          <p className="mt-4 text-gray-600 font-medium">Calculating financial ledgers...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Income */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-green-500/5 rounded-full" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Income</span>
                <span className="p-2.5 bg-green-50 rounded-xl text-green-600">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
              </div>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-4">
                {formatCurrency(stats.totalIncome)}
              </h2>
              <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" /> Collected from billing, accounts & Eid
              </p>
            </motion.div>

            {/* Total Expenses */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-rose-500/5 rounded-full" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Expenses</span>
                <span className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
                  <ArrowDownRight className="h-5 w-5" />
                </span>
              </div>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-4">
                {formatCurrency(stats.totalExpenses)}
              </h2>
              <p className="text-xs text-rose-600 font-semibold mt-2 flex items-center gap-1">
                <TrendingDown className="h-4 w-4" /> Disbursed via active vouchers
              </p>
            </motion.div>

            {/* Net Profit */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`bg-white rounded-3xl p-6 border shadow-xl relative overflow-hidden ${
                stats.netProfit >= 0 ? "border-emerald-100" : "border-red-100"
              }`}
            >
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-blue-500/5 rounded-full" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Net Surplus / Profit</span>
                <span className={`p-2.5 rounded-xl ${
                  stats.netProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                }`}>
                  <DollarSign className="h-5 w-5" />
                </span>
              </div>
              <h2 className={`text-4xl font-extrabold mt-4 ${
                stats.netProfit >= 0 ? "text-emerald-700" : "text-red-700"
              }`}>
                {formatCurrency(stats.netProfit)}
              </h2>
              <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${
                stats.netProfit >= 0 ? "text-emerald-600" : "text-red-600"
              }`}>
                {stats.netProfit >= 0 ? "Positive budget surplus" : "Budget deficit detected"}
              </p>
            </motion.div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Area Chart - Income vs Expense Trends */}
            <Card className="rounded-3xl shadow-xl border-0 overflow-hidden">
              <Card.Header className="bg-linear-to-r from-gray-50 to-[#E3F9F9]/20 border-b border-gray-150">
                <Card.Title className="text-lg font-bold text-[#1F2E2E] flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#31757A]" />
                  Monthly Flow Trend
                </Card.Title>
              </Card.Header>
              <Card.Content className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={stats.breakdown}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          borderRadius: "12px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Area
                        type="monotone"
                        name="Income"
                        dataKey="income"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorIncome)"
                      />
                      <Area
                        type="monotone"
                        name="Expenses"
                        dataKey="expenses"
                        stroke="#ef4444"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorExpenses)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card.Content>
            </Card>

            {/* Bar Chart - Net Surplus Comparison */}
            <Card className="rounded-3xl shadow-xl border-0 overflow-hidden">
              <Card.Header className="bg-linear-to-r from-gray-50 to-[#E3F9F9]/20 border-b border-gray-150">
                <Card.Title className="text-lg font-bold text-[#1F2E2E] flex items-center gap-2">
                  <Percent className="h-5 w-5 text-[#31757A]" />
                  Monthly Net Surplus
                </Card.Title>
              </Card.Header>
              <Card.Content className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={stats.breakdown}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          borderRadius: "12px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Bar
                        name="Net Surplus"
                        dataKey="profit"
                        radius={[6, 6, 0, 0]}
                        fill="#31757A"
                      >
                        {stats.breakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.profit >= 0 ? "#31757A" : "#ef4444"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Breakdown Ledger Table */}
          <Card className="rounded-3xl shadow-xl border-0 overflow-hidden">
            <Card.Header className="bg-linear-to-r from-gray-50 to-[#E3F9F9]/20 border-b border-gray-150">
              <Card.Title className="text-lg font-bold text-[#1F2E2E] flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#31757A]" />
                Recent Financial Ledger
              </Card.Title>
            </Card.Header>
            <Card.Content className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Income</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Expenses</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Net Surplus</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {stats.breakdown.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{row.month}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{formatCurrency(row.income)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-rose-600">{formatCurrency(row.expenses)}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                          row.profit >= 0 ? "text-emerald-700" : "text-rose-700"
                        }`}>
                          {formatCurrency(row.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Content>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
};

export default FinancePage;
