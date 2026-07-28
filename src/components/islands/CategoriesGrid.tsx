import { fetchCategories } from "@/lib/queries";
import { useSupabaseData } from "@/hooks/useSupabaseData";

export default function CategoriesGrid() {
  const { data: categories, error, loading } = useSupabaseData(fetchCategories);

  if (loading) return <p className="mt-8 text-sm text-carrot-50/60">Cargando categorías...</p>;
  if (error) return <p className="mt-8 text-sm text-red-400">{error}</p>;

  return (
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {categories?.map((c) => (
        <a
          key={c.slug}
          href={`/menu?categoria=${c.slug}`}
          className="glass glass-card flex flex-col items-center rounded-2xl p-6 text-center"
        >
          <span className="text-4xl">{c.emoji}</span>
          <h3 className="mt-3 font-semibold">{c.name}</h3>
        </a>
      ))}
    </div>
  );
}
