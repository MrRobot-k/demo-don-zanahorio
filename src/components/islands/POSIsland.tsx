import { useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { getVariants, variantDisplayName } from "@/data/products";
import { fetchCategories, fetchProducts } from "@/lib/queries";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { cn, formatMXN } from "@/lib/utils";

type Tile = { id: string; name: string; price: number; emoji: string; categorySlug: string };

type TicketLine = { id: string; name: string; price: number; qty: number; emoji: string };
type Payment = "cash" | "card";

const KITCHEN_QUEUE = [
  { id: "5231", items: "2x Chilaquiles, 1x Jugo Verde", status: "En preparación" as const },
  { id: "5230", items: "1x Hamburguesa, 1x Agua de Sabores", status: "Listo" as const },
  { id: "5229", items: "3x Café", status: "Listo" as const },
];

export default function POSIsland() {
  const [category, setCategory] = useState<string>("Todos");
  const [ticket, setTicket] = useState<TicketLine[]>([]);
  const [payment, setPayment] = useState<Payment>("cash");
  const [cashGiven, setCashGiven] = useState("");
  const [receipt, setReceipt] = useState<{ id: string; total: number } | null>(null);
  const { data: categories, error: categoriesError, loading: categoriesLoading } = useSupabaseData(fetchCategories);
  const { data: products, error: productsError, loading: productsLoading } = useSupabaseData(fetchProducts);

  const tiles = useMemo<Tile[]>(() => {
    if (!products) return [];
    const emojiBySlug: Record<string, string> = {};
    categories?.forEach((c) => (emojiBySlug[c.slug] = c.emoji));
    return products.flatMap((product) =>
      getVariants(product).map((variant) => ({
        id: variant.id,
        name: variantDisplayName(product, variant),
        price: variant.price,
        emoji: emojiBySlug[product.categorySlug] ?? "🍽️",
        categorySlug: product.categorySlug,
      }))
    );
  }, [products, categories]);

  const filtered = useMemo(
    () => tiles.filter((t) => category === "Todos" || t.categorySlug === category),
    [tiles, category]
  );

  const total = ticket.reduce((sum, l) => sum + l.qty * l.price, 0);
  const change = payment === "cash" ? Math.max(Number(cashGiven || 0) - total, 0) : 0;
  const loading = categoriesLoading || productsLoading;
  const error = categoriesError || productsError;

  function addLine(tile: Tile) {
    setTicket((prev) => {
      const existing = prev.find((l) => l.id === tile.id);
      if (existing) {
        return prev.map((l) => (l.id === tile.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { id: tile.id, name: tile.name, price: tile.price, qty: 1, emoji: tile.emoji }];
    });
  }

  function changeQty(id: string, delta: number) {
    setTicket((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
  }

  function charge() {
    if (ticket.length === 0) return;
    if (payment === "cash" && Number(cashGiven || 0) < total) return;
    setReceipt({ id: String(Math.floor(5000 + Math.random() * 900)), total });
    setTicket([]);
    setCashGiven("");
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <div className="glass rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory("Todos")}
              className={cn(
                "rounded-full px-3 py-2 text-xs font-semibold transition",
                category === "Todos" ? "bg-carrot-500 text-ink-950" : "bg-carrot-50/10 text-carrot-50/75"
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
                  "rounded-full px-3 py-2 text-xs font-semibold transition",
                  category === c.slug ? "bg-carrot-500 text-ink-950" : "bg-carrot-50/10 text-carrot-50/75"
                )}
              >
                {c.emoji} {c.name}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="mt-5 text-center text-sm text-carrot-50/60">Cargando productos...</p>
          ) : error ? (
            <p className="mt-5 text-center text-sm text-red-400">{error}</p>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filtered.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => addLine(tile)}
                  className="glass glass-card flex flex-col items-center rounded-2xl p-4 text-center active:scale-95"
                >
                  <span className="text-3xl">{tile.emoji}</span>
                  <span className="mt-2 text-xs font-semibold leading-tight">{tile.name}</span>
                  <span className="mt-1 text-xs text-carrot-300">{formatMXN(tile.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="glass-strong flex h-fit flex-col rounded-2xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-carrot-300">Ticket actual</h2>

          {receipt ? (
            <div className="mt-6 rounded-2xl bg-leaf-500/15 p-5 text-center">
              <span className="text-3xl">✅</span>
              <p className="mt-2 text-sm font-semibold">Venta #{receipt.id} cobrada</p>
              <p className="text-xs text-carrot-50/60">Total {formatMXN(receipt.total)}</p>
              <button
                type="button"
                onClick={() => setReceipt(null)}
                className="mt-4 w-full rounded-full bg-carrot-500 py-2 text-xs font-semibold text-ink-950"
              >
                Nueva venta
              </button>
            </div>
          ) : (
            <>
              {ticket.length === 0 ? (
                <p className="mt-6 text-center text-sm text-carrot-50/50">Toca un producto para agregarlo</p>
              ) : (
                <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {ticket.map((line) => (
                    <li key={line.id} className="flex items-center gap-2 rounded-xl bg-carrot-50/5 p-2.5">
                      <span className="text-lg">{line.emoji}</span>
                      <div className="flex-1">
                        <p className="text-xs font-medium">{line.name}</p>
                        <p className="text-[11px] text-carrot-50/50">{formatMXN(line.price)} c/u</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => changeQty(line.id, -1)}
                        className="grid h-6 w-6 place-items-center rounded-full bg-carrot-50/10"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="w-4 text-center text-xs font-semibold">{line.qty}</span>
                      <button
                        type="button"
                        onClick={() => changeQty(line.id, 1)}
                        className="grid h-6 w-6 place-items-center rounded-full bg-carrot-500 text-ink-950"
                      >
                        <Plus size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => changeQty(line.id, -line.qty)}
                        className="text-carrot-50/30 hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex justify-between border-t border-carrot-50/15 pt-3 text-lg font-bold">
                <span>Total</span>
                <span>{formatMXN(total)}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {(["cash", "card"] as Payment[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPayment(opt)}
                    className={cn(
                      "rounded-xl py-2 text-xs font-semibold transition",
                      payment === opt ? "bg-carrot-500 text-ink-950" : "bg-carrot-50/10 text-carrot-50/75"
                    )}
                  >
                    {opt === "cash" ? "💵 Efectivo" : "💳 Tarjeta"}
                  </button>
                ))}
              </div>

              {payment === "cash" && (
                <div className="mt-3">
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder="Efectivo recibido"
                    className="w-full rounded-xl bg-carrot-50/10 px-3 py-2 text-sm placeholder:text-carrot-50/40 focus:outline-none focus:ring-2 focus:ring-carrot-400"
                  />
                  {Number(cashGiven || 0) >= total && total > 0 && (
                    <p className="mt-1.5 text-xs text-leaf-300">Cambio: {formatMXN(change)}</p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={charge}
                disabled={ticket.length === 0 || (payment === "cash" && Number(cashGiven || 0) < total)}
                className="mt-4 w-full rounded-full bg-leaf-500 py-3 text-sm font-semibold text-ink-950 transition hover:bg-leaf-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Cobrar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-carrot-300">Comandas activas</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {KITCHEN_QUEUE.map((order) => (
            <div key={order.id} className="glass glass-card rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-carrot-50/50">#{order.id}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    order.status === "Listo" ? "bg-leaf-500/20 text-leaf-300" : "bg-carrot-500/20 text-carrot-300"
                  )}
                >
                  {order.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-carrot-50/80">{order.items}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
