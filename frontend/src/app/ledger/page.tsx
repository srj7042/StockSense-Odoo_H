"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { apiRequest } from "@/lib/api";
import { History, Filter, Search, RefreshCw } from "lucide-react";

export default function StockLedgerPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [skuFilter, setSkuFilter] = useState("");
  const [productIdFilter, setProductIdFilter] = useState("");
  const [locationIdFilter, setLocationIdFilter] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState("");

  const loadMovements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (skuFilter) params.append("sku", skuFilter);
      if (productIdFilter) params.append("product_id", productIdFilter);
      if (locationIdFilter) params.append("location_id", locationIdFilter);
      if (movementTypeFilter) params.append("movement_type", movementTypeFilter);

      const data = await apiRequest(`/stock/movements?${params.toString()}`);
      setMovements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiRequest("/products").then(setProducts).catch(() => {});
    apiRequest("/locations").then(setLocations).catch(() => {});
  }, []);

  useEffect(() => {
    loadMovements();
  }, [skuFilter, productIdFilter, locationIdFilter, movementTypeFilter]);

  return (
    <div className="min-h-screen bg-[#F7F8F3] flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Header
          title="Move History / Stock Ledger"
          description="Immutable audit source of truth for all posted inventory operations"
        />

        <div className="p-6 flex-1 space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#DDE4DC] flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-[#17201A] flex items-center gap-1">
                <Filter size={14} /> Filters:
              </span>

              {/* SKU Search */}
              <input
                type="text"
                placeholder="Filter by SKU..."
                value={skuFilter}
                onChange={(e) => setSkuFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg text-xs w-36 text-[#17201A] focus:outline-none focus:border-[#2F6B45]"
              />

              {/* Product Select */}
              <select
                value={productIdFilter}
                onChange={(e) => setProductIdFilter(e.target.value)}
                className="bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg px-2.5 py-1.5 text-[#17201A] focus:outline-none focus:border-[#2F6B45]"
              >
                <option value="">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Location Select */}
              <select
                value={locationIdFilter}
                onChange={(e) => setLocationIdFilter(e.target.value)}
                className="bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg px-2.5 py-1.5 text-[#17201A] focus:outline-none focus:border-[#2F6B45]"
              >
                <option value="">All Locations</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.warehouse_name} &rarr; {l.name}
                  </option>
                ))}
              </select>

              {/* Movement Type Select */}
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg px-2.5 py-1.5 text-[#17201A] focus:outline-none focus:border-[#2F6B45]"
              >
                <option value="">All Movement Types</option>
                <option value="RECEIPT_IN">RECEIPT IN</option>
                <option value="DELIVERY_OUT">DELIVERY OUT</option>
                <option value="TRANSFER_OUT">TRANSFER OUT</option>
                <option value="TRANSFER_IN">TRANSFER IN</option>
                <option value="ADJUSTMENT_IN">ADJUSTMENT IN</option>
                <option value="ADJUSTMENT_OUT">ADJUSTMENT OUT</option>
                <option value="INITIAL_STOCK">INITIAL STOCK</option>
              </select>
            </div>

            <button
              onClick={loadMovements}
              className="px-3 py-1.5 bg-[#F1F7F2] hover:bg-[#E7F2E9] border border-[#B8DBC0] text-[#2F6B45] font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Stock Ledger Immutable Table */}
          <div className="bg-white rounded-xl border border-[#DDE4DC] shadow-sm overflow-hidden">
            <div className="p-3 bg-[#F1F7F2] border-b border-[#DDE4DC] text-xs font-semibold text-[#2F6B45] flex items-center justify-between">
              <span>Read-Only Immutable Stock Audit Log</span>
              <span>Showing {movements.length} ledger entries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F8F3] border-b border-[#DDE4DC] text-[#677269] font-semibold">
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Reference No</th>
                    <th className="p-3.5">Product</th>
                    <th className="p-3.5">SKU</th>
                    <th className="p-3.5">Movement Type</th>
                    <th className="p-3.5">Source &rarr; Destination</th>
                    <th className="p-3.5 text-right">Qty In</th>
                    <th className="p-3.5 text-right">Qty Out</th>
                    <th className="p-3.5 text-right">Balance After</th>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Reason / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE4DC]">
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-[#677269]">
                        Loading stock ledger...
                      </td>
                    </tr>
                  ) : movements.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-[#677269]">
                        Stock movements will appear after operations are posted.
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => (
                      <tr key={m.id} className="hover:bg-[#F1F7F2] transition-colors font-mono text-[11px]">
                        <td className="p-3.5 text-[#677269] whitespace-nowrap">
                          {new Date(m.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="p-3.5 font-bold text-[#17201A]">{m.reference_no}</td>
                        <td className="p-3.5 font-sans font-semibold text-[#17201A]">{m.product_name}</td>
                        <td className="p-3.5 text-[#677269] font-bold">{m.sku}</td>
                        <td className="p-3.5">
                          <StatusBadge status={m.movement_type} />
                        </td>
                        <td className="p-3.5 font-sans text-[#677269]">
                          {m.source_location_name || "External"} &rarr; {m.destination_location_name || "External"}
                        </td>
                        <td className="p-3.5 text-right font-bold text-[#3D8A56]">
                          {m.quantity_in > 0 ? `+${m.quantity_in}` : "-"}
                        </td>
                        <td className="p-3.5 text-right font-bold text-[#C44747]">
                          {m.quantity_out > 0 ? `-${m.quantity_out}` : "-"}
                        </td>
                        <td className="p-3.5 text-right font-bold text-[#17201A]">{m.balance_after}</td>
                        <td className="p-3.5 font-sans text-[#677269]">{m.created_by_name}</td>
                        <td className="p-3.5 font-sans text-[#8B958D] max-w-xs truncate">{m.reason}</td>
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
