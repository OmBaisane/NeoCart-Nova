"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Eye,
  Loader2,
  Package,
  MapPin,
  X,
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

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRecord | null>(
    null,
  );

  // 1. Fetch all orders
  const { data, isLoading } = useQuery<{
    orders: AdminOrderRecord[];
    count: number;
  }>({
    queryKey: ["admin-orders-list"],
    queryFn: async () => {
      const res = await api.get("/orders");
      return res.data;
    },
  });

  // 2. Update Order Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: string;
    }) => {
      return api.patch(`/orders/${orderId}/status`, { orderStatus: status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const orders = data?.orders || [];
  const filteredOrders = orders.filter(
    (o) =>
      o.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.shippingAddress.fullName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      o.shippingAddress.city.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "shipped":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "processing":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <main className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-charcoal sm:text-3xl">
            Customer Fulfillment & Orders
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Dispatch shipments, update delivery milestones, and inspect customer
            invoices.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by tracking code, customer name, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-blue"
          />
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Showing {filteredOrders.length} of {orders.length} orders
        </span>
      </div>

      {/* Orders Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No customer orders matched your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="py-3.5 px-4">
                    Tracking & Date
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Customer
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Total
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
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="transition hover:bg-slate-50/60"
                  >
                    {/* Tracking & Date */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-brand-charcoal">
                          {order.trackingNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-brand-charcoal">
                          {order.shippingAddress.fullName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {order.shippingAddress.city},{" "}
                          {order.shippingAddress.state}
                        </span>
                      </div>
                    </td>

                    {/* Total */}
                    <td className="py-3 px-4 font-extrabold text-brand-charcoal">
                      ₹{order.total.toLocaleString("en-IN")}
                    </td>

                    {/* Payment */}
                    <td className="py-3 px-4">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {order.paymentMethod}
                      </span>
                    </td>

                    {/* Status Select Control */}
                    <td className="py-3 px-4">
                      <select
                        value={order.orderStatus}
                        disabled={updateStatusMutation.isPending}
                        onChange={(e) =>
                          updateStatusMutation.mutate({
                            orderId: order._id,
                            status: e.target.value,
                          })
                        }
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold outline-none cursor-pointer ${getStatusColor(
                          order.orderStatus,
                        )}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Inspect Modal Trigger */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Inspection Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-brand-charcoal uppercase tracking-wider">
                  Order Invoice: {selectedOrder.trackingNumber}
                </h3>
                <span className="text-[10px] text-slate-400">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Delivery address */}
            <div className="rounded-xl bg-slate-50 p-4 space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <MapPin className="h-3.5 w-3.5 text-brand-blue" />
                <span>Shipping Address</span>
              </div>
              <p className="font-semibold text-brand-charcoal">
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
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Frozen Snapshot Items ({selectedOrder.items.length})
              </h4>
              <div className="divide-y divide-slate-100 border-y border-slate-100">
                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image || ""}
                        alt={item.name}
                        className="h-10 w-10 rounded-lg object-cover bg-slate-100"
                      />
                      <div>
                        <h5 className="font-bold text-brand-charcoal">
                          {item.name}
                        </h5>
                        <p className="text-[11px] text-slate-400">
                          {item.quantity} × ₹
                          {item.price.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-brand-charcoal">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="flex justify-between items-center pt-2 text-xs">
              <span className="font-bold text-slate-700">Total Charged</span>
              <span className="text-base font-black text-brand-blue">
                ₹{selectedOrder.total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
