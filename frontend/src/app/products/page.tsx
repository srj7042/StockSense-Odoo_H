"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { apiRequest } from "@/lib/api";
import { Plus, Search, Filter, Package, AlertCircle, Eye, X } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stockStatus, setStockStatus] = useState("");

  // Add Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category_id: "",
    unit: "pcs",
    reorder_point: 10,
    target_stock: 50,
    opening_stock: 0,
    opening_location_id: "",
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryId) params.append("category_id", categoryId);
      if (stockStatus) params.append("stock_status", stockStatus);

      const data = await apiRequest(`/products?${params.toString()}`);
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    apiRequest("/categories").then(setCategories).catch(() => {});
    apiRequest("/locations").then(setLocations).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [search, categoryId, stockStatus]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      await apiRequest("/products", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          category_id: parseInt(formData.category_id),
          reorder_point: parseFloat(formData.reorder_point.toString()),
          target_stock: parseFloat(formData.target_stock.toString()),
          opening_stock: parseFloat(formData.opening_stock.toString()),
          opening_location_id: formData.opening_location_id ? parseInt(formData.opening_location_id) : null,
        }),
      });

      setShowAddModal(false);
      setFormData({
        name: "",
        sku: "",
        category_id: "",
        unit: "pcs",
        reorder_point: 10,
        target_stock: 50,
        opening_stock: 0,
        opening_location_id: "",
        active: true,
      });
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F3] flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Header
          title="Products Catalog"
          description="Manage master items, stock levels, SKU codes, and reorder thresholds"
        />

        <div className="p-6 flex-1 space-y-6">
          {/* Action & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#DDE4DC] flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-[#8B958D]" />
                <input
                  type="text"
                  placeholder="Search SKU or Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg text-xs w-60 text-[#17201A] focus:outline-none focus:border-[#2F6B45]"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg px-3 py-1.5 text-xs text-[#17201A] focus:outline-none focus:border-[#2F6B45]"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Stock Status Filter */}
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value)}
                className="bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg px-3 py-1.5 text-xs text-[#17201A] focus:outline-none focus:border-[#2F6B45]"
              >
                <option value="">All Stock Statuses</option>
                <option value="OK">In Stock (OK)</option>
                <option value="LOW">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>

            {/* Add Product Primary Action */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#2F6B45] hover:bg-[#255738] text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus size={16} />
              Add Product
            </button>
          </div>

          {/* Product Data Table */}
          <div className="bg-white rounded-xl border border-[#DDE4DC] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F8F3] border-b border-[#DDE4DC] text-[#677269] font-semibold">
                    <th className="p-3.5">SKU Code</th>
                    <th className="p-3.5">Product Name</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Unit</th>
                    <th className="p-3.5 text-right">Total Stock</th>
                    <th className="p-3.5 text-right">Reorder Point</th>
                    <th className="p-3.5">Stock Status</th>
                    <th className="p-3.5">Active</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE4DC]">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-[#677269]">
                        Loading products...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-[#677269]">
                        No products found. Add your first product to start tracking inventory.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      let statusStr = "OK";
                      if (p.total_stock === 0) statusStr = "OUT_OF_STOCK";
                      else if (p.total_stock <= p.reorder_point) statusStr = "LOW";

                      return (
                        <tr key={p.id} className="hover:bg-[#F1F7F2] transition-colors">
                          <td className="p-3.5 font-bold text-[#17201A]">{p.sku}</td>
                          <td className="p-3.5 font-semibold text-[#17201A]">{p.name}</td>
                          <td className="p-3.5 text-[#677269]">{p.category_name}</td>
                          <td className="p-3.5 text-[#677269] uppercase font-mono">{p.unit}</td>
                          <td className="p-3.5 text-right font-bold text-[#17201A]">{p.total_stock}</td>
                          <td className="p-3.5 text-right text-[#677269]">{p.reorder_point}</td>
                          <td className="p-3.5">
                            <StatusBadge status={statusStr} />
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${p.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                              {p.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <Link
                              href={`/products/${p.id}`}
                              className="px-2.5 py-1 bg-[#F1F7F2] hover:bg-[#E7F2E9] text-[#2F6B45] font-semibold rounded inline-flex items-center gap-1 transition-colors"
                            >
                              <Eye size={14} />
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#DDE4DC] shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#DDE4DC] pb-3">
              <h2 className="text-base font-bold text-[#17201A]">Add New Product</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[#8B958D] hover:text-[#17201A]">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#C44747] flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#17201A] mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Wireless Ergonomic Mouse"
                  className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#17201A] mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    placeholder="SKU-ELEC-009"
                    className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45] font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#17201A] mb-1">Category *</label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#17201A] mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="pcs, box, meter"
                    className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#17201A] mb-1">Reorder Point</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.reorder_point}
                    onChange={(e) => setFormData({ ...formData, reorder_point: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#17201A] mb-1">Target Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.target_stock}
                    onChange={(e) => setFormData({ ...formData, target_stock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                  />
                </div>
              </div>

              {/* Optional Opening Stock */}
              <div className="p-3 bg-[#F1F7F2] border border-[#B8DBC0] rounded-lg space-y-2">
                <p className="font-semibold text-[#2F6B45]">Optional Opening Stock</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#677269] mb-1">Opening Units</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.opening_stock}
                      onChange={(e) => setFormData({ ...formData, opening_stock: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#677269] mb-1">Opening Location</label>
                    <select
                      value={formData.opening_location_id}
                      onChange={(e) => setFormData({ ...formData, opening_location_id: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                    >
                      <option value="">Select Location</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.warehouse_name} - {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DDE4DC]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#17201A] font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#2F6B45] hover:bg-[#255738] text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
