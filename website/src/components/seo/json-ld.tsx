import type { Product } from "@/types/product";

export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "Secured Tampa",
    url: "https://securedtampa.com",
    telephone: "(813) 943-2777",
    address: {
      "@type": "PostalAddress",
      streetAddress: "2398 Grand Cypress Dr STE 420",
      addressLocality: "Lutz",
      addressRegion: "FL",
      postalCode: "33559",
      addressCountry: "US",
    },
    description:
      "Premium sneakers, streetwear, and Pokémon collectibles in Tampa, FL.",
    priceRange: "$$",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "11:00",
        closes: "19:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Sunday",
        opens: "12:00",
        closes: "17:00",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ProductJsonLd({ product }: { product: Product }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? `${product.name} available at Secured Tampa`,
    image: product.images?.[0] ?? undefined,
    brand: {
      "@type": "Brand",
      name: product.brand ?? "Secured Tampa",
    },
    offers: {
      "@type": "Offer",
      url: `https://securedtampa.com/product/${product.id}`,
      priceCurrency: "USD",
      price: product.price.toFixed(2),
      availability:
        (product.quantity ?? 1) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Secured Tampa",
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
