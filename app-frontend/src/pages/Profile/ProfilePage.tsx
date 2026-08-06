import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Heart, LoaderCircle, LogOut, PencilLine, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiError } from "@/services/api/errors";
import { useLogout } from "@/features/auth/logout/useLogout";
import { usersService } from "@/services/users.service";
import { useAuthStore } from "@/stores/auth.store";
import { Screen } from "@/shared/ui/Screen";
import { SurfaceCard } from "@/shared/ui/SurfaceCard";

function getErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") return "No se pudo actualizar el perfil.";
  const apiError = error as ApiError;
  if (typeof apiError.details === "string") {
    try {
      const parsed = JSON.parse(apiError.details) as { message?: string };
      if (parsed.message) return parsed.message;
    } catch {
      return apiError.details;
    }
  }
  if ("message" in apiError && typeof apiError.message === "string") {
    return apiError.message;
  }
  return "No se pudo actualizar el perfil.";
}

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { isLoading, performLogout } = useLogout();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [isPartnerLoading, setIsPartnerLoading] = useState(Boolean(user));

  useEffect(() => {
    setName(user?.name ?? "");
    setAvatar(user?.avatar ?? "");
  }, [user?.avatar, user?.name]);

  useEffect(() => {
    if (!user) {
      setPartnerName(null);
      setIsPartnerLoading(false);
      return;
    }

    let isCurrent = true;
    const loadPartner = async () => {
      setIsPartnerLoading(true);
      try {
        const partner = await usersService.getMyPartner();
        if (isCurrent) setPartnerName(partner?.name ?? null);
      } catch {
        if (isCurrent) setPartnerName(null);
      } finally {
        if (isCurrent) setIsPartnerLoading(false);
      }
    };

    void loadPartner();
    return () => {
      isCurrent = false;
    };
  }, [user?.id]);

  const updateProfileMutation = useMutation({
    mutationFn: (input: { name: string; avatar?: string }) => usersService.updateMe(input),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      setSaveError(null);
      setIsEditModalOpen(false);
    },
    onError: (error) => setSaveError(getErrorMessage(error))
  });

  const handleSaveProfile = async () => {
    const normalizedName = name.trim();
    const normalizedAvatar = avatar.trim();
    if (normalizedName.length < 2) {
      setSaveError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    setSaveError(null);
    await updateProfileMutation.mutateAsync({
      name: normalizedName,
      avatar: normalizedAvatar.length > 0 ? normalizedAvatar : ""
    });
  };

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
          variant="secondary"
          className="h-11 w-full justify-center rounded-xl"
          onClick={() => {
            setName(user?.name ?? "");
            setAvatar(user?.avatar ?? "");
            setSaveError(null);
            setIsEditModalOpen(true);
          }}
        >
          <PencilLine className="size-4" />
          Editar perfil
        </Button>
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
      <SurfaceCard className="mt-4 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Heart className="size-5" />
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Mi pareja
          </p>
          {isPartnerLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Cargando pareja...
            </p>
          ) : (
            <p className="text-sm font-semibold">{partnerName ?? "Sin pareja configurada"}</p>
          )}
        </div>
      </SurfaceCard>
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>Actualiza tus datos visibles para tu pareja.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Nombre</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Tu nombre"
                maxLength={120}
              />
            </div>
            {/* <div className="space-y-1.5">
              <Label htmlFor="profile-avatar">URL de foto (opcional)</Label>
              <Input
                id="profile-avatar"
                value={avatar}
                onChange={(event) => setAvatar(event.target.value)}
                placeholder="https://..."
                maxLength={2048}
              />
            </div> */}
            {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={updateProfileMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Screen>
  );
}
