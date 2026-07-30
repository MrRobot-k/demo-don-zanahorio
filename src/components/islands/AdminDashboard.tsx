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
  Gift,
  MapPin,
} from "lucide-react";
import { useStaffSession } from "@/hooks/useStaffSession";
import StaffLogin from "@/components/islands/StaffLogin";
import { formatMXN, cn } from "@/lib/utils";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { SITE } from "@/data/site";
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
  fetchAdminGoogleReviews,
  fetchReviewRewardConfig,
  updateReviewRewardConfig,
  fetchAdminCashiers,
  linkCashierToEmployee,
  fetchAdminEmployees,
  fetchAdminBonusLedger,
  payEmployeeBonus,
  fetchBonusConfig,
  updateBonusConfig,
  fetchAdminDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
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
  | "zonas"
  | "encuestas"
  | "clientes"
  | "empleo"
  | "referidos"
  | "incentivos"
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
      { id: "zonas", label: "Zonas de entrega", icon: MapPin },
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
      { id: "incentivos", label: "Incentivos", icon: Gift },
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
  zonas: "Zonas de entrega",
  encuestas: "Encuestas",
  clientes: "Clientes de fidelización",
  empleo: "Solicitudes de empleo",
  referidos: "Referidos de empleados",
  incentivos: "Incentivos de personal",
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

function IncentivesSection() {
  const { data: cashiers, error: cashiersError, loading: cashiersLoading } = useSupabaseData(fetchAdminCashiers);
  const { data: employees } = useSupabaseData(fetchAdminEmployees);
  const { data: ledger, error: ledgerError, loading: ledgerLoading } = useSupabaseData(fetchAdminBonusLedger);
  const { data: config } = useSupabaseData(fetchBonusConfig);
  const [cashierRows, setCashierRows] = useState(cashiers);
  const [cfg, setCfg] = useState(config);
  const [ledgerRows, setLedgerRows] = useState(ledger);
  const [payForm, setPayForm] = useState({ employeeId: "", amount: "", note: "" });
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  useEffect(() => setCashierRows(cashiers), [cashiers]);
  useEffect(() => setCfg(config), [config]);
  useEffect(() => setLedgerRows(ledger), [ledger]);

  async function link(cashierId: string, employeeId: string) {
    setCashierRows(
      (prev) =>
        prev?.map((c) =>
          c.id === cashierId
            ? { ...c, employeeId: employeeId || null, employeeName: employees?.find((e) => e.id === employeeId)?.name ?? null }
            : c
        ) ?? null
    );
    await linkCashierToEmployee(cashierId, employeeId || null).catch(() => {});
  }

  async function saveConfig() {
    if (!cfg) return;
    await updateBonusConfig(cfg).catch(() => {});
  }

  async function refreshLedger() {
    const fresh = await fetchAdminBonusLedger().catch(() => null);
    if (fresh) setLedgerRows(fresh);
  }

  async function submitPayout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!payForm.employeeId || !payForm.amount) return;
    setPaying(true);
    setPayError("");
    try {
      await payEmployeeBonus(payForm.employeeId, Number(payForm.amount), payForm.note.trim() || null);
      setPayForm({ employeeId: "", amount: "", note: "" });
      await refreshLedger();
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "No se pudo registrar el pago.");
    } finally {
      setPaying(false);
    }
  }

  const balances = new Map<string, number>();
  for (const t of ledgerRows ?? []) {
    balances.set(t.employeeId, (balances.get(t.employeeId) ?? 0) + t.amount);
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-carrot-50/80">Vincular cajero con empleado</h3>
        {cashiersLoading ? (
          <p className="text-sm text-carrot-50/50">Cargando cajeros...</p>
        ) : cashiersError ? (
          <p className="text-sm text-red-400">{cashiersError}</p>
        ) : (
          <Table head={["Cajero(a)", "Empleado vinculado", ""]}>
            {cashierRows?.map((c) => (
              <tr key={c.id} className="hover:bg-carrot-50/5">
                <td className="px-4 py-3 text-carrot-50">{c.name}</td>
                <td className="px-4 py-3 text-xs text-carrot-50/60">{c.employeeName ?? "Sin vincular"}</td>
                <td className="px-4 py-3">
                  <select
                    value={c.employeeId ?? ""}
                    onChange={(e) => link(c.id, e.target.value)}
                    className="rounded-full border border-carrot-50/15 bg-ink-900 px-2 py-1 text-xs text-carrot-50 focus:outline-none focus:ring-1 focus:ring-carrot-400"
                  >
                    <option value="" className="bg-ink-900">
                      Sin vincular
                    </option>
                    {employees?.map((e) => (
                      <option key={e.id} value={e.id} className="bg-ink-900">
                        {e.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {cfg && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-carrot-50/80">Reglas del incentivo</h3>
          <div className="glass grid gap-3 rounded-2xl p-4 sm:grid-cols-4">
            <label className="text-xs text-carrot-50/60">
              Calificación mínima
              <input
                type="number"
                min={1}
                max={5}
                value={cfg.minServiceRating}
                onChange={(e) => setCfg({ ...cfg, minServiceRating: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-carrot-50/15 bg-carrot-50/10 px-2 py-1.5 text-sm text-carrot-50"
              />
            </label>
            <label className="text-xs text-carrot-50/60">
              Monto por encuesta
              <input
                type="number"
                value={cfg.amountPerSurvey}
                onChange={(e) => setCfg({ ...cfg, amountPerSurvey: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-carrot-50/15 bg-carrot-50/10 px-2 py-1.5 text-sm text-carrot-50"
              />
            </label>
            <label className="text-xs text-carrot-50/60">
              Bono cajero del mes
              <input
                type="number"
                value={cfg.topVoteAmount}
                onChange={(e) => setCfg({ ...cfg, topVoteAmount: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-carrot-50/15 bg-carrot-50/10 px-2 py-1.5 text-sm text-carrot-50"
              />
            </label>
            <button
              type="button"
              onClick={saveConfig}
              className="mt-auto rounded-full bg-carrot-500 px-3 py-2 text-xs font-semibold text-ink-950 hover:bg-carrot-400"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-carrot-50/80">Registrar pago</h3>
        <form onSubmit={submitPayout} className="glass grid gap-3 rounded-2xl p-4 sm:grid-cols-4">
          <select
            required
            value={payForm.employeeId}
            onChange={(e) => setPayForm({ ...payForm, employeeId: e.target.value })}
            className="rounded-xl border border-carrot-50/15 bg-ink-900 px-3 py-2 text-sm text-carrot-50"
          >
            <option value="" className="bg-ink-900">
              Empleado...
            </option>
            {employees?.map((e) => (
              <option key={e.id} value={e.id} className="bg-ink-900">
                {e.name} · saldo {formatMXN(balances.get(e.id) ?? 0)}
              </option>
            ))}
          </select>
          <input
            required
            type="number"
            placeholder="Monto"
            value={payForm.amount}
            onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
            className="rounded-xl border border-carrot-50/15 bg-carrot-50/10 px-3 py-2 text-sm text-carrot-50 placeholder:text-carrot-50/40"
          />
          <input
            placeholder="Nota (opcional)"
            value={payForm.note}
            onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
            className="rounded-xl border border-carrot-50/15 bg-carrot-50/10 px-3 py-2 text-sm text-carrot-50 placeholder:text-carrot-50/40"
          />
          <button
            type="submit"
            disabled={paying}
            className="rounded-full bg-leaf-500 px-3 py-2 text-xs font-semibold text-ink-950 hover:bg-leaf-400 disabled:opacity-40"
          >
            {paying ? "Registrando..." : "Registrar pago"}
          </button>
        </form>
        {payError && <p className="mt-2 text-xs text-red-400">{payError}</p>}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-carrot-50/80">Libro mayor de incentivos</h3>
        {ledgerLoading ? (
          <p className="text-sm text-carrot-50/50">Cargando movimientos...</p>
        ) : ledgerError ? (
          <p className="text-sm text-red-400">{ledgerError}</p>
        ) : (
          <Table head={["Empleado", "Tipo", "Monto", "Nota", "Fecha"]}>
            {ledgerRows?.map((t) => (
              <tr key={t.id} className="hover:bg-carrot-50/5">
                <td className="px-4 py-3 text-carrot-50">{t.employeeName ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge tone={t.type === "payout" ? "warn" : "good"}>
                    {t.type === "survey_incentive" ? "Encuesta" : t.type === "payout" ? "Pago" : "Ajuste"}
                  </Badge>
                </td>
                <td className={cn("px-4 py-3 font-semibold", t.amount < 0 ? "text-red-300" : "text-leaf-300")}>{formatMXN(t.amount)}</td>
                <td className="px-4 py-3 text-xs text-carrot-50/60">{t.note ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-carrot-50/50">{new Date(t.createdAt).toLocaleDateString("es-MX")}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  );
}

function DeliveryZonesSection() {
  const { data, error, loading } = useSupabaseData(fetchAdminDeliveryZones);
  const [rows, setRows] = useState(data);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", distanceKm: "" });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  useEffect(() => setRows(data), [data]);

  async function toggle(id: string, active: boolean) {
    setRows((prev) => prev?.map((z) => (z.id === id ? { ...z, active } : z)) ?? null);
    await updateDeliveryZone(id, { active }).catch(() => {});
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setFormError("");
    try {
      await createDeliveryZone({ name: form.name.trim(), distanceKm: Number(form.distanceKm) });
      setForm({ name: "", distanceKm: "" });
      setShowForm(false);
      const fresh = await fetchAdminDeliveryZones();
      setRows(fresh);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo crear la zona.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <p className="text-sm text-carrot-50/50">Cargando zonas...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-carrot-500 px-3.5 py-1.5 text-xs font-semibold text-ink-950 hover:bg-carrot-400"
        >
          <Plus size={14} /> Nueva zona
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass grid gap-3 rounded-2xl p-4 sm:grid-cols-3">
          <input
            required
            placeholder="Nombre (colonia o zona)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-xl border border-carrot-50/15 bg-carrot-50/10 px-3 py-2 text-sm text-carrot-50 placeholder:text-carrot-50/40 sm:col-span-2"
          />
          <input
            required
            type="number"
            placeholder="Distancia (km)"
            value={form.distanceKm}
            onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
            className="rounded-xl border border-carrot-50/15 bg-carrot-50/10 px-3 py-2 text-sm text-carrot-50 placeholder:text-carrot-50/40"
          />
          {formError && <p className="text-xs text-red-400 sm:col-span-3">{formError}</p>}
          <button
            type="submit"
            disabled={creating}
            className="rounded-full bg-carrot-500 px-3 py-2 text-xs font-semibold text-ink-950 hover:bg-carrot-400 disabled:opacity-40 sm:col-span-3"
          >
            {creating ? "Creando..." : "Crear zona"}
          </button>
        </form>
      )}

      <Table head={["Zona", "Distancia", "Costo estimado", "Activa"]}>
        {rows?.map((z) => (
          <tr key={z.id} className="hover:bg-carrot-50/5">
            <td className="px-4 py-3 text-carrot-50">{z.name}</td>
            <td className="px-4 py-3 text-xs text-carrot-50/60">{z.distanceKm} km</td>
            <td className="px-4 py-3 text-xs text-carrot-50/60">
              {formatMXN(SITE.shipping.baseCost + z.distanceKm * SITE.shipping.perKm)}
            </td>
            <td className="px-4 py-3">
              <button
                type="button"
                onClick={() => toggle(z.id, !z.active)}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-semibold",
                  z.active ? "bg-leaf-500/15 text-leaf-300" : "bg-carrot-50/10 text-carrot-50/50"
                )}
              >
                {z.active ? "Activa" : "Inactiva"}
              </button>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function ReviewsSection() {
  const { data, error, loading } = useSupabaseData(fetchAdminGoogleReviews);
  const { data: config } = useSupabaseData(fetchReviewRewardConfig);
  const [cfg, setCfg] = useState(config);
  useEffect(() => setCfg(config), [config]);

  async function saveConfig() {
    if (!cfg) return;
    await updateReviewRewardConfig(cfg).catch(() => {});
  }

  if (loading) return <p className="text-sm text-carrot-50/50">Cargando...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Reseñas registradas" value={data?.length ?? 0} />
        <StatCard label="Con cupón otorgado" value={(data ?? []).filter((r) => r.rewardGranted).length} />
        <StatCard label="Descuento actual" value={cfg ? `${cfg.discountPercent}%` : "—"} />
      </div>

      {cfg && (
        <div className="glass grid gap-3 rounded-2xl p-4 sm:grid-cols-4">
          <label className="text-xs text-carrot-50/60">
            % de descuento
            <input
              type="number"
              value={cfg.discountPercent}
              onChange={(e) => setCfg({ ...cfg, discountPercent: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-carrot-50/15 bg-carrot-50/10 px-2 py-1.5 text-sm text-carrot-50"
            />
          </label>
          <label className="text-xs text-carrot-50/60">
            Días de vigencia
            <input
              type="number"
              value={cfg.validDays}
              onChange={(e) => setCfg({ ...cfg, validDays: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-carrot-50/15 bg-carrot-50/10 px-2 py-1.5 text-sm text-carrot-50"
            />
          </label>
          <label className="text-xs text-carrot-50/60">
            Días de espera entre reseñas
            <input
              type="number"
              value={cfg.cooldownDays}
              onChange={(e) => setCfg({ ...cfg, cooldownDays: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-carrot-50/15 bg-carrot-50/10 px-2 py-1.5 text-sm text-carrot-50"
            />
          </label>
          <button
            type="button"
            onClick={saveConfig}
            className="mt-auto rounded-full bg-carrot-500 px-3 py-2 text-xs font-semibold text-ink-950 hover:bg-carrot-400"
          >
            Guardar
          </button>
        </div>
      )}

      <Table head={["Cliente", "Contacto", "Cupón otorgado", "Fecha"]}>
        {data?.map((r) => (
          <tr key={r.id} className="hover:bg-carrot-50/5">
            <td className="px-4 py-3 text-carrot-50">{r.customerName ?? "—"}</td>
            <td className="px-4 py-3 text-xs text-carrot-50/60">{r.customerContact ?? "—"}</td>
            <td className="px-4 py-3">
              <Badge tone={r.rewardGranted ? "good" : "neutral"}>{r.rewardGranted ? "Sí" : "No"}</Badge>
            </td>
            <td className="px-4 py-3 text-xs text-carrot-50/50">{new Date(r.submittedAt).toLocaleDateString("es-MX")}</td>
          </tr>
        ))}
      </Table>
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
          {section === "zonas" && <DeliveryZonesSection />}
          {section === "encuestas" && <SurveysSection />}
          {section === "clientes" && <CustomersSection />}
          {section === "empleo" && <JobApplicationsSection />}
          {section === "referidos" && <ReferralsSection />}
          {section === "incentivos" && <IncentivesSection />}
          {section === "cupones" && <CouponsSection />}
          {section === "productos" && <ProductsSection />}
          {section === "resenas" && <ReviewsSection />}
        </main>
      </div>
    </div>
  );
}
