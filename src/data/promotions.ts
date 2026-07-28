export type Coupon = {
  code: string;
  title: string;
  description: string;
  discount: string;
  discountPercent?: number;
  validUntil: string;
  onlyOnline?: boolean;
};
