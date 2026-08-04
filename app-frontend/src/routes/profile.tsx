import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/pages/Profile/ProfilePage";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Perfil — MiLove" },
      { name: "description", content: "Gestiona tu sesion y proveedor de acceso en MiLove." },
    ],
  }),
  component: ProfilePage,
});
