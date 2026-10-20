"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  Eye,
  Loader2,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface OrderItemSnapshot {
  product: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface AdminOrderRecord {
  _id: string;
  trackingNumber: string;
  createdAt: string;
  orderStatus:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  items: OrderItemSnapshot[];
  user?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
}

interface AdminOrdersResponse {
  success: boolean;
  count: number;
  totalOrders: number;
  totalPages: number;
  currentPage: number;
  orders: AdminOrderRecord[];
}

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRecord | null>(
    null,
  );

  // 1. Fetch orders from dedicated Admin API with server-side pagination & filter
  const { data, isLoading } = useQuery<AdminOrdersResponse>({
    queryKey: ["admin-orders-list", currentPage, searchTerm, statusFilter],
    queryFn: async () => {
      const res = await api.get("/admin/orders", {
        params: {
          page: currentPage,
          limit: 10,
          search: searchTerm || undefined,
          status: statusFilter,
        },
      });
      return res.data;
    },
  });

  // 2. Update Order Status Mutation using dedicated admin endpoint
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: string;
    }) => {
      return api.patch(`/admin/orders/${orderId}/status`, {
        orderStatus: status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message || "Failed to update order status";
      alert(message);
    },
  });

  const orders = data?.orders || [];
  const totalPages = data?.totalPages || 1;
  const totalOrders = data?.totalOrders || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
      case "shipped":
        return "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
      case "processing":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-cyan-300 dark:border-blue-800";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
    }
  };

  return (
    <main className="space-y-4 sm:space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-4 sm:pb-6 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-brand-charcoal dark:text-white">
            Customer Fulfillment & Orders
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Dispatch shipments, update delivery milestones, and inspect customer
            invoices.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 max-w-full md:max-w-md">
          <input
            type="text"
            placeholder="Search by tracking code, customer name, city..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-cyan-500"
          />
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "confirmed", label: "Confirmed" },
            { key: "processing", label: "Processing" },
            { key: "shipped", label: "Shipped" },
            { key: "delivered", label: "Delivered" },
            { key: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setCurrentPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                statusFilter === tab.key
                  ? "bg-slate-900 text-white shadow-xs dark:bg-blue-600 dark:text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
          Total {totalOrders} orders
        </span>
      </div>

      {/* Orders Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-blue dark:text-cyan-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-xs text-slate-400 dark:text-slate-500">
            No customer orders matched your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/90 dark:text-slate-200">
                <tr>
                  <th scope="col" className="py-3.5 px-4">
                    Tracking & Date
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Customer Details
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Total Amount
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Payment
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Fulfillment Status
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-right">
                    Inspection
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/50"
                  >
                    {/* Tracking & Date */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-brand-charcoal dark:text-white text-xs sm:text-sm">
                          {order.trackingNumber}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-brand-charcoal dark:text-white text-xs sm:text-sm truncate max-w-40">
                          {order.shippingAddress.fullName}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 truncate max-w-40">
                          {order.shippingAddress.city},{" "}
                          {order.shippingAddress.state}
                        </span>
                      </div>
                    </td>

                    {/* Total */}
                    <td className="py-3 px-4 font-extrabold text-brand-charcoal dark:text-white text-xs sm:text-sm">
                      ₹{order.total.toLocaleString("en-IN")}
                    </td>

                    {/* Payment */}
                    <td className="py-3 px-4">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {order.paymentMethod}
                      </span>
                    </td>

                    {/* Status Select Control */}
                    <td className="py-3 px-4">
                      <select
                        value={order.orderStatus}
                        disabled={
                          updateStatusMutation.isPending ||
                          order.orderStatus === "delivered" ||
                          order.orderStatus === "cancelled"
                        }
                        onChange={(e) =>
                          updateStatusMutation.mutate({
                            orderId: order._id,
                            status: e.target.value,
                          })
                        }
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${getStatusColor(
                          order.orderStatus,
                        )}`}
                      >
                        <option
                          value="pending"
                          className="dark:bg-slate-900 dark:text-white"
                        >
                          Pending
                        </option>
                        <option
                          value="confirmed"
                          className="dark:bg-slate-900 dark:text-white"
                        >
                          Confirmed
                        </option>
                        <option
                          value="processing"
                          className="dark:bg-slate-900 dark:text-white"
                        >
                          Processing
                        </option>
                        <option
                          value="shipped"
                          className="dark:bg-slate-900 dark:text-white"
                        >
                          Shipped
                        </option>
                        <option
                          value="delivered"
                          className="dark:bg-slate-900 dark:text-white"
                        >
                          Delivered
                        </option>
                        <option
                          value="cancelled"
                          className="dark:bg-slate-900 dark:text-white"
                        >
                          Cancelled
                        </option>
                      </select>
                    </td>

                    {/* Inspect Modal Trigger */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-850">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Inspection Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-6 max-h-[90vh] overflow-y-auto dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-brand-charcoal uppercase tracking-wider truncate dark:text-white">
                  Invoice: {selectedOrder.trackingNumber}
                </h3>
                <span className="text-[10px] text-slate-400 dark:text-slate-400">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 shrink-0 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Delivery address */}
            <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4 space-y-1 text-xs text-slate-600 dark:bg-slate-800/70 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white">
                <MapPin className="h-3.5 w-3.5 text-brand-blue dark:text-cyan-400 shrink-0" />
                <span>Shipping Address</span>
              </div>
              <p className="font-semibold text-brand-charcoal dark:text-white">
                {selectedOrder.shippingAddress.fullName} (
                {selectedOrder.shippingAddress.phone})
              </p>
              <p>{selectedOrder.shippingAddress.address}</p>
              <p>
                {selectedOrder.shippingAddress.city},{" "}
                {selectedOrder.shippingAddress.state} —{" "}
                {selectedOrder.shippingAddress.pincode}
              </p>
            </div>

            {/* Items breakdown */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2.5">
                Frozen Snapshot Items ({selectedOrder.items.length})
              </h4>
              <div className="divide-y divide-slate-100 border-y border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.image || ""}
                        alt={item.name}
                        className="h-10 w-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <h5 className="font-bold text-brand-charcoal truncate text-[11px] sm:text-xs dark:text-white">
                          {item.name}
                        </h5>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400">
                          {item.quantity} × ₹
                          {item.price.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-brand-charcoal text-xs shrink-0 dark:text-white">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="flex justify-between items-center pt-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Total Charged
              </span>
              <span className="text-base font-black text-brand-blue dark:text-cyan-400">
                ₹{selectedOrder.total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
