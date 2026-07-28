export type WholesaleItem = {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  minUnits: number;
};

export const WHOLESALE_ITEMS: WholesaleItem[] = [
  { id: "jugos-caja", name: "Jugos prensados en frío (caja x12)", unit: "caja", pricePerUnit: 480, minUnits: 5 },
  { id: "charolas-bocadillos", name: "Charola de bocadillos saludables", unit: "charola", pricePerUnit: 650, minUnits: 3 },
  { id: "pasteles-zanahoria", name: "Pastel de zanahoria entero", unit: "pastel", pricePerUnit: 420, minUnits: 2 },
  { id: "catering-persona", name: "Catering para evento (por persona)", unit: "persona", pricePerUnit: 145, minUnits: 20 },
  { id: "bowls-oficina", name: "Bowls saludables para oficina", unit: "bowl", pricePerUnit: 119, minUnits: 15 },
];

export const VOLUME_DISCOUNTS = [
  { minUnits: 100, discount: 0.15 },
  { minUnits: 50, discount: 0.1 },
  { minUnits: 20, discount: 0.05 },
];

export function discountFor(units: number) {
  const tier = VOLUME_DISCOUNTS.find((t) => units >= t.minUnits);
  return tier?.discount ?? 0;
}
