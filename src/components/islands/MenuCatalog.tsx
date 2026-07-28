import { useMemo, useState } from "react";
import { useStore } from "@nanostores/react";
import { Minus, Plus, Search } from "lucide-react";
import { getVariants, variantDisplayName, type Product } from "@/data/products";
import { $cartRaw, addToCart, setQty } from "@/stores/cart";
import { formatMXN, cn } from "@/lib/utils";
import { fetchCategories, fetchProducts } from "@/lib/queries";
import { useSupabaseData } from "@/hooks/useSupabaseData";

function useQty(id: string) {
  const raw = useStore($cartRaw);
  const entry = raw[id];
  if (!entry) return 0;
  try {
    return (JSON.parse(entry) as { qty: number }).qty ?? 0;
  } catch {
    return 0;
  }
}

function VariantRow({ product, variant, emoji }: { product: Product; variant: ReturnType<typeof getVariants>[number]; emoji: string }) {
  const qty = useQty(variant.id);

  return (
    <div className="flex items-center justify-between rounded-xl bg-carrot-50/5 px-3 py-2">
      <span className="text-xs text-carrot-50/70">
        {variant.sizeLabel ?? "Precio"} · <span className="font-semibold text-carrot-200">{formatMXN(variant.price)}</span>
      </span>
      {qty === 0 ? (
        <button
          type="button"
          onClick={() => addToCart({ id: variant.id, name: variantDisplayName(product, variant), price: variant.price, emoji }, 1)}
          className="rounded-full bg-carrot-500 px-3 py-1 text-xs font-semibold text-ink-950 transition hover:bg-carrot-400"
        >
          Agregar
        </button>
      ) : (
        <div className="glass flex items-center gap-2 rounded-full px-2 py-0.5">
          <button
            type="button"
            aria-label="Quitar uno"
            onClick={() => setQty(variant.id, qty - 1)}
            className="grid h-6 w-6 place-items-center rounded-full bg-carrot-50/10 hover:bg-carrot-50/20"
          >
            <Minus size={12} />
          </button>
          <span className="w-4 text-center text-xs font-semibold">{qty}</span>
          <button
            type="button"
            aria-label="Agregar uno"
            onClick={() => addToCart({ id: variant.id, name: variantDisplayName(product, variant), price: variant.price, emoji }, 1)}
            className="grid h-6 w-6 place-items-center rounded-full bg-carrot-500 text-ink-950 hover:bg-carrot-400"
          >
            <Plus size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, emoji }: { product: Product; emoji: string }) {
  const variants = getVariants(product);

  return (
    <div className="glass glass-card flex flex-col rounded-2xl p-5">
      <span className="text-3xl">{emoji}</span>
      <h3 className="mt-3 font-semibold text-carrot-50">{product.name}</h3>
      <p className="mt-1 flex-1 text-xs text-carrot-50/65">{product.description}</p>
      <div className="mt-4 space-y-2">
        {variants.map((variant) => (
          <VariantRow key={variant.id} product={product} variant={variant} emoji={emoji} />
        ))}
      </div>
    </div>
  );
}

function initialCategory() {
  if (typeof window === "undefined") return "Todos";
  return new URLSearchParams(window.location.search).get("categoria") || "Todos";
}

export default function MenuCatalog() {
  const [category, setCategory] = useState<string>(initialCategory);
  const [query, setQuery] = useState("");
  const { data: categories, error: categoriesError, loading: categoriesLoading } = useSupabaseData(fetchCategories);
  const { data: products, error: productsError, loading: productsLoading } = useSupabaseData(fetchProducts);

  const emojiBySlug = useMemo(() => {
    const map: Record<string, string> = {};
    categories?.forEach((c) => (map[c.slug] = c.emoji));
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    return (products ?? []).filter((p) => {
      const matchesCategory = category === "Todos" || p.categorySlug === category;
      const matchesQuery = p.name.toLowerCase().includes(query.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [products, category, query]);

  const loading = categoriesLoading || productsLoading;
  const error = categoriesError || productsError;

  return (
    <div>
      <div className="glass sticky top-20 z-20 flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("Todos")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              category === "Todos" ? "bg-carrot-500 text-ink-950" : "bg-carrot-50/10 text-carrot-50/75 hover:bg-carrot-50/20"
            )}
          >
            Todos
          </button>
          {categories?.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setCategory(c.slug)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                category === c.slug ? "bg-carrot-500 text-ink-950" : "bg-carrot-50/10 text-carrot-50/75 hover:bg-carrot-50/20"
              )}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-carrot-50/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar platillo..."
            className="w-full rounded-full bg-carrot-50/10 py-2 pl-9 pr-4 text-sm text-carrot-50 placeholder:text-carrot-50/40 focus:outline-none focus:ring-2 focus:ring-carrot-400 sm:w-56"
          />
        </div>
      </div>

      {loading ? (
        <p className="mt-10 text-center text-sm text-carrot-50/60">Cargando menú...</p>
      ) : error ? (
        <p className="mt-10 text-center text-sm text-red-400">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-carrot-50/60">No encontramos platillos con ese criterio.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} emoji={emojiBySlug[product.categorySlug] ?? "🍽️"} />
          ))}
        </div>
      )}
    </div>
  );
}
