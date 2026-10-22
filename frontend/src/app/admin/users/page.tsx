"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  Search,
  Loader2,
  ShieldAlert,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery<{
    success: boolean;
    users: AdminUser[];
    totalUsers: number;
  }>({
    queryKey: ["admin-users", searchQuery],
    queryFn: async () => {
      const res = await api.get(
        `/admin/users?search=${encodeURIComponent(searchQuery)}`,
      );
      return res.data;
    },
    enabled: !!user && user.role === "admin",
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

  const users = data?.users || [];

  return (
    <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Customer Directory
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            View registered customer accounts and contact information.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customers by name or email..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-blue dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
        />
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <Users className="mx-auto h-10 w-10 text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-slate-500">
            No registered customers found.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:bg-slate-800/80 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((usr) => (
                  <tr
                    key={usr._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {usr.name}
                    </td>
                    <td className="py-3 px-4 flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{usr.email}</span>
                    </td>
                    <td className="py-3 px-4">
                      {usr.phone ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{usr.phone}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">
                          Not provided
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {new Date(usr.createdAt).toLocaleDateString()}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-brand-blue uppercase dark:bg-blue-950/60 dark:text-cyan-400">
                        {usr.role}
                      </span>
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
