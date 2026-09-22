"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/layout/Logo";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Store,
  ShieldCheck,
  Loader2,
  ChevronRight,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Role Guard: Redirect non-admins away
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "admin") {
        router.push("/");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        <p className="text-xs font-semibold text-slate-500">
          Verifying administrative permissions...
        </p>
      </div>
    );
  }

  const navLinks = [
    {
      name: "Overview",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      name: "Products Catalog",
      href: "/admin/products",
      icon: Package,
      active: pathname.startsWith("/admin/products"),
    },
    {
      name: "Customer Orders",
      href: "/admin/orders",
      icon: ShoppingBag,
      active: pathname.startsWith("/admin/orders"),
    },
    {
      name: "User Directory",
      href: "/admin/users",
      icon: Users,
      active: pathname.startsWith("/admin/users"),
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-140px)] bg-slate-50/60">
      {/* Admin Sidebar Navigation */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">
        <div className="flex h-full flex-col justify-between p-4">
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 px-2 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue text-white shadow-xs">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-brand-charcoal">
                  Admin Portal
                </h2>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  Authorized Session
                </span>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                      link.active
                        ? "bg-blue-50 text-brand-blue"
                        : "text-slate-600 hover:bg-slate-50 hover:text-brand-charcoal"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4" />
                      <span>{link.name}</span>
                    </div>
                    {link.active && <ChevronRight className="h-3.5 w-3.5" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick exit back to storefront */}
          <div className="border-t border-slate-100 pt-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <Store className="h-4 w-4 text-slate-500" />
              <span>Back to Storefront</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Admin View Content */}
      <div className="flex-1 p-4 sm:p-8">{children}</div>
    </div>
  );
}
