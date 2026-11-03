import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://neo-cart-nova.vercel.app";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://neocart-nova-backend.onrender.com/api";

interface ProductMetadataResponse {
  success?: boolean;
  product?: {
    name?: string;
    description?: string;
    slug?: string;
    images?: string[];
    price?: number;
    discountPrice?: number;
    category?: { name?: string } | string;
  };
}

function cleanDescription(value: unknown): string {
  if (typeof value !== "string") {
    return "Explore product details, verified specifications and secure Cash on Delivery at NeoCart Nova.";
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 160
    ? `${normalized.slice(0, 157).trimEnd()}...`
    : normalized;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const canonicalUrl = `${SITE_URL}/products/${encodeURIComponent(slug)}`;

  try {
    const response = await fetch(
      `${API_URL}/products/${encodeURIComponent(slug)}`,
      { next: { revalidate: 3600 } },
    );

    if (!response.ok) {
      return {
        title: "Product unavailable",
        description: "This product is currently unavailable at NeoCart Nova.",
        robots: { index: false, follow: false },
      };
    }

    const data = (await response.json()) as ProductMetadataResponse;
    const product = data.product;

    if (!data.success || !product?.name) {
      return {
        title: "Product unavailable",
        description: "This product is currently unavailable at NeoCart Nova.",
        robots: { index: false, follow: false },
      };
    }

    const description = cleanDescription(product.description);
    const image = product.images?.find(
      (url) => typeof url === "string" && /^https:\/\//i.test(url),
    );
    const title = `${product.name} | NeoCart Nova`;

    return {
      title: product.name,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        type: "website",
        url: canonicalUrl,
        siteName: "NeoCart Nova",
        title,
        description,
        ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch {
    return {
      title: "Product details",
      description:
        "Explore verified electronics and tech gear with secure Cash on Delivery at NeoCart Nova.",
      alternates: { canonical: canonicalUrl },
    };
  }
}

export default function ProductSlugLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
