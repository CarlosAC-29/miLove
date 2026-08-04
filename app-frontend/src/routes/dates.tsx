import { createFileRoute } from "@tanstack/react-router";
import { DatesPage } from "@/pages/Dates/DatesPage";

export const Route = createFileRoute("/dates")({
  head: () => ({
    meta: [
      { title: "Citas — MiLove" },
      { name: "description", content: "Ideas y próximos planes juntos en MiLove, la app para parejas." },
      { property: "og:title", content: "Citas — MiLove" },
      { property: "og:description", content: "Ideas y próximos planes juntos en MiLove, la app para parejas." },
    ],
  }),
  component: DatesPage,
});
