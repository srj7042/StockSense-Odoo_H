"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { apiRequest } from "@/lib/api";
import {
  ArrowLeft, Package, Boxes, Warehouse, History, Edit, Check, AlertCircle, ArrowUpRight, ArrowDownRight
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;

  const [product, setProduct] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [saveError, setSaveError] = useState("");

  const loadProductData = async () => {
    setLoading(true);
    try {
      const prodRes = await apiRequest(`/products/${productId}`);
      setProduct(prodRes);
      setEditForm({
        name: prodRes.name,
        sku: prodRes.sku,
        category_id: prodRes.category_id,
        unit: prodRes.unit,
        reorder_point: prodRes.reorder_point,
        target_stock: prodRes.target_stock,
        active: prodRes.active,
      });

      const movRes = await apiRequest(`/stock/movements?product_id=${productId}`);
      setMovements(movRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiRequest("/categories").then(setCategories).catch(() => {});
    if (productId) loadProductData();
  }, [productId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    try {
      await apiRequest(`/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      setIsEditing(false);
      loadProductData();
    } catch (err: any) {
      setSaveError(err.message || "Failed to update product.");
    }
  };

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-[#F7F8F3] flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-6 flex items-center justify-center text-xs text-[#677269]">
          Loading product details...
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F3] flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Header
          title={`Product: ${product.name}`}
          description={`SKU: ${product.sku} | Category: ${product.category_name}`}
        />

        <div className="p-6 flex-1 space-y-6">
          {/* Back button & Action Header */}
          <div className="flex items-center justify-between">
            <Link
              href="/products"
              className="text-xs font-semibold text-[#2F6B45] hover:underline flex items-center gap-1"
            >
              <ArrowLeft size={16} />
              Back to Products
            </Link>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3.5 py-1.5 bg-white border border-[#DDE4DC] hover:bg-[#F1F7F2] text-[#17201A] font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Edit size={14} />
              {isEditing ? "Cancel Edit" : "Edit Product"}
            </button>
          </div>

          {/* Edit Form Modal/Section */}
          {isEditing && (
            <div className="bg-white p-5 rounded-xl border border-[#DDE4DC] shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-sm text-[#17201A]">Edit Product Master Details</h3>
              {saveError && (
                <div className="p-2.5 bg-red-50 text-[#C44747] rounded-lg border border-red-200">
                  {saveError}
                </div>
              )}
              <form onSubmit={handleUpdate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Product Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">SKU Code</label>
                    <input
                      type="text"
                      value={editForm.sku}
                      onChange={(e) => setEditForm({ ...editForm, sku: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-1.5 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Category</label>
                    <select
                      value={editForm.category_id}
                      onChange={(e) => setEditForm({ ...editForm, category_id: parseInt(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Reorder Point</label>
                    <input
                      type="number"
                      value={editForm.reorder_point}
                      onChange={(e) => setEditForm({ ...editForm, reorder_point: parseFloat(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Target Stock</label>
                    <input
                      type="number"
                      value={editForm.target_stock}
                      onChange={(e) => setEditForm({ ...editForm, target_stock: parseFloat(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#2F6B45] text-white font-semibold rounded-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Product Header Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#DDE4DC] shadow-sm">
              <span className="text-xs text-[#677269] font-medium">Total On-Hand Stock</span>
              <p className="text-2xl font-bold text-[#17201A] mt-1">{product.total_stock} <span className="text-xs font-normal text-[#677269]">{product.unit}</span></p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#DDE4DC] shadow-sm">
              <span className="text-xs text-[#677269] font-medium">Reorder Point</span>
              <p className="text-2xl font-bold text-[#C68A2F] mt-1">{product.reorder_point} <span className="text-xs font-normal text-[#677269]">{product.unit}</span></p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#DDE4DC] shadow-sm">
              <span className="text-xs text-[#677269] font-medium">Target Stock</span>
              <p className="text-2xl font-bold text-[#2F6B45] mt-1">{product.target_stock} <span className="text-xs font-normal text-[#677269]">{product.unit}</span></p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#DDE4DC] shadow-sm">
              <span className="text-xs text-[#677269] font-medium">Overall Status</span>
              <div className="mt-2">
                <StatusBadge
                  status={
                    product.total_stock === 0
                      ? "OUT_OF_STOCK"
                      : product.total_stock <= product.reorder_point
                      ? "LOW"
                      : "OK"
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stock by Location Table */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-[#DDE4DC] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#DDE4DC]">
                <h3 className="font-bold text-sm text-[#17201A]">Stock Breakdown by Location</h3>
                <p className="text-xs text-[#677269]">Current quantities across warehouses and racks</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F7F8F3] border-b border-[#DDE4DC] text-[#677269] font-semibold">
                      <th className="p-3">Warehouse</th>
                      <th className="p-3">Location Name</th>
                      <th className="p-3 text-right">Available Quantity</th>
                      <th className="p-3">Reorder Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE4DC]">
                    {product.stock_by_location.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-[#677269]">
                          No stock recorded at any location yet.
                        </td>
                      </tr>
                    ) : (
                      product.stock_by_location.map((loc: any, idx: number) => (
                        <tr key={idx} className="hover:bg-[#F1F7F2] transition-colors">
                          <td className="p-3 font-semibold text-[#17201A]">{loc.warehouse_name}</td>
                          <td className="p-3 text-[#677269]">{loc.location_name}</td>
                          <td className="p-3 text-right font-bold text-[#17201A]">{loc.quantity}</td>
                          <td className="p-3">
                            <StatusBadge status={loc.reorder_status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Product Movement Timeline */}
            <div className="bg-white rounded-xl border border-[#DDE4DC] shadow-sm p-4 space-y-4">
              <div>
                <h3 className="font-bold text-sm text-[#17201A]">Movement Timeline</h3>
                <p className="text-xs text-[#677269]">Chronological stock ledger history</p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                {movements.length === 0 ? (
                  <p className="text-xs text-[#677269] py-8 text-center">No movements recorded yet.</p>
                ) : (
                  movements.map((mov) => {
                    const isInbound = mov.quantity_in > 0;
                    return (
                      <div
                        key={mov.id}
                        className="p-3 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className={`flex items-center gap-1 ${isInbound ? "text-[#3D8A56]" : "text-[#C44747]"}`}>
                            {isInbound ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {isInbound ? `+${mov.quantity_in}` : `-${mov.quantity_out}`} {product.unit}
                          </span>
                          <span className="text-[10px] text-[#677269]">{mov.reference_no}</span>
                        </div>
                        <div className="flex justify-between text-[#677269]">
                          <span>{mov.movement_type.replace(/_/g, " ")}</span>
                          <span>Balance: {mov.balance_after}</span>
                        </div>
                        <p className="text-[10px] text-[#8B958D]">
                          {new Date(mov.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })} by {mov.created_by_name}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
