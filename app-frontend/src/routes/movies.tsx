import { createFileRoute } from "@tanstack/react-router";
import { MoviesPage } from "@/pages/Movies/MoviesPage";

export const Route = createFileRoute("/movies")({
  head: () => ({
    meta: [
      { title: "Películas — MiLove" },
      {
        name: "description",
        content: "Pendientes, vistas y recomendadas en MiLove, la app para parejas."
      },
      { property: "og:title", content: "Películas — MiLove" },
      {
        property: "og:description",
        content: "Pendientes, vistas y recomendadas en MiLove, la app para parejas."
      }
    ]
  }),
  component: MoviesPage
});
