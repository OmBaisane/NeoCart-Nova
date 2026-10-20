"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TableSkeleton } from "@/components/ui/Skeletons";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  Shield,
  UserCheck,
  Calendar,
} from "lucide-react";

interface UserAddress {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface AdminUserItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "user";
  address?: UserAddress;
  createdAt: string;
}

interface AdminUsersResponse {
  success: boolean;
  count: number;
  users: AdminUserItem[];
}

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery<AdminUsersResponse>({
    queryKey: ["admin-users-list"],
    queryFn: async () => {
      const res = await api.get("/admin/users");
      return res.data;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  const users = data?.users || [];

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = user.name?.toLowerCase().includes(term);
    const emailMatch = user.email?.toLowerCase().includes(term);
    const phoneMatch = user.phone?.toLowerCase().includes(term);
    const cityMatch = user.address?.city?.toLowerCase().includes(term);
    return nameMatch || emailMatch || phoneMatch || cityMatch;
  });

  return (
    <main className="space-y-4 sm:space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-4 sm:pb-6 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-brand-charcoal dark:text-white">
            Registered Customers & Users
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Inspect buyer identities, contact details, shipping addresses, and
            system roles.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search by customer name, email, phone, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-blue dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-cyan-500"
          />
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
        </div>

        <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
          Showing {filteredUsers.length} of {users.length} accounts
        </span>
      </div>

      {/* Users Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton rows={6} cols={5} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-6 sm:p-8">
            <EmptyState
              icon={Users}
              title="No customer accounts found"
              description="No user profiles match your search criteria."
              actionLabel="Clear Search"
              onAction={() => setSearchTerm("")}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/90 dark:text-slate-200">
                <tr>
                  <th scope="col" className="py-3.5 px-4">
                    Customer
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Contact Details
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Default Address
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Account Role
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-right">
                    Joined Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr
                    key={u._id}
                    className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/50"
                  >
                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white uppercase dark:bg-slate-800">
                          {u.name ? u.name.charAt(0) : "U"}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate max-w-40">
                            {u.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">
                            ID: {u._id.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact Details */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <Mail className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate max-w-44">{u.email}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <Phone className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Default Address */}
                    <td className="py-3 px-4">
                      {u.address?.city ? (
                        <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300 max-w-48">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                          <span className="truncate">
                            {u.address.city}, {u.address.state}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                          No address saved
                        </span>
                      )}
                    </td>

                    {/* Account Role */}
                    <td className="py-3 px-4">
                      {u.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-brand-blue uppercase tracking-wider dark:bg-blue-950/60 dark:text-cyan-400">
                          <Shield className="h-3 w-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-300">
                          <UserCheck className="h-3 w-3" />
                          Customer
                        </span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
