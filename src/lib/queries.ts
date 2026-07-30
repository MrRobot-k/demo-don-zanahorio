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

export async function fetchNewestProducts(limit: number): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("slug, name, description, price_medium, price_large, categories(slug, name)")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(limit);
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

export type BestSeller = { name: string; price: number; unitsSold: number };

// order_items is RLS-restricted to staff, so this reads through a
// SECURITY DEFINER RPC that returns only the aggregate (name/price/qty
// sold), never raw order or customer data, to anonymous visitors.
export async function fetchBestSellers(limit: number): Promise<BestSeller[]> {
  const { data, error } = await supabase.rpc("get_best_sellers", { p_limit: limit });
  if (error) throw error;
  return (data ?? []).map((row: { name: string; price: number; units_sold: number }) => ({
    name: row.name,
    price: Number(row.price),
    unitsSold: Number(row.units_sold),
  }));
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

export type DeliveryZone = { id: string; name: string; distanceKm: number };

export async function fetchDeliveryZones(): Promise<DeliveryZone[]> {
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("id, name, distance_km")
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return data.map((row) => ({ id: row.id, name: row.name, distanceKm: Number(row.distance_km) }));
}

export type ReviewRewardConfig = {
  discountPercent: number;
  validDays: number;
  cooldownDays: number;
  active: boolean;
};

export async function fetchReviewRewardConfig(): Promise<ReviewRewardConfig> {
  const { data, error } = await supabase
    .from("review_reward_config")
    .select("discount_percent, valid_days, cooldown_days, active")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return {
    discountPercent: Number(data.discount_percent),
    validDays: data.valid_days,
    cooldownDays: data.cooldown_days,
    active: data.active,
  };
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
  deliveryZoneId?: string | null;
  distanceKm?: number | null;
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
    delivery_zone_id: params.deliveryZoneId ?? null,
    distance_km: params.distanceKm ?? null,
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
  deliveryZoneId?: string | null;
  shippingCost?: number;
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
    delivery_zone_id: params.deliveryZoneId ?? null,
    shipping_cost: params.shippingCost ?? 0,
  });
  if (error) throw error;
}

/**
 * Replaces submitSurvey: inserts the survey and, server-side in the same
 * transaction, credits the voted cashier's linked employee when the
 * service rating clears the configured threshold (section 2.5).
 */
export async function submitSurveyWithIncentive(params: {
  branchRating: number;
  serviceRating: number;
  cashierId: string | null;
  comments: string | null;
  contact?: string | null;
}): Promise<string> {
  const { data, error } = await supabase.rpc("submit_survey_with_incentive", {
    p_branch_rating: params.branchRating,
    p_service_rating: params.serviceRating,
    p_cashier_id: params.cashierId,
    p_comments: params.comments,
    p_contact: params.contact ?? null,
  });
  if (error) throw error;
  return data as string;
}

export type ReviewReward = { code: string; discountPercent: number; expiresAt: string };

/**
 * Registers who left the Google review (google_reviews.customer_id) and
 * issues a personal, single-use coupon in the same transaction.
 */
export async function claimGoogleReviewReward(contact: string): Promise<ReviewReward> {
  const { data, error } = await supabase.rpc("claim_google_review_reward", { p_contact: contact });
  if (error) {
    const map: Record<string, string> = {
      cuenta_no_encontrada: "Necesitas una cuenta de fidelización para recibir el cupón. Regístrate en Fidelización primero.",
      recompensa_no_disponible: "La recompensa por reseñas no está disponible en este momento.",
      ya_reclamado_recientemente: "Ya reclamaste este beneficio recientemente. Vuelve a intentarlo más adelante.",
    };
    const key = Object.keys(map).find((k) => error.message.includes(k));
    throw new Error(key ? map[key] : error.message);
  }
  return { code: data.code, discountPercent: Number(data.discountPercent), expiresAt: data.expiresAt };
}

export type CustomerCoupon = {
  id: string;
  code: string;
  title: string;
  discountPercent: number;
  expiresAt: string | null;
  redeemedAt: string | null;
};

export async function fetchCustomerCoupons(contact: string): Promise<CustomerCoupon[]> {
  const { data, error } = await supabase.rpc("get_customer_coupons", { p_contact: contact });
  if (error) throw error;
  return (data ?? []).map(
    (row: { id: string; code: string; title: string; discount_percent: number; expires_at: string | null; redeemed_at: string | null }) => ({
      id: row.id,
      code: row.code,
      title: row.title,
      discountPercent: Number(row.discount_percent),
      expiresAt: row.expires_at,
      redeemedAt: row.redeemed_at,
    })
  );
}

export type CouponValidation = {
  kind: "personal" | "global";
  code: string;
  discountPercent: number | null;
  title: string;
  discountLabel?: string;
};

/** Server-side validation: checks ownership, redemption and expiry — the client-side lookup did none of that. */
export async function validateCoupon(code: string, contact: string | null): Promise<CouponValidation | null> {
  const { data, error } = await supabase.rpc("validate_coupon", { p_code: code, p_contact: contact });
  if (error) throw error;
  if (!data) return null;
  return {
    kind: data.kind,
    code: data.code,
    discountPercent: data.discountPercent != null ? Number(data.discountPercent) : null,
    title: data.title,
    discountLabel: data.discountLabel,
  };
}

export async function redeemCustomerCoupon(code: string, orderId: string) {
  const { error } = await supabase.rpc("redeem_customer_coupon", { p_code: code, p_order_id: orderId });
  if (error) throw error;
}

export async function submitJobApplication(params: {
  name: string;
  phone: string;
  positionId: string;
  cvPath: string | null;
}) {
  const { error } = await supabase.from("job_applications").insert({
    name: params.name,
    phone: params.phone,
    position_id: params.positionId,
    cv_url: params.cvPath,
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

// =========================================================
// Fidelización (respaldada por Supabase, no localStorage)
// =========================================================

export type LoyaltySnapshot = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  memberCode: string;
  points: number;
  walletBalance: number;
  giftCardBalance: number;
  referralCode: string;
  joinedAt: string;
  purchaseHistory: Array<{ date: string; orderId: string; total: number; pointsEarned: number }>;
  activePlanId: string | null;
};

function mapLoyaltySnapshot(row: Record<string, unknown>): LoyaltySnapshot {
  const history = (row.purchaseHistory as Array<Record<string, unknown>>) ?? [];
  return {
    id: row.id as string,
    name: row.name as string,
    email: (row.email as string) ?? null,
    phone: (row.phone as string) ?? null,
    memberCode: row.memberCode as string,
    points: Number(row.points),
    walletBalance: Number(row.walletBalance),
    giftCardBalance: Number(row.giftCardBalance),
    referralCode: row.referralCode as string,
    joinedAt: row.joinedAt as string,
    purchaseHistory: history.map((h) => ({
      date: h.date as string,
      orderId: h.orderId as string,
      total: Number(h.total),
      pointsEarned: Number(h.pointsEarned),
    })),
    activePlanId: (row.activePlanId as string) ?? null,
  };
}

export async function registerLoyaltyCustomer(
  name: string,
  contact: string,
  referralCode?: string | null
): Promise<LoyaltySnapshot> {
  const { data, error } = await supabase.rpc("register_loyalty_customer", {
    p_name: name,
    p_contact: contact,
    p_referral_code: referralCode || null,
  });
  if (error) {
    if (error.message.includes("ya_existe_cuenta")) {
      throw new Error("Ya existe una cuenta con ese correo o teléfono. Usa la pestaña 'Ya tengo cuenta'.");
    }
    throw error;
  }
  return mapLoyaltySnapshot(data);
}

export async function lookupLoyaltyCustomer(contact: string): Promise<LoyaltySnapshot | null> {
  const { data, error } = await supabase.rpc("get_loyalty_snapshot", { p_contact: contact });
  if (error) throw error;
  return data ? mapLoyaltySnapshot(data) : null;
}

export async function awardOrderPoints(orderId: string, contact: string): Promise<LoyaltySnapshot | null> {
  const { data, error } = await supabase.rpc("award_order_points", { p_order_id: orderId, p_contact: contact });
  if (error) throw error;
  return data ? mapLoyaltySnapshot(data) : null;
}

export async function markOrderPaid(orderId: string, stripeSessionId: string, internalSecret: string) {
  const { error } = await supabase.rpc("mark_order_paid", {
    p_order_id: orderId,
    p_stripe_session_id: stripeSessionId,
    p_internal_secret: internalSecret,
  });
  if (error) throw error;
}

// =========================================================
// Capacitación de empleados (respaldada por Supabase)
// =========================================================

export type TrainingModule = {
  id: string;
  title: string;
  type: string;
  duration: string;
  contentUrl: string | null;
};

export async function fetchTrainingModules(): Promise<TrainingModule[]> {
  const { data, error } = await supabase
    .from("training_modules")
    .select("id, title, type, duration, content_url")
    .order("title");
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    type: row.type,
    duration: row.duration ?? "",
    contentUrl: row.content_url,
  }));
}

export async function fetchTrainingProgress(employeeId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("employee_training_progress")
    .select("module_id")
    .eq("employee_id", employeeId);
  if (error) throw error;
  return data.map((row) => row.module_id);
}

export async function markTrainingComplete(employeeId: string, moduleId: string) {
  const { error } = await supabase
    .from("employee_training_progress")
    .insert({ employee_id: employeeId, module_id: moduleId });
  if (error) throw error;
}

// =========================================================
// Panel administrativo (requiere employees.role = 'admin', forzado por RLS)
// =========================================================

export type AdminOrder = {
  id: string;
  fulfillmentType: string;
  address: string | null;
  paymentMethod: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  couponCode: string | null;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: Array<{ name: string; price: number; qty: number }>;
};

export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, fulfillment_type, address, payment_method, subtotal, shipping_cost, discount, coupon_code, total, status, payment_status, created_at, order_items(name, price, qty)"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    fulfillmentType: row.fulfillment_type,
    address: row.address,
    paymentMethod: row.payment_method,
    subtotal: Number(row.subtotal),
    shippingCost: Number(row.shipping_cost),
    discount: Number(row.discount),
    couponCode: row.coupon_code,
    total: Number(row.total),
    status: row.status,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
    items: (row.order_items as Array<{ name: string; price: number; qty: number }>) ?? [],
  }));
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) throw error;
}

export type AdminSurvey = {
  id: string;
  branchRating: number;
  serviceRating: number;
  cashierId: string | null;
  cashierName: string | null;
  comments: string | null;
  createdAt: string;
};

export async function fetchAdminSurveys(): Promise<AdminSurvey[]> {
  const { data, error } = await supabase
    .from("surveys")
    .select("id, branch_rating, service_rating, cashier_id, comments, created_at, cashiers(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    branchRating: row.branch_rating,
    serviceRating: row.service_rating,
    cashierId: row.cashier_id,
    cashierName: (row.cashiers as unknown as { name: string } | null)?.name ?? null,
    comments: row.comments,
    createdAt: row.created_at,
  }));
}

export type AdminWholesaleOrder = {
  id: string;
  customerName: string;
  company: string | null;
  phone: string;
  itemName: string;
  units: number;
  unitPrice: number | null;
  fulfillmentType: string;
  eventDate: string | null;
  notes: string | null;
  quoteTotal: number | null;
  status: string;
  createdAt: string;
};

export async function fetchAdminWholesaleOrders(): Promise<AdminWholesaleOrder[]> {
  const { data, error } = await supabase
    .from("wholesale_orders")
    .select(
      "id, customer_name, company, phone, item_name, units, unit_price, fulfillment_type, event_date, notes, quote_total, status, created_at"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    customerName: row.customer_name,
    company: row.company,
    phone: row.phone,
    itemName: row.item_name,
    units: row.units,
    unitPrice: row.unit_price !== null ? Number(row.unit_price) : null,
    fulfillmentType: row.fulfillment_type,
    eventDate: row.event_date,
    notes: row.notes,
    quoteTotal: row.quote_total !== null ? Number(row.quote_total) : null,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function updateWholesaleStatus(id: string, status: string) {
  const { error } = await supabase.from("wholesale_orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export type AdminJobApplication = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  positionTitle: string | null;
  status: string;
  createdAt: string;
};

export async function fetchAdminJobApplications(): Promise<AdminJobApplication[]> {
  const { data, error } = await supabase
    .from("job_applications")
    .select("id, name, phone, email, status, created_at, job_positions(title)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    positionTitle: (row.job_positions as unknown as { title: string } | null)?.title ?? null,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function updateJobApplicationStatus(id: string, status: string) {
  const { error } = await supabase.from("job_applications").update({ status }).eq("id", id);
  if (error) throw error;
}

export type AdminReferral = {
  id: string;
  candidateName: string;
  candidatePhone: string | null;
  positionTitle: string | null;
  status: string;
  hireDate: string | null;
  bonusClaimDeadline: string | null;
  bonusClaimed: boolean;
  createdAt: string;
};

export async function fetchAdminReferrals(): Promise<AdminReferral[]> {
  const { data, error } = await supabase
    .from("employee_referrals")
    .select(
      "id, candidate_name, candidate_phone, status, hire_date, bonus_claim_deadline, bonus_claimed, created_at, job_positions(title)"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    candidateName: row.candidate_name,
    candidatePhone: row.candidate_phone,
    positionTitle: (row.job_positions as unknown as { title: string } | null)?.title ?? null,
    status: row.status,
    hireDate: row.hire_date,
    bonusClaimDeadline: row.bonus_claim_deadline,
    bonusClaimed: row.bonus_claimed,
    createdAt: row.created_at,
  }));
}

export async function updateReferralStatus(id: string, status: string) {
  const { error } = await supabase.from("employee_referrals").update({ status }).eq("id", id);
  if (error) throw error;
}

/**
 * Marking a referral "hired" starts the clock required by the client's spec:
 * the referral bonus becomes payable once the candidate reaches 3 months of
 * tenure, with a 7-day window afterward to claim it.
 */
export async function markReferralHired(id: string) {
  const hireDate = new Date();
  const claimDeadline = new Date(hireDate);
  claimDeadline.setMonth(claimDeadline.getMonth() + 3);
  claimDeadline.setDate(claimDeadline.getDate() + 7);

  const { error } = await supabase
    .from("employee_referrals")
    .update({
      status: "hired",
      hire_date: hireDate.toISOString().slice(0, 10),
      bonus_claim_deadline: claimDeadline.toISOString().slice(0, 10),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function claimReferralBonus(id: string) {
  const { error } = await supabase.from("employee_referrals").update({ bonus_claimed: true }).eq("id", id);
  if (error) throw error;
}

export type AdminGoogleReview = {
  id: string;
  customerName: string | null;
  customerContact: string | null;
  submittedAt: string;
  rewardGranted: boolean;
};

export async function fetchAdminGoogleReviews(): Promise<AdminGoogleReview[]> {
  const { data, error } = await supabase
    .from("google_reviews")
    .select("id, submitted_at, reward_granted, customers(name, email, phone)")
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => {
    const customer = row.customers as unknown as { name: string; email: string | null; phone: string | null } | null;
    return {
      id: row.id,
      customerName: customer?.name ?? null,
      customerContact: customer ? customer.email ?? customer.phone : null,
      submittedAt: row.submitted_at,
      rewardGranted: row.reward_granted,
    };
  });
}

export async function updateReviewRewardConfig(
  patch: Partial<{ discountPercent: number; validDays: number; cooldownDays: number; active: boolean }>
) {
  const { error } = await supabase
    .from("review_reward_config")
    .update({
      discount_percent: patch.discountPercent,
      valid_days: patch.validDays,
      cooldown_days: patch.cooldownDays,
      active: patch.active,
    })
    .eq("id", 1);
  if (error) throw error;
}

export type AdminDeliveryZone = { id: string; name: string; distanceKm: number; active: boolean };

export async function fetchAdminDeliveryZones(): Promise<AdminDeliveryZone[]> {
  const { data, error } = await supabase.from("delivery_zones").select("id, name, distance_km, active").order("name");
  if (error) throw error;
  return data.map((row) => ({ id: row.id, name: row.name, distanceKm: Number(row.distance_km), active: row.active }));
}

export async function createDeliveryZone(params: { name: string; distanceKm: number }) {
  const { error } = await supabase.from("delivery_zones").insert({ name: params.name, distance_km: params.distanceKm });
  if (error) throw error;
}

export async function updateDeliveryZone(id: string, patch: { name?: string; distanceKm?: number; active?: boolean }) {
  const { error } = await supabase
    .from("delivery_zones")
    .update({ name: patch.name, distance_km: patch.distanceKm, active: patch.active })
    .eq("id", id);
  if (error) throw error;
}

export type AdminCashier = {
  id: string;
  name: string;
  role: string;
  active: boolean;
  employeeId: string | null;
  employeeName: string | null;
};

export async function fetchAdminCashiers(): Promise<AdminCashier[]> {
  const { data, error } = await supabase
    .from("cashiers")
    .select("id, name, role, active, employee_id, employees(name)")
    .order("name");
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role ?? "",
    active: row.active,
    employeeId: row.employee_id,
    employeeName: (row.employees as unknown as { name: string } | null)?.name ?? null,
  }));
}

export async function linkCashierToEmployee(cashierId: string, employeeId: string | null) {
  const { error } = await supabase.from("cashiers").update({ employee_id: employeeId }).eq("id", cashierId);
  if (error) throw error;
}

export type AdminEmployee = { id: string; name: string; role: string; active: boolean };

export async function fetchAdminEmployees(): Promise<AdminEmployee[]> {
  const { data, error } = await supabase.from("employees").select("id, name, role, active").order("name");
  if (error) throw error;
  return data.map((row) => ({ id: row.id, name: row.name, role: row.role, active: row.active }));
}

export type BonusTransaction = {
  id: string;
  employeeId: string;
  employeeName: string | null;
  amount: number;
  type: "survey_incentive" | "payout" | "adjustment";
  note: string | null;
  createdAt: string;
};

export async function fetchAdminBonusLedger(): Promise<BonusTransaction[]> {
  const { data, error } = await supabase
    .from("employee_bonus_transactions")
    .select("id, employee_id, amount, type, note, created_at, employees(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: (row.employees as unknown as { name: string } | null)?.name ?? null,
    amount: Number(row.amount),
    type: row.type,
    note: row.note,
    createdAt: row.created_at,
  }));
}

/** Used by the staff portal ("Mis bonos") — RLS restricts this to the employee's own ledger. */
export async function fetchEmployeeBonusLedger(employeeId: string): Promise<BonusTransaction[]> {
  const { data, error } = await supabase
    .from("employee_bonus_transactions")
    .select("id, employee_id, amount, type, note, created_at")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: null,
    amount: Number(row.amount),
    type: row.type,
    note: row.note,
    createdAt: row.created_at,
  }));
}

export async function payEmployeeBonus(employeeId: string, amount: number, note?: string | null) {
  const { error } = await supabase.rpc("pay_employee_bonus", { p_employee_id: employeeId, p_amount: amount, p_note: note ?? null });
  if (error) throw error;
}

export type BonusConfig = { minServiceRating: number; amountPerSurvey: number; topVoteAmount: number; active: boolean };

export async function fetchBonusConfig(): Promise<BonusConfig> {
  const { data, error } = await supabase
    .from("employee_bonus_config")
    .select("min_service_rating, amount_per_survey, top_vote_amount, active")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return {
    minServiceRating: data.min_service_rating,
    amountPerSurvey: Number(data.amount_per_survey),
    topVoteAmount: Number(data.top_vote_amount),
    active: data.active,
  };
}

export async function updateBonusConfig(
  patch: Partial<{ minServiceRating: number; amountPerSurvey: number; topVoteAmount: number; active: boolean }>
) {
  const { error } = await supabase
    .from("employee_bonus_config")
    .update({
      min_service_rating: patch.minServiceRating,
      amount_per_survey: patch.amountPerSurvey,
      top_vote_amount: patch.topVoteAmount,
      active: patch.active,
    })
    .eq("id", 1);
  if (error) throw error;
}

export type AdminCustomer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  memberCode: string | null;
  points: number;
  walletBalance: number;
  createdAt: string;
};

export async function fetchAdminCustomers(): Promise<AdminCustomer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, email, phone, member_code, points, wallet_balance, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    memberCode: row.member_code,
    points: row.points,
    walletBalance: Number(row.wallet_balance),
    createdAt: row.created_at,
  }));
}

export type AdminCoupon = {
  id: string;
  code: string;
  title: string;
  description: string;
  discountLabel: string;
  discountPercent: number | null;
  validUntil: string | null;
  onlyOnline: boolean;
  active: boolean;
};

export async function fetchAdminCoupons(): Promise<AdminCoupon[]> {
  const { data, error } = await supabase
    .from("coupons")
    .select("id, code, title, description, discount_label, discount_percent, valid_until, only_online, active")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description ?? "",
    discountLabel: row.discount_label,
    discountPercent: row.discount_percent,
    validUntil: row.valid_until,
    onlyOnline: row.only_online,
    active: row.active,
  }));
}

export async function createCoupon(params: {
  code: string;
  title: string;
  description: string;
  discountLabel: string;
  discountPercent: number | null;
  validUntil: string | null;
  onlyOnline: boolean;
}) {
  const { error } = await supabase.from("coupons").insert({
    code: params.code.toUpperCase(),
    title: params.title,
    description: params.description,
    discount_label: params.discountLabel,
    discount_percent: params.discountPercent,
    valid_until: params.validUntil,
    only_online: params.onlyOnline,
  });
  if (error) throw error;
}

export async function toggleCouponActive(id: string, active: boolean) {
  const { error } = await supabase.from("coupons").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function updateProductPricing(
  productId: string,
  patch: { priceMedium: number | null; priceLarge: number | null; active: boolean }
) {
  const { error } = await supabase
    .from("products")
    .update({ price_medium: patch.priceMedium, price_large: patch.priceLarge, active: patch.active })
    .eq("id", productId);
  if (error) throw error;
}

export type AdminProduct = {
  id: string;
  name: string;
  categoryName: string;
  priceMedium: number | null;
  priceLarge: number | null;
  active: boolean;
};

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price_medium, price_large, active, categories(name)")
    .order("name");
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    categoryName: (row.categories as unknown as { name: string } | null)?.name ?? "",
    priceMedium: row.price_medium !== null ? Number(row.price_medium) : null,
    priceLarge: row.price_large !== null ? Number(row.price_large) : null,
    active: row.active,
  }));
}

// =========================================================
// Punto de venta (POS) — ventas reales de empleados
// =========================================================

export type ActiveOrder = {
  id: string;
  status: string;
  createdAt: string;
  items: Array<{ name: string; qty: number }>;
};

export async function fetchActiveOrders(): Promise<ActiveOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, created_at, order_items(name, qty)")
    .in("status", ["pending", "preparing", "ready"])
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
    items: (row.order_items as Array<{ name: string; qty: number }>) ?? [],
  }));
}

export async function submitPosSale(params: {
  paymentMethod: "card" | "cash";
  subtotal: number;
  discount?: number;
  total: number;
  items: Array<{ name: string; price: number; qty: number }>;
}) {
  const orderId = crypto.randomUUID();
  const { error: orderError } = await supabase.from("orders").insert({
    id: orderId,
    fulfillment_type: "pickup",
    address: null,
    payment_method: params.paymentMethod,
    subtotal: params.subtotal,
    shipping_cost: 0,
    discount: params.discount ?? 0,
    coupon_code: null,
    total: params.total,
    status: "preparing",
    payment_status: "paid",
  });
  if (orderError) throw orderError;

  const { error: itemsError } = await supabase.from("order_items").insert(
    params.items.map((item) => ({ order_id: orderId, name: item.name, price: item.price, qty: item.qty }))
  );
  if (itemsError) throw itemsError;

  return orderId;
}

// =========================================================
// Fidelización: gift cards y suscripciones
// =========================================================

export async function sendGiftCard(senderContact: string, recipientContact: string, amount: number): Promise<LoyaltySnapshot> {
  const { data, error } = await supabase.rpc("send_gift_card", {
    p_sender_contact: senderContact,
    p_recipient_contact: recipientContact,
    p_amount: amount,
  });
  if (error) {
    const map: Record<string, string> = {
      monto_invalido: "Ingresa un monto válido.",
      cuenta_no_encontrada: "No encontramos tu cuenta.",
      destinatario_no_encontrado: "No encontramos una cuenta con ese correo o teléfono.",
      saldo_insuficiente: "No tienes saldo suficiente en tu monedero.",
    };
    const key = Object.keys(map).find((k) => error.message.includes(k));
    throw new Error(key ? map[key] : error.message);
  }
  return mapLoyaltySnapshot(data);
}

export async function activateSubscription(contact: string, planSlug: string): Promise<LoyaltySnapshot> {
  const { data, error } = await supabase.rpc("activate_subscription", { p_contact: contact, p_plan_slug: planSlug });
  if (error) {
    if (error.message.includes("cuenta_no_encontrada")) {
      throw new Error("Necesitas una cuenta de fidelización para activar un plan.");
    }
    throw error;
  }
  return mapLoyaltySnapshot(data);
}

// =========================================================
// Reclutamiento: CV en Supabase Storage
// =========================================================

export async function uploadJobApplicationCv(file: File): Promise<string> {
  const path = `${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("job-application-cvs").upload(path, file);
  if (error) throw error;
  return path;
}

export async function getJobApplicationCvUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("job-application-cvs").createSignedUrl(path, 120);
  if (error) throw error;
  return data.signedUrl;
}
