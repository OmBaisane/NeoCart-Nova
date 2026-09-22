"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Package,
  ShoppingBag,
  Users,
  IndianRupee,
  ArrowUpRight,
  AlertTriangle,
  Plus,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function AdminDashboardPage() {
  // 1. Fetch live products for inventory analysis
  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const res = await api.get("/products?limit=100");
      return res.data;
    },
  });

  // 2. Fetch customer directory
  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await api.get("/admin/users");
      return res.data;
    },
  });

  const products = productsData?.products || [];
  const totalProducts = productsData?.totalProducts || 0;
  const totalCustomers = usersData?.count || 0;

  // Inventory calculations
  const lowStockCount = products.filter(
    (p: any) => p.stock > 0 && p.stock <= 5,
  ).length;
  const outOfStockCount = products.filter((p: any) => p.stock <= 0).length;

  const isLoading = isProductsLoading || isUsersLoading;

  return (
    <main className="space-y-8">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-charcoal sm:text-3xl">
            Executive Dashboard
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Real-time telemetry, warehouse inventory health, and management
            shortcuts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Product</span>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      ) : (
        <>
          {/* KPI Metric Cards Grid */}
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Active Inventory */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Catalog Items
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-brand-blue">
                  <Package className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-brand-charcoal">
                  {totalProducts}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600">
                  Live in Store
                </span>
              </div>
            </div>

            {/* Registered Customers */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Customers
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-brand-charcoal">
                  {totalCustomers}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  Accounts
                </span>
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Low Stock Items
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-brand-charcoal">
                  {lowStockCount}
                </span>
                <span className="text-[11px] font-semibold text-amber-600">
                  ≤ 5 units remaining
                </span>
              </div>
            </div>

            {/* Out of Stock Alerts */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Out of Stock
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-brand-charcoal">
                  {outOfStockCount}
                </span>
                <span className="text-[11px] font-semibold text-rose-600">
                  Action Required
                </span>
              </div>
            </div>
          </section>

          {/* Quick Management Shortcuts */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
            <h2 className="text-sm font-bold text-brand-charcoal uppercase tracking-wider border-b border-slate-100 pb-3">
              Operational Management Shortcuts
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Link
                href="/admin/products"
                className="group flex flex-col justify-between rounded-xl border border-slate-200 p-4 transition hover:border-brand-blue hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Package className="h-5 w-5 text-brand-blue" />
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-brand-blue transition" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-brand-charcoal">
                    Product Management
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Edit pricing, upload product images, adjust warehouse
                    inventory levels.
                  </p>
                </div>
                <span className="mt-4 text-[11px] font-bold text-brand-blue">
                  Manage Catalog →
                </span>
              </Link>

              <Link
                href="/admin/orders"
                className="group flex flex-col justify-between rounded-xl border border-slate-200 p-4 transition hover:border-brand-blue hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <ShoppingBag className="h-5 w-5 text-indigo-600" />
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-brand-charcoal">
                    Order Processing
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Update fulfillment status (Confirmed, Shipped, Delivered)
                    and dispatch tracking codes.
                  </p>
                </div>
                <span className="mt-4 text-[11px] font-bold text-indigo-600">
                  Process Orders →
                </span>
              </Link>

              <Link
                href="/admin/users"
                className="group flex flex-col justify-between rounded-xl border border-slate-200 p-4 transition hover:border-brand-blue hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Users className="h-5 w-5 text-cyan-accent" />
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-cyan-accent transition" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-brand-charcoal">
                    Customer Directory
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Inspect registered user accounts, phone numbers, and address
                    integrity.
                  </p>
                </div>
                <span className="mt-4 text-[11px] font-bold text-cyan-600">
                  View Directory →
                </span>
              </Link>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
