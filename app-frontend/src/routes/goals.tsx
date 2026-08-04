import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPage } from "@/pages/ComingSoon/ComingSoonPage";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Metas — MiLove" },
      { name: "description", content: "Objetivos comunes y su progreso en MiLove, la app para parejas." },
      { property: "og:title", content: "Metas — MiLove" },
      { property: "og:description", content: "Objetivos comunes y su progreso en MiLove, la app para parejas." },
    ],
  }),
  component: () => <ComingSoonPage title="Metas" subtitle="Objetivos comunes y su progreso" />,
});
