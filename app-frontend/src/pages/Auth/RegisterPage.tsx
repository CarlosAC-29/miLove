import { LoginForm } from "@/features/auth/login/LoginForm";
import { SurfaceCard } from "@/shared/ui/SurfaceCard";

export function RegisterPage() {
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-5 py-10">
      <div className="pointer-events-none absolute -top-14 left-6 size-36 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute right-4 bottom-20 size-40 rounded-full bg-accent/20 blur-3xl" />

      <SurfaceCard className="relative animate-in fade-in zoom-in-95 space-y-5 rounded-3xl p-6 duration-300">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">MiLove</p>
          <h1 className="text-3xl">Crear cuenta</h1>
          <p className="text-sm text-muted-foreground">
            Crea tu cuenta para entrar al dashboard privado de su relacion.
          </p>
        </div>

        <LoginForm mode="register" />
      </SurfaceCard>
    </div>
  );
}
