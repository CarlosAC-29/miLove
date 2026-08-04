import { createFileRoute } from "@tanstack/react-router";
import { FinancePage } from "@/pages/Finance/FinancePage";

export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [
      { title: "Finanzas — MiLove" },
      { name: "description", content: "Balance, gastos e ingresos compartidos en MiLove, la app para parejas." },
      { property: "og:title", content: "Finanzas — MiLove" },
      { property: "og:description", content: "Balance, gastos e ingresos compartidos en MiLove, la app para parejas." },
    ],
  }),
  component: FinancePage,
});
