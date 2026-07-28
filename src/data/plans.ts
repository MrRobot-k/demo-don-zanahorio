export type Plan = {
  id: string;
  name: string;
  price: number;
  period: "mes";
  emoji: string;
  perk: string;
  benefits: string[];
  highlight?: boolean;
};
