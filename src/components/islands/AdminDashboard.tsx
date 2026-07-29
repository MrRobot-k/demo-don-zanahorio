import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  Users,
  UserPlus,
  Ticket,
  Star,
  LogOut,
  Menu,
  X,
  Plus,
  UtensilsCrossed,
} from "lucide-react";
import { useStaffSession } from "@/hooks/useStaffSession";
import StaffLogin from "@/components/islands/StaffLogin";
import { formatMXN, cn } from "@/lib/utils";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import {
  fetchAdminOrders,
  updateOrderStatus,
  fetchAdminSurveys,
  fetchAdminWholesaleOrders,
  updateWholesaleStatus,
  fetchAdminJobApplications,
  updateJobApplicationStatus,
  fetchAdminReferrals,
  updateReferralStatus,
  markReferralHired,
  claimReferralBonus,
  type AdminReferral,
  fetchAdminGoogleReviewsCount,
  fetchAdminCustomers,
  fetchAdminCoupons,
  createCoupon,
  toggleCouponActive,
  fetchAdminProducts,
  updateProductPricing,
  type AdminOrder,
} from "@/lib/queries";

type Section =
  | "resumen"
  | "pedidos"
  | "mayoreo"
  | "encuestas"
  | "clientes"
  | "empleo"
  | "referidos"
  | "cupones"
  | "productos"
  | "resenas";

const NAV_GROUPS: { label: string; items: { id: Section; label: string; icon: typeof LayoutDashboard }[] }[] = [
  { label: "General", items: [{ id: "resumen", label: "Resumen", icon: LayoutDashboard }] },
  {
    label: "Operación",
    items: [
      { id: "pedidos", label: "Pedidos", icon: ShoppingCart },
      { id: "mayoreo", label: "Mayoreo", icon: Package },
    ],
  },
  {
    label: "Clientes",
    items: [
      { id: "clientes", label: "Fidelización", icon: Users },
      { id: "encuestas", label: "Encuestas", icon: ClipboardList },
      { id: "resenas", label: "Reseñas Google", icon: Star },
    ],
  },
  {
    label: "Personal",
    items: [
      { id: "empleo", label: "Solicitudes de empleo", icon: UserPlus },
      { id: "referidos", label: "Referidos", icon: UserPlus },
    ],
  },
  {
    label: "Marketing",
    items: [
      { id: "cupones", label: "Cupones", icon: Ticket },
      { id: "productos", label: "Menú y precios", icon: UtensilsCrossed },
    ],
  },
];

const SECTION_LABELS: Record<Section, string> = {
  resumen: "Resumen",
  pedidos: "Pedidos",
  mayoreo: "Pedidos de mayoreo",
  encuestas: "Encuestas",
  clientes: "Clientes de fidelización",
  empleo: "Solicitudes de empleo",
  referidos: "Referidos de empleados",
  cupones: "Cupones",
  productos: "Menú y precios",
  resenas: "Reseñas de Google",
};

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const tones: Record<string, string> = {
    neutral: "border-carrot-50/15 bg-carrot-50/10 text-carrot-50/70",
    good: "border-leaf-700/40 bg-leaf-500/15 text-leaf-300",
    warn: "border-carrot-700/40 bg-carrot-500/15 text-carrot-300",
    bad: "border-red-800/40 bg-red-500/15 text-red-300",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize", tones[tone])}>
      {children}
    </span>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="glass glass-card rounded-2xl p-5">
      <p className="text-xs font-medium text-carrot-50/60">{label}</p>
      <p className="mt-2 text-2xl font-bold text-carrot-50">{value}</p>
      {hint && <p className="mt-1 text-xs text-carrot-50/50">{hint}</p>}
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="glass overflow-x-auto rounded-2xl">
      <table className="w-full text-sm">
        <thead className="border-b border-carrot-50/10 text-left text-[11px] uppercase tracking-wide text-carrot-50/50">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-carrot-50/10">{children}</tbody>
      </table>
    </div>
  );
}

function StatusSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-carrot-50/15 bg-ink-900 px-2 py-1 text-xs text-carrot-50 capitalize focus:outline-none focus:ring-1 focus:ring-carrot-400"
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-ink-900">
          {o}
        </option>
      ))}
    </select>
  );
}

function OrdersSection() {
  const { data, error, loading } = useSupabaseData(fetchAdminOrders);
  const [rows, setRows] = useState<AdminOrder[] | null>(null);
  useEffect(() => setRows(data), [data]);

  async function changeStatus(id: string, status: string) {
    setRows((prev) => prev?.map((o) => (o.id === id ? { ...o, status } : o)) ?? null);
    await updateOrderStatus(id, status).catch(() => {});
  }

  if (loading) return <p className="text-sm text-carrot-50/50">Cargando pedidos...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pedidos totales" value={rows?.length ?? 0} />
        <StatCard
          label="Ingresos (pagados)"
          value={formatMXN((rows ?? []).filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.total, 0))}
        />
        <StatCard label="Pendientes" value={(rows ?? []).filter((o) => o.status === "pending").length} />
      </div>
      <Table head={["Pedido", "Items", "Entrega", "Pago", "Total", "Estado", "Fecha"]}>
        {rows?.map((o) => (
          <tr key={o.id} className="hover:bg-carrot-50/5">
            <td className="px-4 py-3 font-mono text-xs text-carrot-50/60">#{o.id.slice(0, 8)}</td>
            <td className="max-w-xs px-4 py-3 text-xs text-carrot-50/60">
              {o.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}
            </td>
            <td className="px-4 py-3 text-xs text-carrot-50/60">{o.fulfillmentType === "pickup" ? "Recoger" : "Domicilio"}</td>
            <td className="px-4 py-3">
              <Badge tone={o.paymentStatus === "paid" ? "good" : "neutral"}>
                {o.paymentMethod === "card" ? "Tarjeta" : "Efectivo"} · {o.paymentStatus}
              </Badge>
            </td>
            <td className="px-4 py-3 font-semibold text-carrot-50">{formatMXN(o.total)}</td>
            <td className="px-4 py-3">
              <StatusSelect
                value={o.status}
                options={["pending", "preparing", "ready", "delivered", "cancelled"]}
                onChange={(v) => changeStatus(o.id, v)}
              />
            </td>
            <td className="px-4 py-3 text-xs text-carrot-50/50">{new Date(o.createdAt).toLocaleString("es-MX")}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function WholesaleSection() {
  const { data, error, loading } = useSupabaseData(fetchAdminWholesaleOrders);
  const [rows, setRows] = useState(data);
  useEffect(() => setRows(data), [data]);

  async function changeStatus(id: string, status: string) {
    setRows((prev) => prev?.map((o) => (o.id === id ? { ...o, status } : o)) ?? null);
    await updateWholesaleStatus(id, status).catch(() => {});
  }

  if (loading) return <p className="text-sm text-carrot-50/50">Cargando cotizaciones...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <Table head={["Cliente", "Producto", "Unidades", "Cotización", "Entrega", "Estado", "Fecha"]}>
      {rows?.map((o) => (
        <tr key={o.id} className="hover:bg-carrot-50/5">
          <td className="px-4 py-3">
            <p className="text-carrot-50">{o.customerName}</p>
            <p className="text-xs text-carrot-50/50">
              {o.phone} {o.company ? `· ${o.company}` : ""}
            </p>
          </td>
          <td className="px-4 py-3 text-carrot-50/80">{o.itemName}</td>
          <td className="px-4 py-3 text-carrot-50/80">{o.units}</td>
          <td className="px-4 py-3 font-semibold text-carrot-50">{o.quoteTotal ? formatMXN(o.quoteTotal) : "—"}</td>
          <td className="px-4 py-3 text-xs text-carrot-50/60">{o.fulfillmentType === "pickup" ? "Recoger" : "Domicilio"}</td>
          <td className="px-4 py-3">
            <StatusSelect value={o.status} options={["pending", "confirmed", "cancelled"]} onChange={(v) => changeStatus(o.id, v)} />
          </td>
          <td className="px-4 py-3 text-xs text-carrot-50/50">{new Date(o.createdAt).toLocaleDateString("es-MX")}</td>
        </tr>
      ))}
    </Table>
  );
}

function SurveysSection() {
  const { data, error, loading } = useSupabaseData(fetchAdminSurveys);
  if (loading) return <p className="text-sm text-carrot-50/50">Cargando encuestas...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  const avgBranch = data?.length ? (data.reduce((s, r) => s + r.branchRating, 0) / data.length).toFixed(1) : "—";
  const avgService = data?.length ? (data.reduce((s, r) => s + r.serviceRating, 0) / data.length).toFixed(1) : "—";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Encuestas recibidas" value={data?.length ?? 0} />
        <StatCard label="Calificación sucursal" value={`${avgBranch} ★`} />
        <StatCard label="Calificación servicio" value={`${avgService} ★`} />
      </div>
      <Table head={["Sucursal", "Servicio", "Cajero(a)", "Comentarios", "Fecha"]}>
        {data?.map((s) => (
          <tr key={s.id} className="hover:bg-carrot-50/5">
            <td className="px-4 py-3 text-carrot-50">{s.branchRating} ★</td>
            <td className="px-4 py-3 text-carrot-50">{s.serviceRating} ★</td>
            <td className="px-4 py-3 text-carrot-50/80">{s.cashierName ?? "—"}</td>
            <td className="max-w-sm px-4 py-3 text-xs text-carrot-50/60">{s.comments ?? "—"}</td>
            <td className="px-4 py-3 text-xs text-carrot-50/50">{new Date(s.createdAt).toLocaleDateString("es-MX")}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function CustomersSection() {
  const { data, error, loading } = useSupabaseData(fetchAdminCustomers);
  if (loading) return <p className="text-sm text-carrot-50/50">Cargando clientes...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Miembros de fidelización" value={data?.length ?? 0} />
        <StatCard label="Puntos en circulación" value={(data ?? []).reduce((s, c) => s + c.points, 0)} />
        <StatCard label="Saldo en monederos" value={formatMXN((data ?? []).reduce((s, c) => s + c.walletBalance, 0))} />
      </div>
      <Table head={["Cliente", "Contacto", "Código", "Puntos", "Monedero", "Desde"]}>
        {data?.map((c) => (
          <tr key={c.id} className="hover:bg-carrot-50/5">
            <td className="px-4 py-3 text-carrot-50">{c.name}</td>
            <td className="px-4 py-3 text-xs text-carrot-50/60">{c.email ?? c.phone}</td>
            <td className="px-4 py-3 font-mono text-xs text-carrot-50/60">{c.memberCode}</td>
            <td className="px-4 py-3 text-carrot-50">{c.points}</td>
            <td className="px-4 py-3 text-carrot-50">{formatMXN(c.walletBalance)}</td>
            <td className="px-4 py-3 text-xs text-carrot-50/50">{new Date(c.createdAt).toLocaleDateString("es-MX")}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function JobApplicationsSection() {
  const { data, error, loading } = useSupabaseData(fetchAdminJobApplications);
  const [rows, setRows] = useState(data);
  useEffect(() => setRows(data), [data]);

  async function changeStatus(id: string, status: string) {
    setRows((prev) => prev?.map((o) => (o.id === id ? { ...o, status } : o)) ?? null);
    await updateJobApplicationStatus(id, status).catch(() => {});
  }

  if (loading) return <p className="text-sm text-carrot-50/50">Cargando solicitudes...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <Table head={["Candidato", "Contacto", "Puesto", "Estado", "Fecha"]}>
      {rows?.map((a) => (
        <tr key={a.id} className="hover:bg-carrot-50/5">
          <td className="px-4 py-3 text-carrot-50">{a.name}</td>
          <td className="px-4 py-3 text-xs text-carrot-50/60">{a.phone ?? a.email ?? "—"}</td>
          <td className="px-4 py-3 text-carrot-50/80">{a.positionTitle ?? "—"}</td>
          <td className="px-4 py-3">
            <StatusSelect
              value={a.status}
              options={["received", "reviewing", "hired", "rejected"]}
              onChange={(v) => changeStatus(a.id, v)}
            />
          </td>
          <td className="px-4 py-3 text-xs text-carrot-50/50">{new Date(a.createdAt).toLocaleDateString("es-MX")}</td>
        </tr>
      ))}
    </Table>
  );
}

/**
 * The bonus becomes claimable once the candidate reaches 3 months of
 * tenure (hireDate + 3mo, i.e. bonusClaimDeadline − 7d) and stays claimable
 * for a 7-day window ending at bonusClaimDeadline.
 */
function referralBonusState(r: AdminReferral): "not-hired" | "not-yet" | "claimable" | "expired" | "claimed" {
  if (r.bonusClaimed) return "claimed";
  if (r.status !== "hired" || !r.hireDate || !r.bonusClaimDeadline) return "not-hired";
  const today = new Date().toISOString().slice(0, 10);
  const eligibleFrom = new Date(r.bonusClaimDeadline);
  eligibleFrom.setDate(eligibleFrom.getDate() - 7);
  const eligibleFromStr = eligibleFrom.toISOString().slice(0, 10);
  if (today < eligibleFromStr) return "not-yet";
  if (today > r.bonusClaimDeadline) return "expired";
  return "claimable";
}

function ReferralsSection() {
  const { data, error, loading } = useSupabaseData(fetchAdminReferrals);
  const [rows, setRows] = useState(data);
  useEffect(() => setRows(data), [data]);

  async function refresh() {
    const fresh = await fetchAdminReferrals().catch(() => null);
    if (fresh) setRows(fresh);
  }

  async function changeStatus(id: string, status: string) {
    if (status === "hired") {
      // Sets hire_date + bonus_claim_deadline server-side, so refetch instead
      // of guessing those dates optimistically.
      await markReferralHired(id).catch(() => {});
      await refresh();
      return;
    }
    setRows((prev) => prev?.map((o) => (o.id === id ? { ...o, status } : o)) ?? null);
    await updateReferralStatus(id, status).catch(() => {});
  }

  async function claimBonus(id: string) {
    setRows((prev) => prev?.map((o) => (o.id === id ? { ...o, bonusClaimed: true } : o)) ?? null);
    await claimReferralBonus(id).catch(() => {});
  }

  if (loading) return <p className="text-sm text-carrot-50/50">Cargando referidos...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <Table head={["Candidato", "Teléfono", "Puesto", "Estado", "Bono", "Fecha"]}>
      {rows?.map((r) => {
        const bonusState = referralBonusState(r);
        return (
          <tr key={r.id} className="hover:bg-carrot-50/5">
            <td className="px-4 py-3 text-carrot-50">{r.candidateName}</td>
            <td className="px-4 py-3 text-xs text-carrot-50/60">{r.candidatePhone ?? "—"}</td>
            <td className="px-4 py-3 text-carrot-50/80">{r.positionTitle ?? "—"}</td>
            <td className="px-4 py-3">
              <StatusSelect value={r.status} options={["pending", "hired", "rejected"]} onChange={(v) => changeStatus(r.id, v)} />
            </td>
            <td className="px-4 py-3">
              {bonusState === "claimed" && <Badge tone="good">Reclamado ✓</Badge>}
              {bonusState === "not-hired" && <Badge tone="neutral">—</Badge>}
              {bonusState === "not-yet" && r.hireDate && (
                <Badge tone="neutral">
                  Disponible el{" "}
                  {new Date(new Date(r.bonusClaimDeadline!).setDate(new Date(r.bonusClaimDeadline!).getDate() - 7)).toLocaleDateString(
                    "es-MX"
                  )}
                </Badge>
              )}
              {bonusState === "expired" && <Badge tone="bad">Vencido</Badge>}
              {bonusState === "claimable" && (
                <button
                  type="button"
                  onClick={() => claimBonus(r.id)}
                  className="rounded-full bg-leaf-500 px-3 py-1 text-[11px] font-semibold text-ink-950 hover:bg-leaf-400"
                >
                  Reclamar bono
                </button>
              )}
            </td>
            <td className="px-4 py-3 text-xs text-carrot-50/50">{new Date(r.createdAt).toLocaleDateString("es-MX")}</td>
          </tr>
        );
      })}
    </Table>
  );
}

function ReviewsSection() {
  const { data, error, loading } = useSupabaseData(fetchAdminGoogleReviewsCount);
  if (loading) return <p className="text-sm text-carrot-50/50">Cargando...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard label="Clics a reseña de Google" value={data ?? 0} hint="Registrados desde la página de encuestas" />
    </div>
  );
}

function CouponsSection() {
  const { data, error, loading } = useSupabaseData(fetchAdminCoupons);
  const [rows, setRows] = useState(data);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", title: "", description: "", discountLabel: "", discountPercent: "" });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  useEffect(() => setRows(data), [data]);

  async function toggle(id: string, active: boolean) {
    setRows((prev) => prev?.map((c) => (c.id === id ? { ...c, active } : c)) ?? null);
    await toggleCouponActive(id, active).catch(() => {});
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setFormError("");
    try {
      await createCoupon({
        code: form.code.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        discountLabel: form.discountLabel.trim() || `${form.discountPercent}% de descuento`,
        discountPercent: form.discountPercent ? Number(form.discountPercent) : null,
        validUntil: null,
        onlyOnline: true,
      });
      setForm({ code: "", title: "", description: "", discountLabel: "", discountPercent: "" });
      setShowForm(false);
      const fresh = await fetchAdminCoupons();
      setRows(fresh);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo crear el cupón.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <p className="text-sm text-carrot-50/50">Cargando cupones...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-carrot-500 px-3.5 py-1.5 text-xs font-semibold text-ink-950 hover:bg-carrot-400"
        >
          <Plus size={14} /> Nuevo cupón
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass grid gap-3 rounded-2xl p-4 sm:grid-cols-2">
          <input
            required
            placeholder="Código (ej. BIENVENIDO10)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="rounded-xl border border-carrot-50/15 bg-carrot-50/10 px-3 py-2 text-sm text-carrot-50 placeholder:text-carrot-50/40 focus:outline-none focus:ring-1 focus:ring-carrot-400"
          />
          <input
            required
            placeholder="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-xl border border-carrot-50/15 bg-carrot-50/10 px-3 py-2 text-sm text-carrot-50 placeholder:text-carrot-50/40 focus:outline-none focus:ring-1 focus:ring-carrot-400"
          />
          <input
            placeholder="Descripción"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-xl border border-carrot-50/15 bg-carrot-50/10 px-3 py-2 text-sm text-carrot-50 placeholder:text-carrot-50/40 focus:outline-none focus:ring-1 focus:ring-carrot-400 sm:col-span-2"
          />
          <input
            type="number"
            placeholder="% de descuento"
            value={form.discountPercent}
            onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
            className="rounded-xl border border-carrot-50/15 bg-carrot-50/10 px-3 py-2 text-sm text-carrot-50 placeholder:text-carrot-50/40 focus:outline-none focus:ring-1 focus:ring-carrot-400"
          />
          <input
            placeholder="Etiqueta (ej. 10% de descuento)"
            value={form.discountLabel}
            onChange={(e) => setForm({ ...form, discountLabel: e.target.value })}
            className="rounded-xl border border-carrot-50/15 bg-carrot-50/10 px-3 py-2 text-sm text-carrot-50 placeholder:text-carrot-50/40 focus:outline-none focus:ring-1 focus:ring-carrot-400"
          />
          {formError && <p className="text-xs text-red-400 sm:col-span-2">{formError}</p>}
          <button
            type="submit"
            disabled={creating}
            className="rounded-full bg-carrot-500 px-3 py-2 text-xs font-semibold text-ink-950 hover:bg-carrot-400 disabled:opacity-40 sm:col-span-2"
          >
            {creating ? "Creando..." : "Crear cupón"}
          </button>
        </form>
      )}

      <Table head={["Código", "Título", "Descuento", "Solo web", "Activo"]}>
        {rows?.map((c) => (
          <tr key={c.id} className="hover:bg-carrot-50/5">
            <td className="px-4 py-3 font-mono text-xs text-carrot-50/80">{c.code}</td>
            <td className="px-4 py-3 text-carrot-50">{c.title}</td>
            <td className="px-4 py-3 text-xs text-carrot-50/60">{c.discountLabel}</td>
            <td className="px-4 py-3">
              <Badge tone={c.onlyOnline ? "good" : "neutral"}>{c.onlyOnline ? "Sí" : "No"}</Badge>
            </td>
            <td className="px-4 py-3">
              <button
                type="button"
                onClick={() => toggle(c.id, !c.active)}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-semibold",
                  c.active ? "bg-leaf-500/15 text-leaf-300" : "bg-carrot-50/10 text-carrot-50/50"
                )}
              >
                {c.active ? "Activo" : "Inactivo"}
              </button>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function ProductRow({ product, onSaved }: { product: Awaited<ReturnType<typeof fetchAdminProducts>>[number]; onSaved: () => void }) {
  const [priceMedium, setPriceMedium] = useState(product.priceMedium?.toString() ?? "");
  const [priceLarge, setPriceLarge] = useState(product.priceLarge?.toString() ?? "");
  const [active, setActive] = useState(product.active);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateProductPricing(product.id, {
        priceMedium: priceMedium ? Number(priceMedium) : null,
        priceLarge: priceLarge ? Number(priceLarge) : null,
        active,
      });
      setDirty(false);
      onSaved();
    } catch {
      /* keep local edits so the user can retry */
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="hover:bg-carrot-50/5">
      <td className="px-4 py-3 text-carrot-50">{product.name}</td>
      <td className="px-4 py-3 text-xs text-carrot-50/60">{product.categoryName}</td>
      <td className="px-4 py-3">
        <input
          type="number"
          value={priceMedium}
          onChange={(e) => {
            setPriceMedium(e.target.value);
            setDirty(true);
          }}
          className="w-24 rounded-lg border border-carrot-50/15 bg-carrot-50/10 px-2 py-1 text-xs text-carrot-50 focus:outline-none focus:ring-1 focus:ring-carrot-400"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          value={priceLarge}
          onChange={(e) => {
            setPriceLarge(e.target.value);
            setDirty(true);
          }}
          className="w-24 rounded-lg border border-carrot-50/15 bg-carrot-50/10 px-2 py-1 text-xs text-carrot-50 focus:outline-none focus:ring-1 focus:ring-carrot-400"
        />
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={() => {
            setActive((v) => !v);
            setDirty(true);
          }}
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-semibold",
            active ? "bg-leaf-500/15 text-leaf-300" : "bg-carrot-50/10 text-carrot-50/50"
          )}
        >
          {active ? "Activo" : "Inactivo"}
        </button>
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="rounded-full bg-carrot-500 px-3 py-1.5 text-xs font-semibold text-ink-950 hover:bg-carrot-400 disabled:opacity-30"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </td>
    </tr>
  );
}

function ProductsSection() {
  const { data, error, loading } = useSupabaseData(fetchAdminProducts);
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) return <p className="text-sm text-carrot-50/50">Cargando productos...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <Table head={["Producto", "Categoría", "Precio mediano", "Precio grande", "Activo", ""]}>
      {data?.map((p) => (
        <ProductRow key={`${p.id}-${refreshKey}`} product={p} onSaved={() => setRefreshKey((k) => k + 1)} />
      ))}
    </Table>
  );
}

function OverviewSection({ goTo }: { goTo: (s: Section) => void }) {
  const { data: orders } = useSupabaseData(fetchAdminOrders);
  const { data: wholesale } = useSupabaseData(fetchAdminWholesaleOrders);
  const { data: customers } = useSupabaseData(fetchAdminCustomers);
  const { data: applications } = useSupabaseData(fetchAdminJobApplications);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ingresos pagados"
          value={formatMXN((orders ?? []).filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.total, 0))}
        />
        <StatCard label="Pedidos" value={orders?.length ?? 0} hint={`${(orders ?? []).filter((o) => o.status === "pending").length} pendientes`} />
        <StatCard label="Cotizaciones de mayoreo" value={wholesale?.length ?? 0} />
        <StatCard label="Miembros de fidelización" value={customers?.length ?? 0} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <button
          type="button"
          onClick={() => goTo("empleo")}
          className="glass glass-card rounded-2xl p-5 text-left"
        >
          <p className="text-xs font-medium text-carrot-50/60">Solicitudes de empleo por revisar</p>
          <p className="mt-2 text-2xl font-bold text-carrot-50">
            {(applications ?? []).filter((a) => a.status === "received").length}
          </p>
        </button>
        <button
          type="button"
          onClick={() => goTo("pedidos")}
          className="glass glass-card rounded-2xl p-5 text-left"
        >
          <p className="text-xs font-medium text-carrot-50/60">Ir a la cola de pedidos</p>
          <p className="mt-2 text-sm text-carrot-50/70">Cambia el estado de preparación y entrega en tiempo real.</p>
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { employee, loading: sessionLoading, login, logout } = useStaffSession();
  const [section, setSection] = useState<Section>("resumen");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (sessionLoading) return <p className="text-sm text-carrot-50/50">Cargando sesión...</p>;
  if (!employee) return <StaffLogin onLogin={login} title="Acceso al panel administrativo" />;
  if (employee.role !== "admin") {
    return (
      <div className="glass mx-auto max-w-md rounded-2xl p-8 text-center">
        <p className="text-lg font-semibold">No tienes permisos de administrador</p>
        <p className="mt-2 text-sm text-carrot-50/60">
          Tu cuenta ({employee.name}) tiene rol de personal. Pide a un administrador que actualice tu rol.
        </p>
        <button onClick={logout} className="mt-4 rounded-full bg-carrot-500 px-5 py-2 text-sm font-semibold text-ink-950">
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex text-carrot-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "glass-strong fixed inset-y-0 left-0 z-50 w-64 shrink-0 rounded-r-3xl transition-transform md:static md:translate-x-0 md:rounded-none md:border-r md:border-carrot-50/10 md:bg-transparent md:backdrop-blur-none md:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-carrot-50/10 px-4">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-carrot-400 to-leaf-500 text-base shadow-glass">
            🥕
          </span>
          <span className="text-sm font-semibold text-carrot-50">Don Zanahorio Admin</span>
        </div>
        <nav className="space-y-6 overflow-y-auto p-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-carrot-50/40">{group.label}</p>
              <div className="mt-1 space-y-0.5">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSection(item.id);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-full px-3 py-2 text-sm transition",
                      section === item.id
                        ? "bg-carrot-500/20 text-carrot-200"
                        : "text-carrot-50/60 hover:bg-carrot-50/10 hover:text-carrot-100"
                    )}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-ink-950/70 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass-strong flex h-14 items-center gap-3 rounded-none border-x-0 border-t-0 px-4">
          <button type="button" onClick={() => setSidebarOpen((v) => !v)} className="text-carrot-50/70 hover:text-carrot-100 md:hidden">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="h-6 w-px bg-carrot-50/15" />
          <h1 className="text-sm font-medium text-carrot-50">{SECTION_LABELS[section]}</h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-medium text-carrot-100">{employee.name}</p>
              <p className="text-[11px] text-carrot-50/50">Administrador</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="glass glass-card flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-carrot-50/80"
            >
              <LogOut size={13} /> Salir
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {section === "resumen" && <OverviewSection goTo={setSection} />}
          {section === "pedidos" && <OrdersSection />}
          {section === "mayoreo" && <WholesaleSection />}
          {section === "encuestas" && <SurveysSection />}
          {section === "clientes" && <CustomersSection />}
          {section === "empleo" && <JobApplicationsSection />}
          {section === "referidos" && <ReferralsSection />}
          {section === "cupones" && <CouponsSection />}
          {section === "productos" && <ProductsSection />}
          {section === "resenas" && <ReviewsSection />}
        </main>
      </div>
    </div>
  );
}
