import { createFileRoute } from "@tanstack/react-router";
import { RestaurantsPage } from "@/pages/Restaurants/RestaurantsPage";

export const Route = createFileRoute("/restaurants")({
  head: () => ({
    meta: [
      { title: "Restaurantes — MiLove" },
      {
        name: "description",
        content: "Lugares por descubrir y favoritos en MiLove, la app para parejas."
      },
      { property: "og:title", content: "Restaurantes — MiLove" },
      {
        property: "og:description",
        content: "Lugares por descubrir y favoritos en MiLove, la app para parejas."
      }
    ]
  }),
  component: RestaurantsPage
});
