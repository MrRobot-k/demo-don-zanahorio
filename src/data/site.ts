export const SITE = {
  name: "Don Zanahorio",
  tagline: "Desayunos, comida corrida y antojitos caseros para toda la familia",
  city: "Ciudad Victoria",
  state: "Tamaulipas",
  country: "México",
  address: "Blvd. Praxedis Balboa 1420, Col. Las Palmas, Cd. Victoria, Tamps.",
  phoneDisplay: "834 123 4567",
  phoneE164: "5218341234567",
  email: "hola@donzanahorio.mx",
  hours: [
    { day: "Lunes a viernes", time: "8:00 am – 9:00 pm" },
    { day: "Sábado", time: "9:00 am – 10:00 pm" },
    { day: "Domingo", time: "9:00 am – 6:00 pm" },
  ],
  social: {
    instagram: "https://instagram.com/donzanahorio",
    facebook: "https://facebook.com/donzanahorio",
  },
  googleReviewUrl: "https://g.page/r/donzanahorio/review",
  shipping: {
    freeThreshold: 500,
    baseCost: 45,
    perKm: 6,
  },
} as const;

export function whatsappLink(message: string) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${SITE.phoneE164}?text=${encoded}`;
}

export const NAV_LINKS = [
  { href: "/menu", label: "Menú" },
  { href: "/mayoreo", label: "Mayoreo" },
  { href: "/fidelizacion", label: "Fidelización" },
  { href: "/suscripciones", label: "Suscripciones" },
  { href: "/promociones", label: "Promociones" },
  { href: "/encuestas", label: "Encuestas" },
] as const;

export const PORTAL_LINKS = [
  { href: "/pos", label: "Punto de venta (POS)" },
  { href: "/empleados", label: "Portal de empleados" },
  { href: "/admin", label: "Panel administrativo" },
] as const;
