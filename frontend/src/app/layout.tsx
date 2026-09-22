import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { StoreLayoutWrapper } from "@/components/layout/StoreLayoutWrapper";

export const metadata: Metadata = {
  title: "NeoCart Nova — Modern E-Commerce Platform",
  description:
    "Production-oriented full-stack e-commerce experience built with Next.js, Express, and TypeScript.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-brand-bg text-brand-charcoal antialiased selection:bg-brand-blue selection:text-white">
        <QueryProvider>
          <AuthProvider>
            <StoreLayoutWrapper>{children}</StoreLayoutWrapper>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
