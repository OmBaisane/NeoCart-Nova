import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/providers/ThemeProvider";
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://neo-cart-nova.vercel.app",
  ),
  title: {
    default: "NeoCart Nova — Premium Electronics & Verified Gear",
    template: "%s | NeoCart Nova",
  },
  description:
    "Discover premium electronics, mechanical keyboards, audio gear and gaming accessories at NeoCart Nova. Explore verified products with secure Cash on Delivery.",
  keywords: [
    "NeoCart Nova",
    "Premium Electronics",
    "Mechanical Keyboards",
    "Audio Gear",
    "Gaming Accessories",
    "Electronics Store",
    "Cash on Delivery",
  ],
  authors: [{ name: "NeoCart Nova" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "NeoCart Nova",
    title: "NeoCart Nova — Premium Electronics & Tech Gear",
    description:
      "Explore premium electronics, verified products and gaming gear with secure Cash on Delivery.",
    images: [
      {
        url: "/og-image.png",
        width: 1648,
        height: 928,
        alt: "NeoCart Nova — Premium Electronics & Tech Gear",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NeoCart Nova — Premium Electronics & Tech Gear",
    description:
      "Discover verified electronics, audio and gaming accessories at NeoCart Nova.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100 transition-colors duration-200`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <StoreLayoutWrapper>{children}</StoreLayoutWrapper>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
