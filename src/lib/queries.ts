import { supabase } from "@/lib/supabase";
import type { Category, Product } from "@/data/products";
import type { Coupon } from "@/data/promotions";
import type { Plan } from "@/data/plans";
import type { Cashier, JobPosition } from "@/data/team";

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, emoji")
    .eq("active", true)
    .order("sort_order");
  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    emoji: row.emoji ?? "🍽️",
  }));
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("slug, name, description, price_medium, price_large, categories(slug, name)")
    .eq("active", true)
    .order("name");
  if (error) throw error;

  return data.map((row) => {
    const category = row.categories as unknown as { slug: string; name: string } | null;
    return {
      id: row.slug,
      name: row.name,
      description: row.description ?? "",
      categorySlug: category?.slug ?? "",
      categoryName: category?.name ?? "",
      priceMedium: row.price_medium !== null ? Number(row.price_medium) : null,
      priceLarge: row.price_large !== null ? Number(row.price_large) : null,
    };
  });
}

export async function fetchCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from("coupons")
    .select("code, title, description, discount_label, discount_percent, valid_until, only_online")
    .eq("active", true)
    .order("created_at");
  if (error) throw error;

  return data.map((row) => ({
    code: row.code,
    title: row.title,
    description: row.description ?? "",
    discount: row.discount_label,
    discountPercent: row.discount_percent ?? undefined,
    validUntil: row.valid_until
      ? new Date(row.valid_until).toLocaleDateString("es-MX", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Vigencia permanente",
    onlyOnline: row.only_online,
  }));
}

export async function fetchPlans(): Promise<Plan[]> {
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("slug, name, price, period, emoji, perk, benefits, highlight")
    .eq("active", true)
    .order("price");
  if (error) throw error;

  return data.map((row) => ({
    id: row.slug,
    name: row.name,
    price: Number(row.price),
    period: row.period as Plan["period"],
    emoji: row.emoji,
    perk: row.perk ?? "",
    benefits: row.benefits,
    highlight: row.highlight,
  }));
}

export async function fetchCashiers(): Promise<Cashier[]> {
  const { data, error } = await supabase
    .from("cashiers")
    .select("id, name, role, avatar_emoji")
    .eq("active", true)
    .order("name");
  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role ?? "",
    emoji: row.avatar_emoji,
  }));
}

export async function fetchJobPositions(): Promise<JobPosition[]> {
  const { data, error } = await supabase
    .from("job_positions")
    .select("id, title, summary, responsibilities")
    .order("title");
  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    summary: row.summary ?? "",
    responsibilities: row.responsibilities,
  }));
}

// =========================================================
// Escrituras (formularios públicos)
// =========================================================

export async function submitOrder(params: {
  fulfillmentType: "pickup" | "delivery";
  address: string | null;
  paymentMethod: "card" | "cash";
  subtotal: number;
  shippingCost: number;
  discount: number;
  couponCode: string | null;
  total: number;
  items: Array<{ name: string; price: number; qty: number }>;
}) {
  const orderId = crypto.randomUUID();

  const { error: orderError } = await supabase.from("orders").insert({
    id: orderId,
    fulfillment_type: params.fulfillmentType,
    address: params.address,
    payment_method: params.paymentMethod,
    subtotal: params.subtotal,
    shipping_cost: params.shippingCost,
    discount: params.discount,
    coupon_code: params.couponCode,
    total: params.total,
  });
  if (orderError) throw orderError;

  const { error: itemsError } = await supabase.from("order_items").insert(
    params.items.map((item) => ({
      order_id: orderId,
      name: item.name,
      price: item.price,
      qty: item.qty,
    }))
  );
  if (itemsError) throw itemsError;

  return orderId;
}

export async function submitWholesaleOrder(params: {
  customerName: string;
  company: string | null;
  phone: string;
  itemName: string;
  units: number;
  unitPrice: number;
  fulfillmentType: "pickup" | "delivery";
  eventDate: string | null;
  notes: string | null;
  quoteTotal: number;
}) {
  const { error } = await supabase.from("wholesale_orders").insert({
    customer_name: params.customerName,
    company: params.company,
    phone: params.phone,
    item_name: params.itemName,
    units: params.units,
    unit_price: params.unitPrice,
    fulfillment_type: params.fulfillmentType,
    event_date: params.eventDate,
    notes: params.notes,
    quote_total: params.quoteTotal,
  });
  if (error) throw error;
}

export async function submitSurvey(params: {
  branchRating: number;
  serviceRating: number;
  cashierId: string | null;
  comments: string | null;
}) {
  const { error } = await supabase.from("surveys").insert({
    branch_rating: params.branchRating,
    service_rating: params.serviceRating,
    cashier_id: params.cashierId,
    comments: params.comments,
  });
  if (error) throw error;
}

export async function submitGoogleReviewClick() {
  await supabase.from("google_reviews").insert({});
}

export async function submitJobApplication(params: { name: string; phone: string; positionId: string }) {
  const { error } = await supabase.from("job_applications").insert({
    name: params.name,
    phone: params.phone,
    position_id: params.positionId,
  });
  if (error) throw error;
}

export async function submitEmployeeReferral(params: {
  candidateName: string;
  candidatePhone: string;
  positionId: string;
}) {
  const { error } = await supabase.from("employee_referrals").insert({
    candidate_name: params.candidateName,
    candidate_phone: params.candidatePhone,
    position_id: params.positionId,
  });
  if (error) throw error;
}
