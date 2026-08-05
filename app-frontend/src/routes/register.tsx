import { createFileRoute, redirect } from "@tanstack/react-router";
import { RegisterPage } from "@/pages/Auth/RegisterPage";
import { useAuthStore } from "@/stores/auth.store";

export const Route = createFileRoute("/register")({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: "/home" });
    }
  },
  head: () => ({
    meta: [
      { title: "Registro — MiLove" },
      { name: "description", content: "Crea una cuenta en MiLove y activa tu dashboard de pareja." }
    ]
  }),
  component: RegisterPage
});
