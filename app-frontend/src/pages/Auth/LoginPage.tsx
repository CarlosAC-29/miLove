import { LoginForm } from "@/features/auth/login/LoginForm";
import { AppleLoginButton } from "@/features/auth/social-login/AppleLoginButton";
import { GoogleLoginButton } from "@/features/auth/social-login/GoogleLoginButton";
import { SurfaceCard } from "@/shared/ui/SurfaceCard";

export function LoginPage() {
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-5 py-10">
      <div className="pointer-events-none absolute -top-14 left-6 size-36 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute right-4 bottom-20 size-40 rounded-full bg-accent/20 blur-3xl" />

      <SurfaceCard className="relative animate-in fade-in zoom-in-95 space-y-5 rounded-3xl p-6 duration-300">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold tracking-[0.22em] text-primary uppercase">MiLove</p>
          <h1 className="text-3xl">Bienvenidos</h1>
          <p className="text-sm text-muted-foreground">
            Organiza tu vida, tus finanzas y tus momentos juntos.
          </p>
        </div>

        <div className="space-y-3">
          <GoogleLoginButton />
          <AppleLoginButton />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">o</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <LoginForm mode="login" />
      </SurfaceCard>
    </div>
  );
}
