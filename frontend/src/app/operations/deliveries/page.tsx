"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { apiRequest } from "@/lib/api";
import { Plus, Truck, CheckCircle2, AlertCircle, X, Trash2 } from "lucide-react";

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [sourceLocationId, setSourceLocationId] = useState("");
  const [customerRef, setCustomerRef] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Array<{ product_id: string; quantity: number; available_stock?: number }>>([
    { product_id: "", quantity: 1, available_stock: 0 },
  ]);
  const [postingId, setPostingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/deliveries");
      setDeliveries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiRequest("/locations").then(setLocations).catch(() => {});
    apiRequest("/products").then(setProducts).catch(() => {});
    loadData();
  }, []);

  const handleProductChange = (idx: number, prodId: string) => {
    const updated = [...items];
    updated[idx].product_id = prodId;

    if (prodId) {
      const prod = products.find((p) => p.id === parseInt(prodId));
      if (prod && sourceLocationId) {
        const locStock = prod.stock_by_location?.find((l: any) => l.location_id === parseInt(sourceLocationId));
        updated[idx].available_stock = locStock ? locStock.quantity : 0;
      } else if (prod) {
        updated[idx].available_stock = prod.total_stock;
      }
    }
    setItems(updated);
  };

  const handleAddItemRow = () => {
    setItems([...items, { product_id: "", quantity: 1, available_stock: 0 }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!sourceLocationId) {
      setFormError("Source location is required.");
      return;
    }

    const formattedItems = items
      .filter((i) => i.product_id && i.quantity > 0)
      .map((i) => ({ product_id: parseInt(i.product_id), quantity: parseFloat(i.quantity.toString()) }));

    if (formattedItems.length === 0) {
      setFormError("Please select at least one valid product and quantity.");
      return;
    }

    try {
      await apiRequest("/deliveries", {
        method: "POST",
        body: JSON.stringify({
          source_location_id: parseInt(sourceLocationId),
          customer_ref: customerRef,
          notes,
          items: formattedItems,
        }),
      });

      setShowModal(false);
      setSourceLocationId("");
      setCustomerRef("");
      setNotes("");
      setItems([{ product_id: "", quantity: 1, available_stock: 0 }]);
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Failed to create delivery order.");
    }
  };

  const handlePostDelivery = async (id: number) => {
    if (!confirm("Are you sure you want to post this delivery? Stock will be reduced immediately.")) return;
    setPostingId(id);
    try {
      await apiRequest(`/deliveries/${id}/post`, { method: "POST" });
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to post delivery.");
    } finally {
      setPostingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F3] flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Header
          title="Delivery Orders"
          description="Dispatch outgoing goods to customers or external locations"
        />

        <div className="p-6 flex-1 space-y-6">
          <div className="bg-white p-4 rounded-xl border border-[#DDE4DC] flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2 text-xs text-[#677269]">
              <Truck size={18} className="text-[#2F6B45]" />
              <span>Draft delivery orders validate availability. Posting reduces source location stock.</span>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-[#2F6B45] hover:bg-[#255738] text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} />
              Create Delivery
            </button>
          </div>

          {/* Deliveries Table */}
          <div className="bg-white rounded-xl border border-[#DDE4DC] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F8F3] border-b border-[#DDE4DC] text-[#677269] font-semibold">
                    <th className="p-3.5">Delivery No</th>
                    <th className="p-3.5">Source Location</th>
                    <th className="p-3.5">Customer / Reference</th>
                    <th className="p-3.5">Items Summary</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Created By</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE4DC]">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[#677269]">
                        Loading delivery orders...
                      </td>
                    </tr>
                  ) : deliveries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[#677269]">
                        No delivery orders found. Create a delivery to dispatch stock.
                      </td>
                    </tr>
                  ) : (
                    deliveries.map((d) => (
                      <tr key={d.id} className="hover:bg-[#F1F7F2] transition-colors">
                        <td className="p-3.5 font-bold text-[#17201A]">{d.delivery_no}</td>
                        <td className="p-3.5 font-medium text-[#17201A]">{d.source_location_name}</td>
                        <td className="p-3.5 text-[#677269]">{d.customer_ref || "Standard Dispatch"}</td>
                        <td className="p-3.5 text-[#677269]">
                          {d.items.map((i: any) => `${i.product_name} (${i.quantity} ${i.unit})`).join(", ")}
                        </td>
                        <td className="p-3.5">
                          <StatusBadge status={d.status} />
                        </td>
                        <td className="p-3.5 text-[#677269]">
                          {new Date(d.delivered_at).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-[#677269]">{d.created_by_name}</td>
                        <td className="p-3.5 text-center">
                          {d.status === "DRAFT" ? (
                            <button
                              onClick={() => handlePostDelivery(d.id)}
                              disabled={postingId === d.id}
                              className="px-3 py-1 bg-[#2F6B45] hover:bg-[#255738] text-white font-semibold rounded text-xs inline-flex items-center gap-1 shadow-sm disabled:opacity-50"
                            >
                              <CheckCircle2 size={13} />
                              {postingId === d.id ? "Posting..." : "Post Delivery"}
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

      {/* Create Delivery Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#DDE4DC] shadow-xl w-full max-w-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#DDE4DC] pb-3">
              <h2 className="text-base font-bold text-[#17201A]">Create Delivery Order</h2>
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

            <form onSubmit={handleCreateDelivery} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#17201A] mb-1">Source Location *</label>
                  <select
                    required
                    value={sourceLocationId}
                    onChange={(e) => setSourceLocationId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                  >
                    <option value="">Select Source Location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.warehouse_name} &rarr; {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#17201A] mb-1">Customer / Reference</label>
                  <input
                    type="text"
                    value={customerRef}
                    onChange={(e) => setCustomerRef(e.target.value)}
                    placeholder="e.g. Acme Corp (SO-102)"
                    className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                  />
                </div>
              </div>

              {/* Dynamic Product Rows */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-semibold text-[#17201A]">Delivery Product Rows *</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[#2F6B45] font-semibold hover:underline text-xs"
                  >
                    + Add Product Line
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1">
                        <select
                          required
                          value={row.product_id}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                        >
                          <option value="">Select Product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                        {row.product_id && (
                          <span className="text-[10px] text-[#677269] mt-0.5 block">
                            Available: <strong className="text-[#2F6B45]">{row.available_stock}</strong> units
                          </span>
                        )}
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          min={1}
                          max={row.available_stock || 99999}
                          required
                          value={row.quantity}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[idx].quantity = parseFloat(e.target.value) || 1;
                            setItems(updated);
                          }}
                          placeholder="Qty"
                          className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                        />
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-2 text-[#C44747] hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
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
                  placeholder="Optional dispatch notes or tracking info..."
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
                  Save Delivery Order Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
