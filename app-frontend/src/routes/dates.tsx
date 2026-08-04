import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPage } from "@/pages/ComingSoon/ComingSoonPage";

export const Route = createFileRoute("/dates")({
  head: () => ({
    meta: [
      { title: "Citas — MiLove" },
      { name: "description", content: "Ideas y próximos planes juntos en MiLove, la app para parejas." },
      { property: "og:title", content: "Citas — MiLove" },
      { property: "og:description", content: "Ideas y próximos planes juntos en MiLove, la app para parejas." },
    ],
  }),
  component: () => <ComingSoonPage title="Citas" subtitle="Ideas y próximos planes juntos" />,
});
