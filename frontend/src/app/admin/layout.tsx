"use client";

import React, { useState, useEffect } from "react";
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
  LogOut,
  Loader2,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Route change hone par mobile drawer automatically band ho jaye
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        <p className="text-xs font-semibold text-slate-400">
          Verifying administrative privileges...
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

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen bg-slate-100/70">
      {/* 1. Desktop Dedicated Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white md:flex">
        <div className="space-y-6 p-4">
          <div className="flex items-center gap-3 border-b border-slate-100 px-2 pb-4">
            <Logo size="sm" />
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-blue">
              Admin
            </span>
          </div>

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

        <div className="space-y-2 border-t border-slate-100 p-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <Store className="h-4 w-4 text-slate-500" />
            <span>Storefront View</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Mobile Drawer Overlay & Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-over Menu Panel */}
          <div className="relative flex w-4/5 max-w-xs flex-1 flex-col justify-between bg-white p-5 shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Logo size="sm" />
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-blue">
                    Admin
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                  aria-label="Close mobile navigation"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Navigation Links */}
              <nav className="space-y-1.5">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
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

            {/* Mobile Footer Shortcuts */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <Store className="h-4 w-4 text-slate-500" />
                <span>Storefront View</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Admin Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Responsive Admin Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Open mobile navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-blue" />
              <span className="text-xs font-bold tracking-tight text-slate-800 truncate max-w-47.5 sm:max-w-none">
                Admin Control Center
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 px-2.5 sm:px-3 text-xs font-semibold text-slate-800">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-blue text-[10px] font-bold text-white uppercase">
                {user.name.charAt(0)}
              </div>
              <span className="hidden sm:inline max-w-32 truncate">
                {user.name}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Admin Page Content */}
        <main className="flex-1 p-3 sm:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
