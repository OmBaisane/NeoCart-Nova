import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeoCart Nova — Modern E-Commerce Platform",
  description:
    "Production-oriented full-stack e-commerce experience built with Next.js, Express, and TypeScript.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-brand-bg text-brand-charcoal antialiased selection:bg-brand-blue selection:text-white">
        {children}
      </body>
    </html>
  );
}
