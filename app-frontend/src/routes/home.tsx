import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/pages/Home/HomePage";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — MiLove" },
      { name: "description", content: "Dashboard privado de MiLove para tu vida en pareja." },
      { property: "og:title", content: "Home — MiLove" },
      {
        property: "og:description",
        content: "Organiza finanzas, citas, regalos, peliculas y planes en pareja."
      }
    ]
  }),
  component: HomePage
});
