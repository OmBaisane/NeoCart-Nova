"use client";

import React, { useState } from "react";
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
    <main className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-4 sm:pb-6">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-brand-charcoal sm:text-3xl">
            Customer Directory
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Audit registered accounts, communication details, saved addresses,
            and security privileges.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">
            Total Accounts: {users.length}
          </span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-xs outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
          />
        </div>
      </div>

      {/* Directory Table */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Accounts Found"
          description={
            searchTerm
              ? `No user accounts matched "${searchTerm}".`
              : "No registered accounts currently exist in the database."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Customer</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Default Address</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredUsers.map((account) => {
                  const hasAddress =
                    account.address?.street ||
                    account.address?.city ||
                    account.address?.pincode;

                  return (
                    <tr
                      key={account._id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-600 uppercase text-xs">
                            {account.name?.charAt(0) || "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-brand-charcoal truncate">
                              {account.name}
                            </p>
                            <p className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span>{account.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {account.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                            <Shield className="h-3 w-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                            <UserCheck className="h-3 w-3" />
                            Customer
                          </span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {account.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{account.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            Unlinked
                          </span>
                        )}
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-4 text-slate-600 max-w-50">
                        {hasAddress ? (
                          <div className="flex items-start gap-1.5 truncate">
                            <MapPin className="h-3 w-3 text-brand-blue shrink-0 mt-0.5" />
                            <span
                              className="truncate text-[11px]"
                              title={`${account.address?.street || ""}, ${account.address?.city || ""}, ${account.address?.state || ""} ${account.address?.pincode || ""}`}
                            >
                              {[
                                account.address?.city,
                                account.address?.state,
                                account.address?.pincode,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            No saved address
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 sm:px-6 text-right text-[11px] text-slate-400 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(account.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
