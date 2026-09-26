"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { apiRequest } from "@/lib/api";
import { Plus, Boxes, AlertCircle, X } from "lucide-react";

export default function LocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [warehouseId, setWarehouseId] = useState("");
  const [parentLocationId, setParentLocationId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const locRes = await apiRequest("/locations");
      setLocations(locRes);
      const whRes = await apiRequest("/warehouses");
      setWarehouses(whRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await apiRequest("/locations", {
        method: "POST",
        body: JSON.stringify({
          warehouse_id: parseInt(warehouseId),
          parent_location_id: parentLocationId ? parseInt(parentLocationId) : null,
          name,
          code: code.toUpperCase(),
          active: true,
        }),
      });

      setShowModal(false);
      setWarehouseId("");
      setParentLocationId("");
      setName("");
      setCode("");
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to create storage location.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F3] flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Header
          title="Storage Locations"
          description="Configure warehouse sub-locations (Aisles, Racks, Shelves, Bins)"
        />

        <div className="p-6 flex-1 space-y-6">
          <div className="bg-white p-4 rounded-xl border border-[#DDE4DC] flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2 text-xs text-[#677269]">
              <Boxes size={18} className="text-[#2F6B45]" />
              <span>Hierarchical storage structure: Warehouse &rarr; Aisle &rarr; Rack &rarr; Shelf.</span>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-[#2F6B45] hover:bg-[#255738] text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} />
              Add Location
            </button>
          </div>

          {/* Locations Table */}
          <div className="bg-white rounded-xl border border-[#DDE4DC] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F8F3] border-b border-[#DDE4DC] text-[#677269] font-semibold">
                    <th className="p-3.5">Location Code</th>
                    <th className="p-3.5">Location Name</th>
                    <th className="p-3.5">Warehouse</th>
                    <th className="p-3.5">Parent Location</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE4DC]">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#677269]">
                        Loading storage locations...
                      </td>
                    </tr>
                  ) : locations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#677269]">
                        No storage locations configured yet.
                      </td>
                    </tr>
                  ) : (
                    locations.map((loc) => (
                      <tr key={loc.id} className="hover:bg-[#F1F7F2] transition-colors">
                        <td className="p-3.5 font-bold text-[#17201A] font-mono">{loc.code}</td>
                        <td className="p-3.5 font-semibold text-[#17201A]">{loc.name}</td>
                        <td className="p-3.5 text-[#2F6B45] font-medium">{loc.warehouse_name}</td>
                        <td className="p-3.5 text-[#677269]">{loc.parent_name || "Top Level"}</td>
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

      {/* Add Location Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#DDE4DC] shadow-xl w-full max-w-md p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-[#DDE4DC] pb-3">
              <h2 className="text-base font-bold text-[#17201A]">Add Storage Location</h2>
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

            <form onSubmit={handleCreateLocation} className="space-y-3">
              <div>
                <label className="block font-semibold text-[#17201A] mb-1">Warehouse *</label>
                <select
                  required
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#17201A] mb-1">Parent Location (Optional)</label>
                <select
                  value={parentLocationId}
                  onChange={(e) => setParentLocationId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                >
                  <option value="">None (Top Level Aisle/Zone)</option>
                  {locations
                    .filter((l) => !warehouseId || l.warehouse_id === parseInt(warehouseId))
                    .map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#17201A] mb-1">Location Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aisle A - Rack 2"
                  className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#17201A] mb-1">Location Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WH-MAIN-A2"
                  className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45] font-mono uppercase"
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
                  {submitting ? "Saving..." : "Save Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
