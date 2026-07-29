import { useEffect, useState } from "react";
import type { JobPosition } from "@/data/team";
import {
  fetchJobPositions,
  fetchTrainingModules,
  fetchTrainingProgress,
  markTrainingComplete,
  submitEmployeeReferral,
  submitJobApplication,
  uploadJobApplicationCv,
} from "@/lib/queries";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useStaffSession } from "@/hooks/useStaffSession";
import StaffLogin from "@/components/islands/StaffLogin";
import { cn } from "@/lib/utils";

type Tab = "capacitacion" | "manuales" | "referidos" | "bolsa";

function PositionSelect({
  positions,
  value,
  onChange,
}: {
  positions: JobPosition[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl bg-carrot-50/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-carrot-400"
    >
      {positions.map((p) => (
        <option className="bg-ink-900" key={p.id} value={p.id}>
          {p.title}
        </option>
      ))}
    </select>
  );
}

function ReferralForm({ positions }: { positions: JobPosition[] }) {
  const [candidate, setCandidate] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!position && positions[0]) setPosition(positions[0].id);
  }, [positions, position]);

  if (sent) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <span className="text-3xl">🤝</span>
        <p className="mt-2 font-semibold">¡Recomendación registrada!</p>
        <p className="mt-1 text-sm text-carrot-50/65">
          Si tu candidato cumple 3 meses, tendrás 7 días para reclamar tu bono de recomendación.
        </p>
      </div>
    );
  }

  return (
    <form
      className="glass space-y-4 rounded-2xl p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!candidate.trim() || !phone.trim() || !position) return;
        setSubmitting(true);
        setSubmitError("");
        try {
          await submitEmployeeReferral({
            candidateName: candidate.trim(),
            candidatePhone: phone.trim(),
            positionId: position,
          });
          setSent(true);
        } catch (err) {
          setSubmitError(err instanceof Error ? err.message : "No se pudo enviar la recomendación.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <p className="text-sm text-carrot-50/70">
        Recomienda a alguien y recibe un bono cuando cumpla 3 meses trabajando con nosotros. Tienes 7 días después
        de esa fecha para reclamarlo.
      </p>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Nombre del candidato</label>
        <input
          type="text"
          value={candidate}
          onChange={(e) => setCandidate(e.target.value)}
          required
          className="w-full rounded-xl bg-carrot-50/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-carrot-400"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Teléfono del candidato</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="w-full rounded-xl bg-carrot-50/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-carrot-400"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Puesto sugerido</label>
        <PositionSelect positions={positions} value={position} onChange={setPosition} />
      </div>
      {submitError && <p className="text-sm text-red-400">{submitError}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-carrot-500 py-2.5 text-sm font-semibold text-ink-950 hover:bg-carrot-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Enviando..." : "Enviar recomendación"}
      </button>
    </form>
  );
}

function JobApplicationForm({ positions }: { positions: JobPosition[] }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!position && positions[0]) setPosition(positions[0].id);
  }, [positions, position]);

  if (sent) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <span className="text-3xl">📄</span>
        <p className="mt-2 font-semibold">¡Solicitud enviada!</p>
        <p className="mt-1 text-sm text-carrot-50/65">Nuestro equipo de RH revisará tu perfil y te contactará.</p>
      </div>
    );
  }

  return (
    <form
      className="glass space-y-4 rounded-2xl p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim() || !position) return;
        setSubmitting(true);
        setSubmitError("");
        try {
          const cvPath = file ? await uploadJobApplicationCv(file) : null;
          await submitJobApplication({ name: name.trim(), phone: phone.trim(), positionId: position, cvPath });
          setSent(true);
        } catch (err) {
          setSubmitError(err instanceof Error ? err.message : "No se pudo enviar tu solicitud.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Nombre completo</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-xl bg-carrot-50/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-carrot-400"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Teléfono de contacto</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="w-full rounded-xl bg-carrot-50/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-carrot-400"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Puesto de interés</label>
        <PositionSelect positions={positions} value={position} onChange={setPosition} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">CV o documentos</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx,image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full rounded-xl bg-carrot-50/10 px-4 py-2.5 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-carrot-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink-950"
        />
        {file && <p className="mt-1.5 text-xs text-carrot-50/50">{file.name} seleccionado.</p>}
      </div>
      {submitError && <p className="text-sm text-red-400">{submitError}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-carrot-500 py-2.5 text-sm font-semibold text-ink-950 hover:bg-carrot-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Enviando..." : "Enviar solicitud"}
      </button>
    </form>
  );
}

export default function EmployeePortal() {
  const { employee, loading: sessionLoading, login, logout } = useStaffSession();
  const [tab, setTab] = useState<Tab>("capacitacion");
  const { data: positions, error: positionsError, loading: positionsLoading } = useSupabaseData(fetchJobPositions);
  const [modules, setModules] = useState<Awaited<ReturnType<typeof fetchTrainingModules>> | null>(null);
  const [modulesError, setModulesError] = useState("");
  const [progress, setProgress] = useState<string[]>([]);

  // Modules and progress are RLS-gated to logged-in employees, so they can only be
  // fetched once the Supabase Auth session is actually established (not on first mount).
  useEffect(() => {
    if (!employee) return;
    fetchTrainingModules()
      .then(setModules)
      .catch((err) => setModulesError(err instanceof Error ? err.message : "No se pudieron cargar los módulos."));
    fetchTrainingProgress(employee.id).then(setProgress).catch(() => {});
  }, [employee]);

  if (sessionLoading) return <p className="text-sm text-carrot-50/60">Cargando sesión...</p>;
  if (!employee) return <StaffLogin onLogin={login} />;

  async function completeModule(moduleId: string) {
    if (!employee) return;
    try {
      await markTrainingComplete(employee.id, moduleId);
      setProgress((p) => [...p, moduleId]);
    } catch {
      /* ya estaba marcado o RLS lo rechazó */
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "capacitacion", label: "Capacitación" },
    { id: "manuales", label: "Manuales y puestos" },
    { id: "referidos", label: "Recomendar candidato" },
    { id: "bolsa", label: "Bolsa de trabajo" },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-carrot-50/70">
          Sesión de <span className="font-semibold text-carrot-50">{employee.name}</span>{" "}
          <span className="rounded-full bg-carrot-50/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-carrot-300">
            {employee.role === "admin" ? "administrador" : "personal"}
          </span>
        </p>
        <div className="flex items-center gap-2">
          {employee.role === "admin" && (
            <a
              href="/admin"
              className="rounded-full bg-carrot-50/10 px-4 py-2 text-xs font-semibold text-carrot-50/80 hover:bg-carrot-50/20"
            >
              Panel administrativo →
            </a>
          )}
          <button
            type="button"
            onClick={logout}
            className="glass glass-card rounded-full px-4 py-2 text-xs font-semibold text-carrot-50/80"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="glass mb-6 flex flex-wrap gap-2 rounded-2xl p-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition",
              tab === t.id ? "bg-carrot-500 text-ink-950" : "text-carrot-50/70 hover:bg-carrot-50/10"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "capacitacion" &&
        (modules === null && !modulesError ? (
          <p className="text-sm text-carrot-50/60">Cargando módulos...</p>
        ) : modulesError ? (
          <p className="text-sm text-red-400">{modulesError}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules?.map((m) => {
              const done = progress.includes(m.id);
              return (
                <div key={m.id} className="glass glass-card rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-carrot-50/10 px-2 py-1 text-[10px] font-semibold text-carrot-50/70">
                      {m.type}
                    </span>
                    {done && <span className="text-xs font-semibold text-leaf-300">Completado ✓</span>}
                  </div>
                  <h3 className="mt-3 font-semibold">{m.title}</h3>
                  <p className="mt-1 text-xs text-carrot-50/50">{m.duration}</p>
                  <p className="mt-2 text-xs text-carrot-50/40">
                    {m.contentUrl ? "Contenido disponible" : "Contenido pendiente de subir por el equipo"}
                  </p>
                  {!done && (
                    <button
                      type="button"
                      onClick={() => completeModule(m.id)}
                      className="mt-3 w-full rounded-full bg-carrot-50/10 py-2 text-xs font-semibold hover:bg-carrot-50/20"
                    >
                      Marcar como completado
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}

      {tab === "manuales" &&
        (positionsLoading ? (
          <p className="text-sm text-carrot-50/60">Cargando puestos...</p>
        ) : positionsError ? (
          <p className="text-sm text-red-400">{positionsError}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {positions?.map((p) => (
              <div key={p.id} className="glass rounded-2xl p-5">
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-1 text-sm text-carrot-50/65">{p.summary}</p>
                <ul className="mt-3 space-y-1.5 text-xs text-carrot-50/60">
                  {p.responsibilities.map((r) => (
                    <li key={r}>• {r}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}

      {tab === "referidos" && (positions ? <ReferralForm positions={positions} /> : <p className="text-sm text-carrot-50/60">Cargando puestos...</p>)}
      {tab === "bolsa" && (positions ? <JobApplicationForm positions={positions} /> : <p className="text-sm text-carrot-50/60">Cargando puestos...</p>)}
    </div>
  );
}
