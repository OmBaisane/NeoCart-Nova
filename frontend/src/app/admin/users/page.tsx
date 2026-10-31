"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  Search,
  Loader2,
  Mail,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
}

interface AdminUsersResponse {
  success: boolean;
  users: AdminUser[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
}

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, isFetching } = useQuery<AdminUsersResponse>(
    {
      queryKey: ["admin-users", searchQuery, page],
      queryFn: async () => {
        const params = new URLSearchParams({
          search: searchQuery.trim(),
          page: String(page),
          limit: String(PAGE_SIZE),
        });

        const res = await api.get(`/admin/users?${params.toString()}`);
        return res.data;
      },
      enabled: !!user && user.role === "admin",
      placeholderData: (previousData) => previousData,
    },
  );

  const users = data?.users ?? [];
  const totalUsers = data?.totalUsers ?? 0;
  const totalPages = Math.max(data?.totalPages ?? 1, 1);

  const startItem = totalUsers === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const endItem = Math.min(page * PAGE_SIZE, totalUsers);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

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
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search customers by name or email..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-blue dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
        />
      </div>

      {/* Customer Count */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Showing{" "}
          <span className="font-bold text-slate-900 dark:text-white">
            {startItem}-{endItem}
          </span>{" "}
          of{" "}
          <span className="font-bold text-slate-900 dark:text-white">
            {totalUsers}
          </span>{" "}
          customers
        </p>

        {isFetching && (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Updating...
          </span>
        )}
      </div>

      {/* Error State */}
      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400">
          Failed to load customers. Please refresh the page or try again.
        </div>
      )}

      {/* Users Table */}
      {users.length === 0 && !isError ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <Users className="mx-auto mb-2 h-10 w-10 text-slate-300" />

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            No registered customers found.
          </p>
        </div>
      ) : users.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Phone Number</th>
                  <th className="px-4 py-3">Joined Date</th>
                  <th className="px-4 py-3 text-right">Role</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((usr) => (
                  <tr
                    key={usr._id}
                    className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {usr.name}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {usr.email}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {usr.phone ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          {usr.phone}
                        </span>
                      ) : (
                        <span className="italic text-slate-400">
                          Not provided
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        {new Date(usr.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-brand-blue dark:bg-blue-950/60 dark:text-cyan-400">
                        {usr.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Pagination */}
      {totalUsers > 0 && (
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
    </main>
  );
}
