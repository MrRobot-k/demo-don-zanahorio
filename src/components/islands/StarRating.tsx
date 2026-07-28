import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} estrellas`}
          onClick={() => onChange(n)}
          className="p-0.5"
        >
          <Star
            size={26}
            className={cn(n <= value ? "fill-carrot-400 text-carrot-400" : "text-carrot-50/25")}
          />
        </button>
      ))}
    </div>
  );
}
