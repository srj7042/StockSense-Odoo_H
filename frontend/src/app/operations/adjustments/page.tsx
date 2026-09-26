"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { apiRequest } from "@/lib/api";
import { Plus, Sliders, CheckCircle2, AlertCircle, X, Trash2 } from "lucide-react";

export default function AdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [warehouseId, setWarehouseId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [reason, setReason] = useState("Count Correction");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Array<{ product_id: string; system_quantity: number; physical_quantity: number; delta: number }>>([
    { product_id: "", system_quantity: 0, physical_quantity: 0, delta: 0 },
  ]);
  const [postingId, setPostingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/adjustments");
      setAdjustments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiRequest("/warehouses").then(setWarehouses).catch(() => {});
    apiRequest("/locations").then(setLocations).catch(() => {});
    apiRequest("/products").then(setProducts).catch(() => {});
    loadData();
  }, []);

  const handleLocationChange = (locId: string) => {
    setLocationId(locId);
    const loc = locations.find((l) => l.id === parseInt(locId));
    if (loc) setWarehouseId(loc.warehouse_id.toString());
  };

  const handleProductChange = (idx: number, prodId: string) => {
    const updated = [...items];
    updated[idx].product_id = prodId;

    if (prodId && locationId) {
      const prod = products.find((p) => p.id === parseInt(prodId));
      if (prod) {
        const locStock = prod.stock_by_location?.find((l: any) => l.location_id === parseInt(locationId));
        const sysQty = locStock ? locStock.quantity : 0;
        updated[idx].system_quantity = sysQty;
        updated[idx].physical_quantity = sysQty;
        updated[idx].delta = 0;
      }
    }
    setItems(updated);
  };

  const handlePhysicalQtyChange = (idx: number, physQty: number) => {
    const updated = [...items];
    updated[idx].physical_quantity = physQty;
    updated[idx].delta = physQty - updated[idx].system_quantity;
    setItems(updated);
  };

  const handleAddItemRow = () => {
    setItems([...items, { product_id: "", system_quantity: 0, physical_quantity: 0, delta: 0 }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!locationId || !warehouseId) {
      setFormError("Location and Warehouse are required.");
      return;
    }
    if (!reason) {
      setFormError("Adjustment reason is mandatory.");
      return;
    }

    const formattedItems = items
      .filter((i) => i.product_id)
      .map((i) => ({ product_id: parseInt(i.product_id), physical_quantity: parseFloat(i.physical_quantity.toString()) }));

    if (formattedItems.length === 0) {
      setFormError("Please select at least one product item.");
      return;
    }

    try {
      await apiRequest("/adjustments", {
        method: "POST",
        body: JSON.stringify({
          warehouse_id: parseInt(warehouseId),
          location_id: parseInt(locationId),
          reason,
          notes,
          items: formattedItems,
        }),
      });

      setShowModal(false);
      setWarehouseId("");
      setLocationId("");
      setReason("Count Correction");
      setNotes("");
      setItems([{ product_id: "", system_quantity: 0, physical_quantity: 0, delta: 0 }]);
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Failed to create adjustment record.");
    }
  };

  const handlePostAdjustment = async (id: number) => {
    if (!confirm("Are you sure you want to post this inventory adjustment? Stock delta will be posted to the ledger.")) return;
    setPostingId(id);
    try {
      await apiRequest(`/adjustments/${id}/post`, { method: "POST" });
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to post adjustment.");
    } finally {
      setPostingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F3] flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Header
          title="Inventory Adjustments"
          description="Reconcile physical stock counts with system balances and record auditable deltas"
        />

        <div className="p-6 flex-1 space-y-6">
          <div className="bg-white p-4 rounded-xl border border-[#DDE4DC] flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2 text-xs text-[#677269]">
              <Sliders size={18} className="text-[#2F6B45]" />
              <span>Adjustments post only the difference (delta = physical - system). Reason is mandatory.</span>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-[#2F6B45] hover:bg-[#255738] text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} />
              Create Adjustment
            </button>
          </div>

          {/* Adjustments Table */}
          <div className="bg-white rounded-xl border border-[#DDE4DC] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F8F3] border-b border-[#DDE4DC] text-[#677269] font-semibold">
                    <th className="p-3.5">Adjustment No</th>
                    <th className="p-3.5">Warehouse</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Reason</th>
                    <th className="p-3.5">Deltas Summary</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Created By</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE4DC]">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[#677269]">
                        Loading inventory adjustments...
                      </td>
                    </tr>
                  ) : adjustments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[#677269]">
                        No adjustments recorded yet. Create an adjustment for physical count mismatches.
                      </td>
                    </tr>
                  ) : (
                    adjustments.map((a) => (
                      <tr key={a.id} className="hover:bg-[#F1F7F2] transition-colors">
                        <td className="p-3.5 font-bold text-[#17201A]">{a.adjustment_no}</td>
                        <td className="p-3.5 text-[#677269]">{a.warehouse_name}</td>
                        <td className="p-3.5 font-medium text-[#17201A]">{a.location_name}</td>
                        <td className="p-3.5 font-semibold text-[#17201A]">{a.reason}</td>
                        <td className="p-3.5 font-mono">
                          {a.items.map((i: any) => (
                            <span
                              key={i.id}
                              className={`mr-2 font-bold ${
                                i.delta > 0
                                  ? "text-[#3D8A56]"
                                  : i.delta < 0
                                  ? "text-[#C44747]"
                                  : "text-gray-500"
                              }`}
                            >
                              {i.product_name}: {i.delta > 0 ? `+${i.delta}` : i.delta}
                            </span>
                          ))}
                        </td>
                        <td className="p-3.5">
                          <StatusBadge status={a.status} />
                        </td>
                        <td className="p-3.5 text-[#677269]">{a.created_by_name}</td>
                        <td className="p-3.5 text-center">
                          {a.status === "DRAFT" ? (
                            <button
                              onClick={() => handlePostAdjustment(a.id)}
                              disabled={postingId === a.id}
                              className="px-3 py-1 bg-[#2F6B45] hover:bg-[#255738] text-white font-semibold rounded text-xs inline-flex items-center gap-1 shadow-sm disabled:opacity-50"
                            >
                              <CheckCircle2 size={13} />
                              {postingId === a.id ? "Posting..." : "Post Adjustment"}
                            </button>
                          ) : (
                            <span className="text-[#3D8A56] font-semibold text-[11px]">Posted</span>
                          )}
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

      {/* Create Adjustment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#DDE4DC] shadow-xl w-full max-w-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#DDE4DC] pb-3">
              <h2 className="text-base font-bold text-[#17201A]">Create Stock Adjustment</h2>
              <button onClick={() => setShowModal(false)} className="text-[#8B958D] hover:text-[#17201A]">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#C44747] flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdjustment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#17201A] mb-1">Target Location *</label>
                  <select
                    required
                    value={locationId}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                  >
                    <option value="">Select Location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.warehouse_name} &rarr; {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#17201A] mb-1">Mandatory Reason *</label>
                  <select
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                  >
                    <option value="Damaged">Damaged Goods</option>
                    <option value="Lost">Lost / Theft</option>
                    <option value="Count Correction">Count Correction</option>
                    <option value="Opening Balance">Opening Balance</option>
                    <option value="Expired">Expired Stock</option>
                    <option value="Other">Other Reason</option>
                  </select>
                </div>
              </div>

              {/* Product Rows with Auto System Qty and Physical Count Input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-semibold text-[#17201A]">Adjusted Products *</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[#2F6B45] font-semibold hover:underline text-xs"
                  >
                    + Add Product Line
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((row, idx) => (
                    <div key={idx} className="p-3 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <select
                          required
                          value={row.product_id}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                        >
                          <option value="">Select Product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-1.5 text-[#C44747] hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {row.product_id && (
                        <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-[#DDE4DC]">
                          <div>
                            <span className="text-[#677269] text-[10px] block">System Qty</span>
                            <span className="font-bold text-[#17201A]">{row.system_quantity}</span>
                          </div>

                          <div>
                            <span className="text-[#677269] text-[10px] block">Physical Count</span>
                            <input
                              type="number"
                              min={0}
                              required
                              value={row.physical_quantity}
                              onChange={(e) => handlePhysicalQtyChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-0.5 bg-white border border-[#DDE4DC] rounded text-center font-bold focus:outline-none focus:border-[#2F6B45]"
                            />
                          </div>

                          <div>
                            <span className="text-[#677269] text-[10px] block">Calculated Delta</span>
                            <span
                              className={`font-bold ${
                                row.delta > 0
                                  ? "text-[#3D8A56]"
                                  : row.delta < 0
                                  ? "text-[#C44747]"
                                  : "text-gray-500"
                              }`}
                            >
                              {row.delta > 0 ? `+${row.delta}` : row.delta}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#17201A] mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detailed explanation of physical audit count..."
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
                  className="px-4 py-1.5 bg-[#2F6B45] hover:bg-[#255738] text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Adjustment Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
