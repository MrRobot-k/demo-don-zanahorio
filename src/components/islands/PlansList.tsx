import { useEffect } from "react";
import { fetchPlans } from "@/lib/queries";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { restoreLoyaltySession } from "@/stores/loyalty";
import PlanCard from "@/components/islands/PlanCard";

export default function PlansList() {
  const { data: plans, error, loading } = useSupabaseData(fetchPlans);

  useEffect(() => {
    restoreLoyaltySession();
  }, []);

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
