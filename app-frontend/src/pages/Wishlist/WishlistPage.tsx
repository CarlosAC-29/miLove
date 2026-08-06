import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
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
import { Textarea } from "@/components/ui/textarea";
import type { ApiError } from "@/services/api/errors";
import { useAuthStore } from "@/stores/auth.store";
import { wishlistService, type WishlistItemDto } from "@/services/wishlist.service";
import { Screen } from "@/shared/ui/Screen";
import { SectionTitle, SurfaceCard } from "@/shared/ui/SurfaceCard";

const WISHLIST_KEY = ["wishlist", "list"] as const;

function getErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") return "No se pudo completar la operación.";
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
  return "No se pudo completar la operación.";
}

export function WishlistPage() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [ownerFilter, setOwnerFilter] = useState<"all" | "mine" | "partner">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemIdToDelete, setItemIdToDelete] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [webUrlDraft, setWebUrlDraft] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const wishlistQuery = useQuery({
    queryKey: WISHLIST_KEY,
    queryFn: () => wishlistService.listItems(),
    refetchInterval: 5000
  });

  const createItemMutation = useMutation({
    mutationFn: (input: { title: string; description: string; webUrl: string }) => wishlistService.createItem(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WISHLIST_KEY });
      setIsModalOpen(false);
      setEditingItemId(null);
      setTitleDraft("");
      setDescriptionDraft("");
      setWebUrlDraft("");
      setFormError(null);
    },
    onError: (error) => setFormError(getErrorMessage(error))
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, ...input }: { id: string; title: string; description: string; webUrl: string }) =>
      wishlistService.updateItem(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WISHLIST_KEY });
      setIsModalOpen(false);
      setEditingItemId(null);
      setTitleDraft("");
      setDescriptionDraft("");
      setWebUrlDraft("");
      setFormError(null);
    },
    onError: (error) => setFormError(getErrorMessage(error))
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => wishlistService.deleteItem(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WISHLIST_KEY });
      setItemIdToDelete(null);
      setIsDeleteModalOpen(false);
      setFormError(null);
    },
    onError: (error) => setFormError(getErrorMessage(error))
  });

  const sortedItems = useMemo(() => {
    const list: WishlistItemDto[] = wishlistQuery.data ?? [];
    const filtered = ownerFilter === "all" || !currentUserId
      ? list
      : list.filter((item) => {
          const ownerId = item.owner?.id;
          if (!ownerId) return false;
          return ownerFilter === "mine" ? ownerId === currentUserId : ownerId !== currentUserId;
        });
    return filtered.slice().sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [currentUserId, ownerFilter, wishlistQuery.data]);

  const openCreateModal = () => {
    setEditingItemId(null);
    setTitleDraft("");
    setDescriptionDraft("");
    setWebUrlDraft("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: WishlistItemDto) => {
    setEditingItemId(item.id);
    setTitleDraft(item.title);
    setDescriptionDraft(item.description ?? "");
    setWebUrlDraft(item.webUrl ?? "");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openDeleteModal = (itemId: string) => {
    setItemIdToDelete(itemId);
    setFormError(null);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async () => {
    const normalizedTitle = titleDraft.trim();
    if (!normalizedTitle) {
      setFormError("El título es obligatorio.");
      return;
    }

    const normalizedWebUrl = webUrlDraft.trim();
    const payload = {
      title: normalizedTitle,
      description: descriptionDraft.trim(),
      webUrl: normalizedWebUrl
    };
    if (editingItemId) {
      await updateItemMutation.mutateAsync({ id: editingItemId, ...payload });
      return;
    }
    await createItemMutation.mutateAsync(payload);
  };

  const handleDelete = async () => {
    if (!itemIdToDelete) return;
    await deleteItemMutation.mutateAsync(itemIdToDelete);
  };

  const isSaving = createItemMutation.isPending || updateItemMutation.isPending;

  return (
    <Screen title="Lista de deseos" subtitle="Listado compartido de regalos">
      <div className="mb-3 flex items-center justify-between gap-3">
        <SectionTitle>Regalos</SectionTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant={ownerFilter === "all" ? "default" : "outline"} onClick={() => setOwnerFilter("all")}>
            Todas
          </Button>
          <Button type="button" size="sm" variant={ownerFilter === "mine" ? "default" : "outline"} onClick={() => setOwnerFilter("mine")}>
            Subidas por mí
          </Button>
          <Button type="button" size="sm" variant={ownerFilter === "partner" ? "default" : "outline"} onClick={() => setOwnerFilter("partner")}>
            Subidas por mi pareja
          </Button>
          <Button type="button" variant="outline" onClick={openCreateModal}>
            Agregar regalo
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        {wishlistQuery.isLoading ? (
          <SurfaceCard>
            <p className="text-sm text-muted-foreground">Cargando regalos...</p>
          </SurfaceCard>
        ) : sortedItems.length === 0 ? (
          <SurfaceCard>
            <p className="text-sm text-muted-foreground">Todavía no hay regalos compartidos.</p>
          </SurfaceCard>
        ) : (
          sortedItems.map((item) => (
            <SurfaceCard key={item.id}>
              <h3 className="text-base">{item.title}</h3>
              {item.description ? (
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              ) : null}
              {item.webUrl ? (
                <a
                  className="mt-2 block text-sm text-primary underline underline-offset-2"
                  href={item.webUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver enlace
                </a>
              ) : null}
              {item.owner?.name ? (
                <p className="mt-2 text-xs text-muted-foreground text-right">
                  Compartido por: {item.owner.name}
                </p>
              ) : null}
              <div className="mt-3 flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => openEditModal(item)}>
                  Editar
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => openDeleteModal(item.id)}>
                  Eliminar
                </Button>
              </div>
            </SurfaceCard>
          ))
        )}
      </div>
      {formError ? <p className="mt-3 text-xs text-destructive">{formError}</p> : null}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItemId ? "Editar regalo" : "Agregar regalo"}</DialogTitle>
            <DialogDescription>
              Este regalo será visible para ambos usuarios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              placeholder="Título del regalo"
            />
            <Textarea
              value={descriptionDraft}
              onChange={(event) => setDescriptionDraft(event.target.value)}
              placeholder="Descripción (opcional)"
            />
            <Input
              value={webUrlDraft}
              onChange={(event) => setWebUrlDraft(event.target.value)}
              placeholder="Enlace web (opcional)"
              type="url"
            />
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar regalo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que quieres eliminar este regalo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteItemMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteItemMutation.isPending}>
              {deleteItemMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Screen>
  );
}
