import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPage } from "@/pages/ComingSoon/ComingSoonPage";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Lista de deseos — MiLove" },
      {
        name: "description",
        content: "Lo que sueñan tener o hacer en MiLove, la app para parejas."
      },
      { property: "og:title", content: "Lista de deseos — MiLove" },
      {
        property: "og:description",
        content: "Lo que sueñan tener o hacer en MiLove, la app para parejas."
      }
    ]
  }),
  component: () => <ComingSoonPage title="Lista de deseos" subtitle="Lo que sueñan tener o hacer" />
});
