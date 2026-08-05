import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginPage } from "@/pages/Auth/LoginPage";
import { useAuthStore } from "@/stores/auth.store";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: "/home" });
    }
  },
  head: () => ({
    meta: [
      { title: "Iniciar sesion — MiLove" },
      {
        name: "description",
        content: "Accede a MiLove con Google, Apple o email para entrar al dashboard privado."
      }
    ]
  }),
  component: LoginPage
});
