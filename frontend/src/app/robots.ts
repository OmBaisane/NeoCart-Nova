import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://neo-cart-nova.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/checkout",
        "/cart",
        "/profile",
        "/orders",
        "/order-success",
        "/order-success/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
