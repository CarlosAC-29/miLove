import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/home" });
  },
  head: () => ({
    meta: [
      { title: "MiLove — El espacio digital de su relación" },
      {
        name: "description",
        content:
          "Organiza finanzas, citas, regalos, películas y planes en pareja desde una sola app móvil."
      },
      { property: "og:title", content: "MiLove — El espacio digital de su relación" },
      {
        property: "og:description",
        content: "Un ecosistema de módulos para organizar y mejorar la vida en pareja."
      }
    ]
  })
});
