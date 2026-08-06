import { createFileRoute } from "@tanstack/react-router";
import { GiftsPage } from "@/pages/Gifts/GiftsPage";

export const Route = createFileRoute("/gifts")({
  head: () => ({
    meta: [
      { title: "Regalos — MiLove" },
      {
        name: "description",
        content: "Ideas, favoritos y lista de deseos en MiLove, la app para parejas."
      },
      { property: "og:title", content: "Regalos — MiLove" },
      {
        property: "og:description",
        content: "Ideas, favoritos y lista de deseos en MiLove, la app para parejas."
      }
    ]
  }),
  component: GiftsPage
});
