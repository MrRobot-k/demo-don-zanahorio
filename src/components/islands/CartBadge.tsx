import { useStore } from "@nanostores/react";
import { ShoppingBasket } from "lucide-react";
import { $cartCount } from "@/stores/cart";

export default function CartBadge() {
  const count = useStore($cartCount);

  return (
    <a
      href="/carrito"
      aria-label="Ver carrito"
      className="glass glass-card relative flex h-11 w-11 items-center justify-center rounded-full text-carrot-100 hover:text-carrot-300"
    >
      <ShoppingBasket size={19} strokeWidth={2} />
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-carrot-500 px-1 text-[11px] font-bold text-ink-950 shadow-glass">
          {count}
        </span>
      )}
    </a>
  );
}
