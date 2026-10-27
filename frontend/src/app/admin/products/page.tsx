"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Package, Search, Plus, AlertTriangle, Loader2 } from "lucide-react";

interface AdminProduct {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  stock: number;
  isActive: boolean;
  images: string[];
  category: {
    name: string;
    slug: string;
  };
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, inactive, low_stock

  const { data, isLoading } = useQuery<{
    success: boolean;
    products: AdminProduct[];
    totalProducts: number;
  }>({
    queryKey: ["admin-products", statusFilter, searchQuery],
    queryFn: async () => {
      const res = await api.get(
        `/admin/products?status=${statusFilter}&search=${encodeURIComponent(
          searchQuery,
        )}`,
      );
      return res.data;
    },
    enabled: !!user && user.role === "admin",
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await api.patch(`/admin/products/${productId}/toggle-status`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue dark:text-cyan-400" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const products = data?.products || [];

  return (
    <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Catalog & Inventory Management
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Monitor active product stock levels, toggle catalog availability,
            and manage store gear.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/admin/products/new"
            className="flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-600 transition dark:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Product</span>
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name or description..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-blue dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
          <option value="low_stock">Low Stock (&le; 5)</option>
        </select>
      </div>

      {/* Products Table Grid */}
      {products.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <Package className="mx-auto h-10 w-10 text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-slate-500">
            No products match your criteria.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:bg-slate-800/80 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((prod) => (
                  <tr
                    key={prod._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                  >
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={prod.images?.[0] || ""}
                        alt={prod.name}
                        className="h-10 w-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                      />
                      <span className="font-bold text-slate-900 dark:text-white line-clamp-1 max-w-xs">
                        {prod.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {prod.category?.name || "Uncategorized"}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      ₹{prod.price.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          prod.stock === 0
                            ? "text-rose-600 dark:text-rose-400"
                            : prod.stock <= 5
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {prod.stock <= 5 && prod.stock > 0 && (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        )}
                        {prod.stock === 0 ? "Sold Out" : `${prod.stock} units`}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          prod.isActive
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                        }`}
                      >
                        {prod.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleStatusMutation.mutate(prod._id)}
                        disabled={toggleStatusMutation.isPending}
                        className="inline-flex items-center gap-1 font-semibold text-brand-blue hover:underline dark:text-cyan-400"
                      >
                        {prod.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
