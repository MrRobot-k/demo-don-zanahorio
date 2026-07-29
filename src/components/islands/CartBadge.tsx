import { useStore } from "@nanostores/react";
import { ShoppingBasket } from "lucide-react";
import { $cartCount } from "@/stores/cart";
import { useMounted } from "@/hooks/useMounted";

export default function CartBadge() {
  const count = useStore($cartCount);
  // Cart contents live in localStorage, which the server can't see: treat
  // the count as 0 until after hydration so the first client render matches
  // what was server-rendered.
  const displayCount = useMounted() ? count : 0;

  return (
    <a
      href="/carrito"
      aria-label="Ver carrito"
      className="glass glass-card relative flex h-11 w-11 items-center justify-center rounded-full text-carrot-100 hover:text-carrot-300"
    >
      <ShoppingBasket size={19} strokeWidth={2} />
      {displayCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-carrot-500 px-1 text-[11px] font-bold text-ink-950 shadow-glass">
          {displayCount}
        </span>
      )}
    </a>
  );
}
