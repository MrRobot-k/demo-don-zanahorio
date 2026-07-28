export type Category = {
  id: string;
  slug: string;
  name: string;
  emoji: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  categorySlug: string;
  categoryName: string;
  priceMedium: number | null;
  priceLarge: number | null;
};

export type ProductVariant = {
  id: string;
  sizeLabel: "Mediano" | "Grande" | null;
  price: number;
};

/** Un producto con un solo precio se vende en talla única; con ambos, el cliente elige. */
export function getVariants(product: Product): ProductVariant[] {
  const hasBoth = product.priceMedium != null && product.priceLarge != null;
  const variants: ProductVariant[] = [];
  if (product.priceMedium != null) {
    variants.push({ id: `${product.id}--mediano`, sizeLabel: hasBoth ? "Mediano" : null, price: product.priceMedium });
  }
  if (product.priceLarge != null) {
    variants.push({ id: `${product.id}--grande`, sizeLabel: hasBoth ? "Grande" : null, price: product.priceLarge });
  }
  return variants;
}

export function variantDisplayName(product: Product, variant: ProductVariant) {
  return variant.sizeLabel ? `${product.name} (${variant.sizeLabel})` : product.name;
}

export function getCheapest(products: Product[], count: number): Product[] {
  return [...products]
    .sort((a, b) => (a.priceMedium ?? a.priceLarge ?? 0) - (b.priceMedium ?? b.priceLarge ?? 0))
    .slice(0, count);
}
