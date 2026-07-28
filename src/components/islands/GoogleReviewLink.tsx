import { SITE } from "@/data/site";
import { submitGoogleReviewClick } from "@/lib/queries";
import { cn } from "@/lib/utils";

export default function GoogleReviewLink({ className }: { className?: string }) {
  return (
    <a
      href={SITE.googleReviewUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        submitGoogleReviewClick().catch(() => {});
      }}
      className={cn(
        "inline-block rounded-full bg-carrot-500 px-6 py-3 text-sm font-semibold text-ink-950 hover:bg-carrot-400",
        className
      )}
    >
      Escribir reseña en Google
    </a>
  );
}
