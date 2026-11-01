import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://neo-cart-nova.vercel.app";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://neocart-nova-backend.onrender.com/api";

interface Product {
  slug: string;
  updatedAt?: string;
  createdAt?: string;
}

interface ProductsResponse {
  success: boolean;
  products: Product[];
  totalPages: number;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/products`,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  try {
    const firstResponse = await fetch(`${API_URL}/products?page=1&limit=100`, {
      next: { revalidate: 3600 },
    });

    if (!firstResponse.ok) {
      throw new Error(`Products API returned ${firstResponse.status}`);
    }

    const firstData: ProductsResponse = await firstResponse.json();

    if (!firstData.success || !Array.isArray(firstData.products)) {
      throw new Error("Invalid products API response");
    }

    const products = [...firstData.products];

    for (let page = 2; page <= firstData.totalPages; page++) {
      const response = await fetch(
        `${API_URL}/products?page=${page}&limit=100`,
        {
          next: { revalidate: 3600 },
        },
      );

      if (!response.ok) {
        throw new Error(`Products API page ${page} failed`);
      }

      const data: ProductsResponse = await response.json();

      if (!data.success || !Array.isArray(data.products)) {
        throw new Error(`Invalid products response on page ${page}`);
      }

      products.push(...data.products);
    }

    const productRoutes: MetadataRoute.Sitemap = products
      .filter((product) => typeof product.slug === "string" && product.slug)
      .map((product) => ({
        url: `${SITE_URL}/products/${encodeURIComponent(product.slug)}`,
        lastModified:
          product.updatedAt || product.createdAt
            ? new Date(product.updatedAt || product.createdAt!)
            : undefined,
        changeFrequency: "weekly",
        priority: 0.7,
      }));

    return [...staticRoutes, ...productRoutes];
  } catch (error) {
    console.error("Failed to generate product sitemap:", error);

    return staticRoutes;
  }
}
