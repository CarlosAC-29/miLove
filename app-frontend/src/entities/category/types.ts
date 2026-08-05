/** Categoría de gasto/ingreso. Fuente única para formularios y gráficos. */
export interface Category {
  readonly id: string;
  readonly name: string;
  readonly color: "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5";
}

export const CATEGORIES: readonly Category[] = [
  { id: "alimentacion", name: "Alimentación", color: "chart-1" },
  { id: "transporte", name: "Transporte", color: "chart-5" },
  { id: "entretenimiento", name: "Entretenimiento", color: "chart-2" },
  { id: "tecnologia", name: "Tecnología", color: "chart-4" },
  { id: "salud", name: "Salud", color: "chart-3" },
  { id: "educacion", name: "Educación", color: "chart-5" },
  { id: "hogar", name: "Hogar", color: "chart-4" },
  { id: "ingresos", name: "Ingresos", color: "chart-3" },
  { id: "otros", name: "Otros", color: "chart-2" }
] as const;

export function getCategory(id: string): Category {
  return CATEGORIES.find((category) => category.id === id) ?? CATEGORIES[CATEGORIES.length - 1]!;
}
