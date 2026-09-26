"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { apiRequest } from "@/lib/api";
import { Bell, CheckCircle2, ShieldAlert } from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [reorders, setReorders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/alerts?status=${statusFilter}`);
      setAlerts(data);

      const reorderData = await apiRequest("/reorder/rules");
      setReorders(reorderData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleResolveAlert = async (id: number) => {
    try {
      await apiRequest(`/alerts/${id}/resolve`, { method: "PUT" });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F3] flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Header
          title="Inventory Alerts & Reorder Rules"
          description="Rule-based low-stock warnings, out-of-stock notices, and replenishment suggestions"
        />

        <div className="p-6 flex-1 space-y-6">
          {/* Header Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#DDE4DC] flex justify-between items-center shadow-sm text-xs">
            <div className="flex items-center gap-2 text-[#677269]">
              <Bell size={18} className="text-[#C68A2F]" />
              <span>Transparent rule-based stock alerts and automated reorder calculations.</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#17201A]">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg px-3 py-1.5 text-[#17201A] focus:outline-none focus:border-[#2F6B45]"
              >
                <option value="ACTIVE">Active Alerts</option>
                <option value="RESOLVED">Resolved Alerts</option>
                <option value="">All Alerts</option>
              </select>
            </div>
          </div>

          {/* Active Alerts Section */}
          <div className="bg-white rounded-xl border border-[#DDE4DC] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#DDE4DC] flex justify-between items-center">
              <h3 className="font-bold text-sm text-[#17201A]">Active System Alerts</h3>
              <span className="text-xs text-[#677269]">{alerts.length} alert(s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F8F3] border-b border-[#DDE4DC] text-[#677269] font-semibold">
                    <th className="p-3.5">Product Name</th>
                    <th className="p-3.5">SKU</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Alert Type</th>
                    <th className="p-3.5">Severity</th>
                    <th className="p-3.5 text-right">Current Stock</th>
                    <th className="p-3.5 text-right">Reorder Point</th>
                    <th className="p-3.5">Message</th>
                    <th className="p-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE4DC]">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-[#677269]">
                        Loading inventory alerts...
                      </td>
                    </tr>
                  ) : alerts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-[#677269]">
                        No inventory alerts at the moment. All stock levels are healthy!
                      </td>
                    </tr>
                  ) : (
                    alerts.map((a) => (
                      <tr key={a.id} className="hover:bg-[#F1F7F2] transition-colors">
                        <td className="p-3.5 font-bold text-[#17201A]">{a.product_name}</td>
                        <td className="p-3.5 text-[#677269] font-mono">{a.sku}</td>
                        <td className="p-3.5 font-medium text-[#17201A]">{a.location_name}</td>
                        <td className="p-3.5">
                          <StatusBadge status={a.alert_type} />
                        </td>
                        <td className="p-3.5">
                          <StatusBadge status={a.severity} />
                        </td>
                        <td className="p-3.5 text-right font-bold text-[#C44747]">{a.current_quantity}</td>
                        <td className="p-3.5 text-right text-[#677269]">{a.threshold}</td>
                        <td className="p-3.5 text-[#677269]">{a.message}</td>
                        <td className="p-3.5 text-center">
                          {a.status === "ACTIVE" ? (
                            <button
                              onClick={() => handleResolveAlert(a.id)}
                              className="px-2.5 py-1 bg-[#E7F2E9] hover:bg-[#B8DBC0] text-[#2F6B45] font-semibold rounded text-xs inline-flex items-center gap-1 transition-colors"
                            >
                              <CheckCircle2 size={13} />
                              Resolve
                            </button>
                          ) : (
                            <span className="text-gray-400 font-medium">Resolved</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reorder Recommendation Table */}
          <div className="bg-white rounded-xl border border-[#DDE4DC] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#DDE4DC]">
              <h3 className="font-bold text-sm text-[#17201A]">Deterministic Reorder Recommendations</h3>
              <p className="text-xs text-[#677269]">
                Calculated using: <code className="bg-[#F7F8F3] px-1.5 py-0.5 rounded text-[#2F6B45] font-mono">Suggested Quantity = max(0, Target Stock - Available Stock)</code>
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F8F3] border-b border-[#DDE4DC] text-[#677269] font-semibold">
                    <th className="p-3.5">Product</th>
                    <th className="p-3.5">SKU</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5 text-right">Available</th>
                    <th className="p-3.5 text-right">Reorder Point</th>
                    <th className="p-3.5 text-right">Target Stock</th>
                    <th className="p-3.5 text-right">Suggested Order Qty</th>
                    <th className="p-3.5">Preferred Supplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE4DC]">
                  {reorders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[#677269]">
                        No reordering necessary. All stock is above reorder thresholds.
                      </td>
                    </tr>
                  ) : (
                    reorders.map((r, idx) => (
                      <tr key={idx} className="hover:bg-[#F1F7F2] transition-colors">
                        <td className="p-3.5 font-bold text-[#17201A]">{r.product_name}</td>
                        <td className="p-3.5 text-[#677269] font-mono">{r.sku}</td>
                        <td className="p-3.5 text-[#677269]">{r.location_name}</td>
                        <td className="p-3.5 text-right font-bold text-[#C44747]">{r.available_stock}</td>
                        <td className="p-3.5 text-right text-[#677269]">{r.reorder_point}</td>
                        <td className="p-3.5 text-right text-[#677269]">{r.target_stock}</td>
                        <td className="p-3.5 text-right font-bold text-[#2F6B45]">{r.suggested_order_quantity}</td>
                        <td className="p-3.5 text-[#677269]">{r.preferred_supplier_name}</td>
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
