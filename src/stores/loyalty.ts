import { persistentAtom } from "@nanostores/persistent";
import { atom } from "nanostores";
import {
  registerLoyaltyCustomer,
  lookupLoyaltyCustomer,
  activateSubscription,
  type LoyaltySnapshot,
} from "@/lib/queries";

export type LoyaltyProfile = LoyaltySnapshot;

/** Only remembers *which* contact is signed in on this device — the balances always come from Supabase. */
export const $loyaltyContact = persistentAtom<string | undefined>("dz-loyalty-contact", undefined);
export const $loyaltyProfile = atom<LoyaltyProfile | null>(null);
export const $loyaltyLoading = atom(false);

export async function restoreLoyaltySession() {
  const contact = $loyaltyContact.get();
  if (!contact) return;
  $loyaltyLoading.set(true);
  try {
    const snapshot = await lookupLoyaltyCustomer(contact);
    $loyaltyProfile.set(snapshot);
    if (!snapshot) $loyaltyContact.set(undefined);
  } finally {
    $loyaltyLoading.set(false);
  }
}

export async function registerLoyalty(name: string, contact: string, referralCode?: string) {
  const snapshot = await registerLoyaltyCustomer(name, contact, referralCode);
  $loyaltyContact.set(contact);
  $loyaltyProfile.set(snapshot);
  return snapshot;
}

export async function loginLoyalty(contact: string) {
  const snapshot = await lookupLoyaltyCustomer(contact);
  if (!snapshot) {
    throw new Error("No encontramos una cuenta con ese correo o teléfono.");
  }
  $loyaltyContact.set(contact);
  $loyaltyProfile.set(snapshot);
  return snapshot;
}

export function logoutLoyalty() {
  $loyaltyContact.set(undefined);
  $loyaltyProfile.set(null);
}

export async function activatePlan(planSlug: string) {
  const contact = $loyaltyContact.get();
  if (!contact) throw new Error("Necesitas una cuenta de fidelización para activar un plan.");
  const snapshot = await activateSubscription(contact, planSlug);
  $loyaltyProfile.set(snapshot);
  return snapshot;
}
