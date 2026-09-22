"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  User as UserIcon,
  Loader2,
  Calendar,
} from "lucide-react";

interface UserDirectoryItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "admin";
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  createdAt: string;
}

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all registered users
  const { data, isLoading } = useQuery<{
    users: UserDirectoryItem[];
    count: number;
  }>({
    queryKey: ["admin-users-directory"],
    queryFn: async () => {
      const res = await api.get("/admin/users");
      return res.data;
    },
  });

  const users = data?.users || [];
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm)),
  );

  return (
    <main className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-charcoal sm:text-3xl">
            Customer Directory
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Inspect registered accounts, verify saved delivery addresses, and
            monitor user roles.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs">
          <Users className="h-4 w-4 text-brand-blue" />
          <span>Total Registered: {users.length}</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by name, email, or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-blue"
          />
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Showing {filteredUsers.length} of {users.length} accounts
        </span>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No customer accounts matched your search keyword.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="py-3.5 px-4">
                    Customer
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Contact Details
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Role
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Default Shipping Address
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-right">
                    Joined Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="transition hover:bg-slate-50/60"
                  >
                    {/* Customer Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white uppercase">
                          {user.name ? user.name.charAt(0) : "U"}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-brand-charcoal">
                            {user.name}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            ID: {user._id.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{user.phone}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            No phone provided
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      {user.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-brand-blue">
                          <ShieldCheck className="h-3 w-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700">
                          <UserIcon className="h-3 w-3 text-slate-400" />
                          Customer
                        </span>
                      )}
                    </td>

                    {/* Address */}
                    <td className="py-3 px-4">
                      {user.address?.city || user.address?.state ? (
                        <div className="flex items-start gap-1.5 text-slate-700">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                          <div>
                            <p className="font-medium truncate max-w-xs">
                              {user.address.street || "Address"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {user.address.city}, {user.address.state} —{" "}
                              {user.address.pincode}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          No address saved yet
                        </span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 text-slate-500">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>
                          {new Date(user.createdAt).toLocaleDateString()}
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
