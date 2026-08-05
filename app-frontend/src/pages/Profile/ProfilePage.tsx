import { LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/logout/useLogout";
import { useAuthStore } from "@/stores/auth.store";
import { Screen } from "@/shared/ui/Screen";
import { SurfaceCard } from "@/shared/ui/SurfaceCard";

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const { isLoading, performLogout } = useLogout();

  return (
    <Screen title="Perfil" subtitle="Tu sesion y datos de acceso">
      <SurfaceCard className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">{user?.name ?? "Usuario"}</p>
            <p className="text-xs text-muted-foreground">{user?.email ?? "Sin email"}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Proveedor:{" "}
          <span className="font-semibold text-foreground">{user?.provider ?? "email"}</span>
        </p>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-center rounded-xl"
          onClick={performLogout}
          disabled={isLoading}
        >
          <LogOut className="size-4" />
          Cerrar sesion
        </Button>
      </SurfaceCard>
    </Screen>
  );
}
