"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { apiRequest } from "@/lib/api";
import { Plus, Warehouse, AlertCircle, X, Edit } from "lucide-react";

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/warehouses");
      setWarehouses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await apiRequest("/warehouses", {
        method: "POST",
        body: JSON.stringify({ name, code: code.toUpperCase(), address, active: true }),
      });

      setShowModal(false);
      setName("");
      setCode("");
      setAddress("");
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to create warehouse.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F3] flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Header
          title="Warehouse Settings"
          description="Manage physical storage facilities, distribution hubs, and main depots"
        />

        <div className="p-6 flex-1 space-y-6">
          <div className="bg-white p-4 rounded-xl border border-[#DDE4DC] flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2 text-xs text-[#677269]">
              <Warehouse size={18} className="text-[#2F6B45]" />
              <span>Warehouses organize storage locations into distinct physical sites.</span>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-[#2F6B45] hover:bg-[#255738] text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} />
              Add Warehouse
            </button>
          </div>

          {/* Warehouses Cards / Table */}
          <div className="bg-white rounded-xl border border-[#DDE4DC] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F8F3] border-b border-[#DDE4DC] text-[#677269] font-semibold">
                    <th className="p-3.5">Warehouse Code</th>
                    <th className="p-3.5">Warehouse Name</th>
                    <th className="p-3.5">Physical Address</th>
                    <th className="p-3.5">Child Locations Count</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE4DC]">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#677269]">
                        Loading warehouses...
                      </td>
                    </tr>
                  ) : warehouses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#677269]">
                        No warehouses configured yet.
                      </td>
                    </tr>
                  ) : (
                    warehouses.map((wh) => (
                      <tr key={wh.id} className="hover:bg-[#F1F7F2] transition-colors">
                        <td className="p-3.5 font-bold text-[#17201A] font-mono">{wh.code}</td>
                        <td className="p-3.5 font-semibold text-[#17201A]">{wh.name}</td>
                        <td className="p-3.5 text-[#677269]">{wh.address || "N/A"}</td>
                        <td className="p-3.5 text-[#677269] font-semibold">{wh.locations?.length || 0} location(s)</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add Warehouse Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#DDE4DC] shadow-xl w-full max-w-md p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-[#DDE4DC] pb-3">
              <h2 className="text-base font-bold text-[#17201A]">Add Warehouse</h2>
              <button onClick={() => setShowModal(false)} className="text-[#8B958D] hover:text-[#17201A]">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[#C44747] flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateWarehouse} className="space-y-3">
              <div>
                <label className="block font-semibold text-[#17201A] mb-1">Warehouse Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Central Logistics Depot"
                  className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#17201A] mb-1">Warehouse Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WH-MAIN"
                  className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45] font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#17201A] mb-1">Physical Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="100 Industrial Parkway, Zone B"
                  className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DDE4DC]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#17201A] font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#2F6B45] hover:bg-[#255738] text-white font-semibold rounded-lg shadow-sm"
                >
                  {submitting ? "Saving..." : "Save Warehouse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
