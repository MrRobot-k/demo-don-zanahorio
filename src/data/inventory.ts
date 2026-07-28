export type InventoryItem = {
  ingredient: string;
  stock: number;
  unit: string;
  min: number;
};

export const INVENTORY: InventoryItem[] = [
  { ingredient: "Zanahoria fresca", stock: 38, unit: "kg", min: 15 },
  { ingredient: "Pan artesanal", stock: 6, unit: "paquetes", min: 10 },
  { ingredient: "Queso crema", stock: 4, unit: "kg", min: 5 },
  { ingredient: "Aguacate", stock: 22, unit: "kg", min: 8 },
  { ingredient: "Vasos para jugo", stock: 3, unit: "paquetes", min: 6 },
  { ingredient: "Pechuga de pollo", stock: 18, unit: "kg", min: 10 },
];

export function isLowStock(item: InventoryItem) {
  return item.stock <= item.min;
}
