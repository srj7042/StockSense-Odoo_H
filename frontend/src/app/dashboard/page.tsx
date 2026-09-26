"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { DemoFlowBanner } from "@/components/DemoFlowBanner";
import { StatusBadge } from "@/components/StatusBadge";
import { apiRequest } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend
} from "recharts";
import {
  Package, Boxes, AlertTriangle, XCircle, Inbox, Truck, ArrowLeftRight, Sliders, RefreshCw
} from "lucide-react";

export default function DashboardPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [days, setDays] = useState(7);
  const [categories, setCategories] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedWarehouse) params.append("warehouse_id", selectedWarehouse);
      if (selectedCategory) params.append("category_id", selectedCategory);

      const kpiRes = await apiRequest(`/dashboard/kpis?${params.toString()}`);
      setKpis(kpiRes);

      params.append("days", days.toString());
      const chartRes = await apiRequest(`/dashboard/charts?${params.toString()}`);
      setCharts(chartRes);

      const movRes = await apiRequest("/stock/movements");
      setRecentMovements(movRes.slice(0, 10)); // Top 10 recent
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiRequest("/categories").then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedWarehouse, selectedCategory, days]);

  return (
    <div className="min-h-screen bg-[#F7F8F3] flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Header
          title="Dashboard"
          description="Real-time stock balances, pending operations, and movement analytics"
          selectedWarehouseId={selectedWarehouse}
          onWarehouseChange={setSelectedWarehouse}
        />

        <div className="p-6 flex-1 space-y-6">
          <DemoFlowBanner />

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#DDE4DC] flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-[#17201A]">Filters:</span>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg px-2.5 py-1.5 text-[#17201A] focus:outline-none focus:border-[#2F6B45]"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Trend Days Selector */}
              <div className="flex items-center gap-1 bg-[#F7F8F3] p-1 rounded-lg border border-[#DDE4DC]">
                <button
                  onClick={() => setDays(7)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    days === 7 ? "bg-[#2F6B45] text-white shadow-sm" : "text-[#677269]"
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setDays(30)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    days === 30 ? "bg-[#2F6B45] text-white shadow-sm" : "text-[#677269]"
                  }`}
                >
                  30 Days
                </button>
              </div>
            </div>

            <button
              onClick={fetchDashboardData}
              className="px-3 py-1.5 bg-[#F1F7F2] hover:bg-[#E7F2E9] border border-[#B8DBC0] text-[#2F6B45] font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh Data
            </button>
          </div>

          {/* KPI Cards Section */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-[#DDE4DC] shadow-sm">
              <div className="flex items-center justify-between text-[#677269] mb-1">
                <span className="text-[11px] font-medium">Products</span>
                <Package size={16} className="text-[#2F6B45]" />
              </div>
              <p className="text-xl font-bold text-[#17201A]">{kpis?.total_products ?? 0}</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-[#DDE4DC] shadow-sm">
              <div className="flex items-center justify-between text-[#677269] mb-1">
                <span className="text-[11px] font-medium">On-Hand</span>
                <Boxes size={16} className="text-[#2F6B45]" />
              </div>
              <p className="text-xl font-bold text-[#17201A]">{kpis?.total_on_hand_units ?? 0}</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-[#DDE4DC] shadow-sm">
              <div className="flex items-center justify-between text-[#677269] mb-1">
                <span className="text-[11px] font-medium">Low Stock</span>
                <AlertTriangle size={16} className="text-[#C68A2F]" />
              </div>
              <p className="text-xl font-bold text-[#C68A2F]">{kpis?.low_stock_count ?? 0}</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-[#DDE4DC] shadow-sm">
              <div className="flex items-center justify-between text-[#677269] mb-1">
                <span className="text-[11px] font-medium">Out of Stock</span>
                <XCircle size={16} className="text-[#C44747]" />
              </div>
              <p className="text-xl font-bold text-[#C44747]">{kpis?.out_of_stock_count ?? 0}</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-[#DDE4DC] shadow-sm">
              <div className="flex items-center justify-between text-[#677269] mb-1">
                <span className="text-[11px] font-medium">Receipts</span>
                <Inbox size={16} className="text-[#2F6B45]" />
              </div>
              <p className="text-xl font-bold text-[#17201A]">{kpis?.pending_receipts_count ?? 0}</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-[#DDE4DC] shadow-sm">
              <div className="flex items-center justify-between text-[#677269] mb-1">
                <span className="text-[11px] font-medium">Deliveries</span>
                <Truck size={16} className="text-[#2F6B45]" />
              </div>
              <p className="text-xl font-bold text-[#17201A]">{kpis?.pending_deliveries_count ?? 0}</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-[#DDE4DC] shadow-sm">
              <div className="flex items-center justify-between text-[#677269] mb-1">
                <span className="text-[11px] font-medium">Transfers</span>
                <ArrowLeftRight size={16} className="text-[#2F6B45]" />
              </div>
              <p className="text-xl font-bold text-[#17201A]">{kpis?.in_progress_transfers_count ?? 0}</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-[#DDE4DC] shadow-sm">
              <div className="flex items-center justify-between text-[#677269] mb-1">
                <span className="text-[11px] font-medium">Adjustments</span>
                <Sliders size={16} className="text-[#677269]" />
              </div>
              <p className="text-xl font-bold text-[#17201A]">{kpis?.recent_adjustments_count ?? 0}</p>
            </div>
          </div>

          {/* Analytics Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Stock by Warehouse */}
            <div className="bg-white p-5 rounded-xl border border-[#DDE4DC] shadow-sm">
              <h3 className="font-bold text-sm text-[#17201A] mb-1">Stock by Warehouse</h3>
              <p className="text-xs text-[#677269] mb-4">Total on-hand stock per warehouse location</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.stock_by_warehouse || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7F2E9" />
                    <XAxis dataKey="warehouse_name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total_stock" fill="#2F6B45" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Inbound vs Outbound Trend */}
            <div className="bg-white p-5 rounded-xl border border-[#DDE4DC] shadow-sm">
              <h3 className="font-bold text-sm text-[#17201A] mb-1">Inbound vs Outbound Trend</h3>
              <p className="text-xs text-[#677269] mb-4">Daily inventory movement over last {days} days</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts?.movement_trend || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7F2E9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Line type="monotone" dataKey="inbound" stroke="#3D8A56" strokeWidth={2} name="Inbound Stock" />
                    <Line type="monotone" dataKey="outbound" stroke="#C44747" strokeWidth={2} name="Outbound Stock" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Low Stock Risk */}
            <div className="bg-white p-5 rounded-xl border border-[#DDE4DC] shadow-sm">
              <h3 className="font-bold text-sm text-[#17201A] mb-1">Low Stock Risk Items</h3>
              <p className="text-xs text-[#677269] mb-4">Products near or below reorder points</p>
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {(!charts?.low_stock_risk || charts.low_stock_risk.length === 0) ? (
                  <p className="text-xs text-[#677269] py-8 text-center">All products are currently above threshold.</p>
                ) : (
                  charts.low_stock_risk.map((item: any, idx: number) => (
                    <div key={idx} className="p-2.5 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-[#17201A]">
                        <span className="truncate">{item.product_name}</span>
                        <span className="text-[#C44747]">{item.current_stock} / {item.reorder_point}</span>
                      </div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#C44747] h-full"
                          style={{
                            width: `${Math.min(100, (item.current_stock / (item.reorder_point || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent Stock Movement Table */}
          <div className="bg-white rounded-xl border border-[#DDE4DC] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#DDE4DC] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#17201A]">Recent Stock Movements</h3>
                <p className="text-xs text-[#677269]">Latest posted ledger entries</p>
              </div>
              <a href="/ledger" className="text-xs font-semibold text-[#2F6B45] hover:underline">
                View Full Ledger &rarr;
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F8F3] border-b border-[#DDE4DC] text-[#677269] font-semibold">
                    <th className="p-3">Time</th>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Source &rarr; Destination</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE4DC]">
                  {recentMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-[#677269]">
                        Stock movements will appear after operations are posted.
                      </td>
                    </tr>
                  ) : (
                    recentMovements.map((mov) => (
                      <tr key={mov.id} className="hover:bg-[#F1F7F2] transition-colors">
                        <td className="p-3 text-[#677269]">
                          {new Date(mov.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="p-3 font-semibold text-[#17201A]">{mov.reference_no}</td>
                        <td className="p-3 font-medium text-[#17201A]">
                          {mov.product_name} <span className="text-[#677269] text-[10px]">({mov.sku})</span>
                        </td>
                        <td className="p-3">
                          <StatusBadge status={mov.movement_type} />
                        </td>
                        <td className="p-3 text-[#677269]">
                          {mov.source_location_name || "External"} &rarr; {mov.destination_location_name || "External"}
                        </td>
                        <td className="p-3 text-right font-bold text-[#17201A]">
                          {mov.quantity_in > 0 ? `+${mov.quantity_in}` : `-${mov.quantity_out}`}
                        </td>
                        <td className="p-3 text-[#677269]">{mov.created_by_name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
