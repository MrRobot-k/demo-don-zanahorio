import { useState } from "react";
import { getCheapest, getVariants } from "@/data/products";
import { fetchCoupons, fetchProducts } from "@/lib/queries";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { formatMXN } from "@/lib/utils";

function CouponCard({ coupon }: { coupon: Awaited<ReturnType<typeof fetchCoupons>>[number] }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(coupon.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="glass glass-card flex flex-col rounded-2xl p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{coupon.title}</h3>
          <p className="mt-1 text-sm text-carrot-50/65">{coupon.description}</p>
        </div>
        {coupon.onlyOnline && (
          <span className="shrink-0 rounded-full bg-leaf-500/20 px-2 py-1 text-[10px] font-semibold text-leaf-300">
            Solo web
          </span>
        )}
      </div>
      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={copy}
          className="glass flex items-center gap-2 rounded-full px-4 py-2 font-mono text-sm font-semibold text-carrot-200"
        >
          {coupon.code}
          <span className="text-xs text-carrot-50/50">{copied ? "¡copiado!" : "copiar"}</span>
        </button>
        <span className="text-xs text-carrot-50/50">Vigente hasta {coupon.validUntil}</span>
      </div>
    </div>
  );
}

export default function PromotionsBoard() {
  const { data: coupons, error: couponsError, loading: couponsLoading } = useSupabaseData(fetchCoupons);
  const { data: products, error: productsError, loading: productsLoading } = useSupabaseData(fetchProducts);

  const cheapest = products ? getCheapest(products, 6) : [];

  return (
    <>
      {couponsLoading ? (
        <p className="text-center text-sm text-carrot-50/60">Cargando cupones...</p>
      ) : couponsError ? (
        <p className="text-center text-sm text-red-400">{couponsError}</p>
      ) : (
        <section className="grid gap-5 sm:grid-cols-2">
          {coupons?.map((coupon) => (
            <CouponCard key={coupon.code} coupon={coupon} />
          ))}
        </section>
      )}

      {productsLoading ? (
        <p className="mt-16 text-center text-sm text-carrot-50/60">Cargando destacados...</p>
      ) : productsError ? (
        <p className="mt-16 text-center text-sm text-red-400">{productsError}</p>
      ) : (
        <section className="mt-16">
          <h2 className="text-2xl font-bold">🪙 Los más económicos</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cheapest.map((p) => {
              const variant = getVariants(p)[0];
              return (
                <div key={p.id} className="glass glass-card rounded-2xl p-5">
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="mt-1 text-xs text-carrot-50/65">{p.description}</p>
                  <p className="mt-3 font-bold text-carrot-200">{formatMXN(variant.price)}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
