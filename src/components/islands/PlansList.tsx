import { fetchPlans } from "@/lib/queries";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import PlanCard from "@/components/islands/PlanCard";

export default function PlansList() {
  const { data: plans, error, loading } = useSupabaseData(fetchPlans);

  if (loading) return <p className="text-center text-sm text-carrot-50/60">Cargando planes...</p>;
  if (error) return <p className="text-center text-sm text-red-400">{error}</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {plans?.map((plan) => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}
