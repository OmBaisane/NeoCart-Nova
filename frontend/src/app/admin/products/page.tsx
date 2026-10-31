"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
  } | null;
}

interface AdminProductsResponse {
  success: boolean;
  products: AdminProduct[];
  totalProducts: number;
  totalPages: number;
  currentPage: number;
}

const PAGE_SIZE = 20;

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, isFetching } =
    useQuery<AdminProductsResponse>({
      queryKey: ["admin-products", statusFilter, searchQuery, page],
      queryFn: async () => {
        const params = new URLSearchParams({
          status: statusFilter,
          search: searchQuery.trim(),
          page: String(page),
          limit: String(PAGE_SIZE),
        });

        const res = await api.get(`/admin/products?${params.toString()}`);
        return res.data;
      },
      enabled: !!user && user.role === "admin",
      placeholderData: (previousData) => previousData,
    });

  const toggleStatusMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await api.patch(`/admin/products/${productId}/toggle-status`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-products"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-stats"],
      });
    },
  });

  const products = data?.products ?? [];
  const totalProducts = data?.totalProducts ?? 0;
  const totalPages = Math.max(data?.totalPages ?? 1, 1);

  useEffect(() => {
    if (data && page > totalPages) {
      setPage(totalPages);
    }
  }, [data, page, totalPages]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const startItem = totalProducts === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const endItem = Math.min(page * PAGE_SIZE, totalProducts);

  if (isAuthLoading || (isLoading && !data)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue dark:text-cyan-400" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Catalog & Inventory Management
          </h1>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Monitor active product stock levels, toggle catalog availability,
            and manage store gear.
          </p>
        </div>

        <a
          href="/admin/products/new"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-blue-600 dark:bg-blue-600"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Product</span>
        </a>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search products by name or description..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-blue dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
          <option value="low_stock">Low Stock (≤ 5)</option>
        </select>
      </div>

      {/* Error State */}
      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400">
          Failed to load products. Please refresh the page or try again.
        </div>
      )}

      {/* Product Count */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Showing{" "}
          <span className="font-bold text-slate-900 dark:text-white">
            {startItem}-{endItem}
          </span>{" "}
          of{" "}
          <span className="font-bold text-slate-900 dark:text-white">
            {totalProducts}
          </span>{" "}
          products
        </p>

        {isFetching && (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Updating...
          </span>
        )}
      </div>

      {/* Products Table */}
      {products.length === 0 && !isError ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <Package className="mx-auto mb-2 h-10 w-10 text-slate-300" />

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            No products match your criteria.
          </p>
        </div>
      ) : products.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((prod) => (
                  <tr
                    key={prod._id}
                    className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <td className="flex items-center gap-3 px-4 py-3">
                      <img
                        src={prod.images?.[0] || ""}
                        alt={prod.name}
                        className="h-10 w-10 shrink-0 rounded-lg bg-slate-100 object-cover dark:bg-slate-800"
                      />

                      <span className="line-clamp-1 max-w-xs font-bold text-slate-900 dark:text-white">
                        {prod.name}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {prod.category?.name || "Uncategorized"}
                    </td>

                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      ₹{prod.price.toLocaleString("en-IN")}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          prod.stock <= 0
                            ? "text-rose-600 dark:text-rose-400"
                            : prod.stock <= 5
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {prod.stock > 0 && prod.stock <= 5 && (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        )}

                        {prod.stock <= 0 ? "Sold Out" : `${prod.stock} units`}
                      </span>
                    </td>

                    <td className="px-4 py-3">
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

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => toggleStatusMutation.mutate(prod._id)}
                        disabled={toggleStatusMutation.isPending}
                        className="inline-flex items-center gap-1 font-semibold text-brand-blue hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-cyan-400"
                      >
                        {toggleStatusMutation.isPending && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}

                        {prod.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Pagination */}
      {totalProducts > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Page{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              {page}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              {totalPages}
            </span>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page <= 1 || isFetching}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(current + 1, totalPages))
              }
              disabled={page >= totalPages || isFetching}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mutation Error */}
      {toggleStatusMutation.isError && (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
          Failed to update product status. Please try again.
        </p>
      )}
    </main>
  );
}
