import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/context/AuthContext";
import { StoreLayoutWrapper } from "@/components/layout/StoreLayoutWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NeoCart Nova — Premium Electronics & Verified Gear",
    template: "%s | NeoCart Nova",
  },
  description:
    "Production-grade e-commerce platform delivering high-performance audio, mechanical keyboards, gaming accessories, and verified consumer tech with doorstep Cash on Delivery.",
  keywords: [
    "Electronics",
    "Mechanical Keyboards",
    "Audio Gear",
    "Gaming Mouse",
    "E-commerce",
    "Cash on Delivery",
    "NeoCart Nova",
  ],
  authors: [{ name: "NeoCart Nova Engineering" }],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://neocart-nova.vercel.app",
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "NeoCart Nova",
    title: "NeoCart Nova — Premium Electronics & Tech Gear",
    description:
      "Explore curated tech products with live inventory reservation and secure doorstep delivery.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NeoCart Nova — High Performance Electronics",
    description:
      "Explore verified audio, productivity, and gaming gear with authentic customer reviews.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased text-slate-900 bg-white`}
      >
        <QueryProvider>
          <AuthProvider>
            <StoreLayoutWrapper>{children}</StoreLayoutWrapper>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
