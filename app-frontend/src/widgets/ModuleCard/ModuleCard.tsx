import { Link } from "@tanstack/react-router";
import type { ModuleDefinition } from "@/shared/constants/modules";
import { cn } from "@/lib/utils";

const ACCENT_CLASSES: Record<ModuleDefinition["accent"], string> = {
  primary: "bg-primary/12 text-primary",
  accent: "bg-accent/12 text-accent",
  success: "bg-success/12 text-success",
  "chart-4": "bg-chart-4/15 text-chart-4",
  "chart-5": "bg-chart-5/15 text-chart-5"
};

/** Tarjeta de acceso a un módulo. Presentacional: no contiene lógica de negocio. */
export function ModuleCard({ module, index = 0 }: { module: ModuleDefinition; index?: number }) {
  const Icon = module.icon;

  return (
    <Link
      to={module.to}
      className="surface-card pressable animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-3 p-4 duration-500 hover:shadow-[var(--shadow-float)]"
      style={{ animationDelay: `${index * 45}ms`, animationFillMode: "backwards" }}
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-2xl",
          ACCENT_CLASSES[module.accent]
        )}
      >
        <Icon className="size-5" strokeWidth={2} />
      </span>
      <span>
        <span className="block text-[15px] font-semibold">{module.title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
          {module.description}
        </span>
      </span>
    </Link>
  );
}
