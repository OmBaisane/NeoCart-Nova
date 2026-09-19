"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "./Logo";
import {
  Search,
  ShoppingCart,
  User as UserIcon,
  LogOut,
  Package,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center">
          <Logo size="md" />
        </div>

        {/* Global Search Bar (Desktop) */}
        <form
          onSubmit={handleSearch}
          className="hidden flex-1 max-w-md mx-8 md:block"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search products, brands, essentials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-slate-300 bg-slate-50 py-2 pl-10 pr-4 text-sm text-brand-charcoal outline-none transition-all placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
            />
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          </div>
        </form>

        {/* Navigation Actions */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/products"
            className="text-sm font-medium text-slate-700 transition-colors hover:text-brand-blue"
          >
            Catalog
          </Link>

          {/* Cart Trigger */}
          <Link
            href="/cart"
            className="relative flex items-center gap-1 text-sm font-medium text-slate-700 transition-colors hover:text-brand-blue"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden lg:inline">Cart</span>
          </Link>

          {/* Auth State Triggers */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1.5 px-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white uppercase">
                  {user.name.charAt(0)}
                </div>
                <span className="max-w-25 truncate">{user.name}</span>
              </button>

              {/* User Dropdown */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-2 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2">
                  <div className="border-b border-slate-100 px-4 py-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Signed in as
                    </p>
                    <p className="truncate text-xs font-medium text-brand-charcoal">
                      {user.email}
                    </p>
                  </div>

                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-brand-blue hover:bg-blue-50"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Admin Portal
                    </Link>
                  )}

                  <Link
                    href="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <UserIcon className="h-4 w-4" />
                    My Profile
                  </Link>

                  <Link
                    href="/orders"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <Package className="h-4 w-4" />
                    My Orders
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 transition-colors hover:text-brand-blue"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
              >
                Register
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 pt-2 pb-6 md:hidden">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </form>

          <nav className="flex flex-col gap-3">
            <Link
              href="/products"
              onClick={() => setIsMenuOpen(false)}
              className="py-1 text-sm font-medium text-slate-700"
            >
              Browse Catalog
            </Link>
            <Link
              href="/cart"
              onClick={() => setIsMenuOpen(false)}
              className="py-1 text-sm font-medium text-slate-700"
            >
              Shopping Cart
            </Link>

            {user ? (
              <>
                <Link
                  href="/orders"
                  onClick={() => setIsMenuOpen(false)}
                  className="py-1 text-sm font-medium text-slate-700"
                >
                  My Orders
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="py-1 text-sm font-semibold text-brand-blue"
                  >
                    Admin Portal
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="py-1 text-left text-sm font-medium text-rose-600"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 rounded-lg border border-slate-300 py-2 text-center text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 rounded-lg bg-brand-blue py-2 text-center text-sm font-medium text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
