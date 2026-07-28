import { persistentAtom } from "@nanostores/persistent";

export type LoyaltyProfile = {
  name: string;
  contact: string;
  memberId: string;
  points: number;
  walletBalance: number;
  giftCardBalance: number;
  referralCode: string;
  joinedAt: string;
  activePlanId?: string;
};

export const $loyaltyProfile = persistentAtom<LoyaltyProfile | null>(
  "dz-loyalty",
  null,
  {
    encode: JSON.stringify,
    decode: (raw) => {
      try {
        return JSON.parse(raw) as LoyaltyProfile;
      } catch {
        return null;
      }
    },
  }
);

export function registerLoyalty(name: string, contact: string) {
  const memberId = `DZ-${Math.floor(1000 + Math.random() * 9000)}`;
  const profile: LoyaltyProfile = {
    name,
    contact,
    memberId,
    points: 150,
    walletBalance: 50,
    giftCardBalance: 0,
    referralCode: memberId.replace("DZ-", "AMIGO"),
    joinedAt: new Date().toISOString(),
  };
  $loyaltyProfile.set(profile);
  return profile;
}

export function logoutLoyalty() {
  $loyaltyProfile.set(null);
}

export function activatePlan(planId: string) {
  const current = $loyaltyProfile.get();
  if (!current) return;
  $loyaltyProfile.set({ ...current, activePlanId: planId });
}

export const MOCK_PURCHASE_HISTORY = [
  { date: "12 jul 2026", item: "Bowl Quinoa & Zanahoria Asada", total: 129, pointsEarned: 13 },
  { date: "05 jul 2026", item: "Jugo Zanahorio Clásico + Pastel de Zanahoria", total: 120, pointsEarned: 12 },
  { date: "28 jun 2026", item: "Hamburguesa Zanahorio Clásica", total: 119, pointsEarned: 12 },
];
