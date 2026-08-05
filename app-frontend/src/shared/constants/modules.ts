import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Clapperboard,
  Gift,
  Heart,
  ListChecks,
  Target,
  UtensilsCrossed,
  Wallet
} from "lucide-react";

export interface ModuleDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly to:
    | "/finance"
    | "/dates"
    | "/gifts"
    | "/movies"
    | "/restaurants"
    | "/plans"
    | "/wishlist"
    | "/goals";
  readonly accent: "primary" | "accent" | "success" | "chart-4" | "chart-5";
}

/** Catálogo de módulos del ecosistema MiLove. Fuente única para Home y navegación. */
export const MODULES: readonly ModuleDefinition[] = [
  {
    id: "finance",
    title: "Finanzas",
    description: "Gastos, ingresos y presupuesto compartido",
    icon: Wallet,
    to: "/finance",
    accent: "success"
  },
  {
    id: "dates",
    title: "Citas",
    description: "Ideas y planes para verse más seguido",
    icon: Heart,
    to: "/dates",
    accent: "primary"
  },
  {
    id: "gifts",
    title: "Regalos",
    description: "Ideas, favoritos y preferencias",
    icon: Gift,
    to: "/gifts",
    accent: "accent"
  },
  {
    id: "movies",
    title: "Películas",
    description: "Pendientes, vistas y recomendadas",
    icon: Clapperboard,
    to: "/movies",
    accent: "chart-5"
  },
  {
    id: "restaurants",
    title: "Restaurantes",
    description: "Lugares por descubrir y favoritos",
    icon: UtensilsCrossed,
    to: "/restaurants",
    accent: "chart-4"
  },
  {
    id: "plans",
    title: "Planes",
    description: "Agenda conjunta de la pareja",
    icon: CalendarDays,
    to: "/plans",
    accent: "primary"
  },
  {
    id: "wishlist",
    title: "Lista de deseos",
    description: "Lo que sueñan tener o hacer",
    icon: ListChecks,
    to: "/wishlist",
    accent: "accent"
  },
  {
    id: "goals",
    title: "Metas",
    description: "Objetivos comunes y su progreso",
    icon: Target,
    to: "/goals",
    accent: "success"
  }
] as const;
