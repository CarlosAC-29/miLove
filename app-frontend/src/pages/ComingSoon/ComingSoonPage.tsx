import { Screen } from "@/shared/ui/Screen";
import { SurfaceCard } from "@/shared/ui/SurfaceCard";

/** Placeholder de módulos que se construyen en fases posteriores. */
export function ComingSoonPage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Screen title={title} subtitle={subtitle}>
      <SurfaceCard>
        <p className="text-sm text-muted-foreground">
          Este módulo se implementa en una fase siguiente. La ruta, el layout y la capa de datos ya
          están preparados.
        </p>
      </SurfaceCard>
    </Screen>
  );
}
