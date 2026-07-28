import { computed } from "nanostores";
import { persistentMap } from "@nanostores/persistent";

export type CartLine = {
  id: string;
  name: string;
  price: number;
  qty: number;
  emoji: string;
};

type CartState = Record<string, string>;

export const $cartRaw = persistentMap<CartState>("dz-cart:", {});

function readLine(key: string): CartLine | null {
  const raw = $cartRaw.get()[key];
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CartLine;
  } catch {
    return null;
  }
}

export function getCartLines(): CartLine[] {
  return Object.keys($cartRaw.get())
    .map(readLine)
    .filter((l): l is CartLine => l !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const $cartLines = computed($cartRaw, () => getCartLines());

export const $cartCount = computed($cartLines, (lines) =>
  lines.reduce((sum, l) => sum + l.qty, 0)
);

export const $cartTotal = computed($cartLines, (lines) =>
  lines.reduce((sum, l) => sum + l.qty * l.price, 0)
);

export function addToCart(item: Omit<CartLine, "qty">, qty = 1) {
  const existing = readLine(item.id);
  const nextQty = (existing?.qty ?? 0) + qty;
  $cartRaw.setKey(item.id, JSON.stringify({ ...item, qty: nextQty }));
}

export function setQty(id: string, qty: number) {
  const existing = readLine(id);
  if (!existing) return;
  if (qty <= 0) {
    $cartRaw.setKey(id, undefined as unknown as string);
    return;
  }
  $cartRaw.setKey(id, JSON.stringify({ ...existing, qty }));
}

export function removeFromCart(id: string) {
  $cartRaw.setKey(id, undefined as unknown as string);
}

export function clearCart() {
  for (const key of Object.keys($cartRaw.get())) {
    $cartRaw.setKey(key, undefined as unknown as string);
  }
}
