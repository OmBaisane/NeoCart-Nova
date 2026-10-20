"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const StoreLayoutWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-100/70 transition-colors duration-200 dark:bg-slate-950">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white transition-colors duration-200 dark:bg-slate-950">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
};
