import React from "react";
import Link from "next/link";
import { Logo } from "./Logo";

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-brand-dark text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Info */}
          <div className="space-y-4">
            <Logo size="md" />
            <p className="text-xs leading-relaxed text-slate-400">
              NeoCart Nova delivers next-generation commerce with high-velocity
              inventory tracking and verified checkout guarantees.
            </p>
          </div>

          {/* Catalog Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Catalog
            </h3>
            <ul className="mt-4 space-y-2 text-xs">
              <li>
                <Link
                  href="/products?sort=newest"
                  className="transition hover:text-cyan-accent"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  href="/products?featured=true"
                  className="transition hover:text-cyan-accent"
                >
                  Featured Collections
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="transition hover:text-cyan-accent"
                >
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Customer Support
            </h3>
            <ul className="mt-4 space-y-2 text-xs">
              <li>
                <Link
                  href="/orders"
                  className="transition hover:text-cyan-accent"
                >
                  Order Tracking
                </Link>
              </li>
              <li>
                <span className="cursor-default text-slate-500">
                  Payment: Cash On Delivery
                </span>
              </li>
              <li>
                <span className="cursor-default text-slate-500">
                  Support: support@neocartnova.com
                </span>
              </li>
            </ul>
          </div>

          {/* Security & Trust */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Integrity
            </h3>
            <p className="mt-4 text-xs leading-relaxed text-slate-400">
              Server-validated stock verification and secure encrypted sessions.
              Zero unauthorized client price tampering.
            </p>
            <div className="mt-4 inline-block rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] text-cyan-accent">
              HttpOnly Authenticated
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800/80 pt-8 text-center text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} NeoCart Nova Inc. All rights
            reserved. Built for performance and reliability.
          </p>
        </div>
      </div>
    </footer>
  );
};
