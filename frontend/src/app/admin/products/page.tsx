"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TableSkeleton } from "@/components/ui/Skeletons";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";

interface AdminProductItem {
  _id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  category?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery<{
    products: AdminProductItem[];
    totalProducts: number;
  }>({
    queryKey: ["admin-products-list"],
    queryFn: async () => {
      const res = await api.get("/products?limit=100");
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const products = data?.products || [];
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Inventory & Catalog Management
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Audit catalog prices, adjust stock levels, and publish product
            entries.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by title or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-600"
          />
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Showing {filteredProducts.length} of {products.length} entries
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No inventory records found"
              description="No catalog products match your search keyword or criteria."
              actionLabel="Clear Search"
              onAction={() => setSearchTerm("")}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="py-3.5 px-4">
                    Product
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Category
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Price
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Stock Level
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Status
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= 5;

                  return (
                    <tr
                      key={product._id}
                      className="transition hover:bg-slate-50/60"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              product.images?.[0] ||
                              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"
                            }
                            alt={product.name}
                            className="h-10 w-10 shrink-0 rounded-lg object-cover bg-slate-100"
                          />
                          <div className="min-w-0 max-w-xs">
                            <h4 className="font-bold text-slate-900 truncate">
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {product.isFeatured && (
                                <span className="rounded bg-amber-50 px-1.5 py-0.2 text-[9px] font-bold text-amber-700">
                                  Featured
                                </span>
                              )}
                              <Link
                                href={`/products/${product.slug}`}
                                target="_blank"
                                className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                              >
                                <span>View in Store</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700">
                        {product.category?.name || "Unassigned"}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">
                            ₹
                            {(
                              product.discountPrice || product.price
                            ).toLocaleString("en-IN")}
                          </span>
                          {product.discountPrice && (
                            <span className="text-[10px] text-slate-400 line-through">
                              ₹{product.price.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                            <XCircle className="h-3 w-3" />0 units (Out of
                            Stock)
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            <AlertTriangle className="h-3 w-3" />
                            {product.stock} units (Low Stock)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            {product.stock} units
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {product.isActive ? (
                          <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            Hidden
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products/${product._id}/edit`}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                            title="Edit Product"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() =>
                              handleDelete(product._id, product.name)
                            }
                            disabled={deleteMutation.isPending}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
