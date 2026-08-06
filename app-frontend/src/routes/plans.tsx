import { createFileRoute } from "@tanstack/react-router";
import { PlansPage } from "@/pages/Plans/PlansPage";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "Planes — MiLove" },
      {
        name: "description",
        content: "Agenda conjunta de la pareja en MiLove, la app para parejas."
      },
      { property: "og:title", content: "Planes — MiLove" },
      {
        property: "og:description",
        content: "Agenda conjunta de la pareja en MiLove, la app para parejas."
      }
    ]
  }),
  component: PlansPage
});
