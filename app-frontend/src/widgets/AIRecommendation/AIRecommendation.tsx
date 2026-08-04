import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { aiRecommendationsQuery } from "./model/queries";

/** Widget de recomendación IA. Preparado para conectarse a un backend de IA real. */
export function AIRecommendation() {
  const { data, isPending } = useQuery(aiRecommendationsQuery());
  const recommendation = data?.[0];

  return (
    <section className="brand-gradient relative overflow-hidden rounded-3xl p-5 text-primary-foreground shadow-[var(--shadow-float)]">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase opacity-90">
        <Sparkles className="size-4" />
        Sugerencia MiLove
      </div>
      {isPending || !recommendation ? (
        <div className="mt-4 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-primary-foreground/25" />
          <div className="h-4 w-full animate-pulse rounded-full bg-primary-foreground/20" />
        </div>
      ) : (
        <>
          <h3 className="mt-3 text-xl text-primary-foreground">{recommendation.title}</h3>
          <p className="mt-2 text-sm leading-relaxed opacity-95">{recommendation.message}</p>
        </>
      )}
    </section>
  );
}
