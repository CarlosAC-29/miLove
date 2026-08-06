import { useEffect, useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import type { ApiError } from "@/services/api/errors";
import { giftsService, type GiftDto } from "@/services/gifts.service";
import { aiService } from "@/services/recommendations/ai.service";
import { useAuthStore } from "@/stores/auth.store";
import { Screen } from "@/shared/ui/Screen";
import { SectionTitle, SurfaceCard } from "@/shared/ui/SurfaceCard";

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

const RECOMMENDATION_MODULE = "gifts" as const;
const CONTEXT_KEY = ["recommendations", "context", RECOMMENDATION_MODULE] as const;
const SUGGESTIONS_KEY = ["recommendations", "suggestions", RECOMMENDATION_MODULE] as const;
const GIFTS_KEY = ["gifts", "items"] as const;

function toLocalDateTimeInputValue(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getInitialGiftDraft() {
  return {
    title: "",
    description: "",
    startAt: toLocalDateTimeInputValue(new Date().toISOString())
  };
}

export function GiftsPage() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [ownerFilter, setOwnerFilter] = useState<"all" | "mine" | "partner">("all");
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [editingGiftId, setEditingGiftId] = useState<string | null>(null);
  const [giftIdsToDelete, setGiftIdsToDelete] = useState<string[]>([]);
  const [selectedGiftIds, setSelectedGiftIds] = useState<string[]>([]);
  const [contextDraft, setContextDraft] = useState("");
  const [contextError, setContextError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [giftError, setGiftError] = useState<string | null>(null);
  const [giftDraft, setGiftDraft] = useState(getInitialGiftDraft);
  const [draftSuggestions, setDraftSuggestions] = useState<
    Awaited<ReturnType<typeof aiService.generateSuggestions>>["suggestions"]
  >([]);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<string[]>([]);

  const contextQuery = useQuery({
    queryKey: CONTEXT_KEY,
    queryFn: () => aiService.getContextState(RECOMMENDATION_MODULE)
  });

  const suggestionsQuery = useQuery({
    queryKey: SUGGESTIONS_KEY,
    queryFn: () => aiService.listSuggestions("all", RECOMMENDATION_MODULE)
  });

  const giftsQuery = useQuery({
    queryKey: GIFTS_KEY,
    queryFn: () => giftsService.listGifts(),
    refetchInterval: 5000
  });

  const saveContextMutation = useMutation({
    mutationFn: (context: string) => aiService.upsertContext({ context, module: RECOMMENDATION_MODULE }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CONTEXT_KEY });
      setIsContextModalOpen(false);
      setContextError(null);
    },
    onError: (error) => setContextError(getErrorMessage(error))
  });

  const generateMutation = useMutation({
    mutationFn: () => aiService.generateSuggestions({ category: "gift", module: RECOMMENDATION_MODULE }),
    onSuccess: async (result) => {
      setDraftSuggestions(result.suggestions);
      setSelectedSuggestionIds([]);
      setIsSuggestionsModalOpen(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CONTEXT_KEY }),
        queryClient.invalidateQueries({ queryKey: SUGGESTIONS_KEY })
      ]);
      setActionError(null);
    },
    onError: (error) => setActionError(getErrorMessage(error))
  });

  const acceptSuggestionsMutation = useMutation({
    mutationFn: (suggestionIds: string[]) => aiService.acceptSuggestions({ suggestionIds }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CONTEXT_KEY }),
        queryClient.invalidateQueries({ queryKey: SUGGESTIONS_KEY }),
        queryClient.invalidateQueries({ queryKey: GIFTS_KEY })
      ]);
      setActionError(null);
    },
    onError: (error) => setActionError(getErrorMessage(error))
  });

  const createGiftMutation = useMutation({
    mutationFn: (payload: { title: string; description: string; startAt: string }) =>
      giftsService.createGift(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: GIFTS_KEY });
      setIsGiftModalOpen(false);
      setEditingGiftId(null);
      setGiftDraft(getInitialGiftDraft());
      setGiftError(null);
    },
    onError: (error) => setGiftError(getErrorMessage(error))
  });

  const updateGiftMutation = useMutation({
    mutationFn: ({ id, ...input }: { id: string; title: string; description: string; startAt: string }) =>
      giftsService.updateGift(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: GIFTS_KEY });
      setIsGiftModalOpen(false);
      setEditingGiftId(null);
      setGiftDraft(getInitialGiftDraft());
      setGiftError(null);
    },
    onError: (error) => setGiftError(getErrorMessage(error))
  });

  const deleteGiftsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await giftsService.deleteGift(id);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: GIFTS_KEY });
      setSelectedGiftIds((current) =>
        current.filter((id) => !giftIdsToDelete.includes(id))
      );
      setGiftIdsToDelete([]);
      setIsDeleteConfirmModalOpen(false);
      setGiftError(null);
    },
    onError: (error) => setGiftError(getErrorMessage(error))
  });

  const deleteFromDraft = (suggestionId: string) => {
    setDraftSuggestions((current) =>
      current.filter((suggestion) => suggestion.id !== suggestionId)
    );
    setSelectedSuggestionIds((current) => current.filter((id) => id !== suggestionId));
  };

  const saveSuggestion = async (suggestionId: string) => {
    await acceptSuggestionsMutation.mutateAsync([suggestionId]);
    deleteFromDraft(suggestionId);
  };

  const toggleSelected = (suggestionId: string) => {
    setSelectedSuggestionIds((current) =>
      current.includes(suggestionId)
        ? current.filter((id) => id !== suggestionId)
        : [...current, suggestionId]
    );
  };

  useEffect(() => {
    const existingContext = contextQuery.data?.context?.context ?? "";
    setContextDraft(existingContext);
  }, [contextQuery.data?.context?.context]);

  const upcomingGifts = useMemo(() => {
    const list: GiftDto[] = giftsQuery.data ?? [];
    return list.slice().sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [giftsQuery.data]);

  const filteredGifts = useMemo(() => {
    if (ownerFilter === "all") return upcomingGifts;
    if (!currentUserId) return upcomingGifts;
    return upcomingGifts.filter((item) => {
      const ownerId = item.owner?.id;
      if (!ownerId) return false;
      return ownerFilter === "mine" ? ownerId === currentUserId : ownerId !== currentUserId;
    });
  }, [currentUserId, ownerFilter, upcomingGifts]);

  useEffect(() => {
    const availableIds = new Set(filteredGifts.map((item) => item.id));
    setSelectedGiftIds((current) => current.filter((id) => availableIds.has(id)));
  }, [filteredGifts]);

  const openCreateGiftModal = () => {
    setEditingGiftId(null);
    setGiftDraft(getInitialGiftDraft());
    setGiftError(null);
    setIsGiftModalOpen(true);
  };

  const openEditGiftModal = (gift: GiftDto) => {
    setEditingGiftId(gift.id);
    setGiftDraft({
      title: gift.title,
      description: gift.description ?? "",
      startAt: toLocalDateTimeInputValue(gift.startAt)
    });
    setGiftError(null);
    setIsGiftModalOpen(true);
  };

  const handleSaveGift = async () => {
    const normalizedTitle = giftDraft.title.trim();
    if (normalizedTitle.length === 0) {
      setGiftError("El título es obligatorio.");
      return;
    }

    if (!giftDraft.startAt) {
      setGiftError("La fecha y hora son obligatorias.");
      return;
    }

    const parsedDate = new Date(giftDraft.startAt);
    if (Number.isNaN(parsedDate.getTime())) {
      setGiftError("La fecha y hora no son válidas.");
      return;
    }

    const payload = {
      title: normalizedTitle,
      description: giftDraft.description.trim(),
      startAt: parsedDate.toISOString()
    };

    if (editingGiftId) {
      await updateGiftMutation.mutateAsync({ id: editingGiftId, ...payload });
      return;
    }

    await createGiftMutation.mutateAsync(payload);
  };

  const toggleGiftSelected = (giftId: string) => {
    setSelectedGiftIds((current) =>
      current.includes(giftId)
        ? current.filter((id) => id !== giftId)
        : [...current, giftId]
    );
  };

  const openDeleteModal = (ids: string[]) => {
    if (ids.length === 0) return;
    setGiftError(null);
    setGiftIdsToDelete(ids);
    setIsDeleteConfirmModalOpen(true);
  };

  const handleConfirmDeleteGifts = async () => {
    if (giftIdsToDelete.length === 0) return;
    await deleteGiftsMutation.mutateAsync(giftIdsToDelete);
  };

  const isSavingGift = createGiftMutation.isPending || updateGiftMutation.isPending;
  const allGiftsSelected =
    filteredGifts.length > 0 && selectedGiftIds.length === filteredGifts.length;

  const handleSaveContext = async () => {
    const normalized = contextDraft.trim();
    if (normalized.length < 10) {
      setContextError("El contexto debe tener al menos 10 caracteres.");
      return;
    }
    setContextError(null);
    await saveContextMutation.mutateAsync(normalized);
  };

  return (
    <Screen title="Regalos" subtitle="Sugerencias personalizadas para sorprenderse">
      <SurfaceCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg">Contexto de regalos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Describe gustos, presupuesto, fechas especiales y preferencias de detalle.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsContextModalOpen(true)}
            disabled={contextQuery.isPending}
          >
            {contextQuery.data?.context ? "Editar contexto" : "Agregar contexto"}
          </Button>
        </div>

        <div className="mt-3 rounded-xl bg-surface p-3 text-sm">
          {contextQuery.data?.context?.context ? (
            contextQuery.data.context.context
          ) : (
            <span className="text-muted-foreground">Aún no hay contexto guardado.</span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button
            type="button"
            onClick={() => generateMutation.mutateAsync()}
            disabled={!contextQuery.data?.context || generateMutation.isPending}
          >
            {generateMutation.isPending ? "Generando..." : "Generar opciones"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Pendientes: {contextQuery.data?.suggestions.pending ?? 0} · Aceptadas:{" "}
            {contextQuery.data?.suggestions.accepted ?? 0}
          </p>
        </div>
        {actionError ? <p className="mt-3 text-xs text-destructive">{actionError}</p> : null}
      </SurfaceCard>

      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Button type="button" size="sm" variant={ownerFilter === "all" ? "default" : "outline"} onClick={() => setOwnerFilter("all")}>
            Todas
          </Button>
          <Button type="button" size="sm" variant={ownerFilter === "mine" ? "default" : "outline"} onClick={() => setOwnerFilter("mine")}>
            Subidas por mí
          </Button>
          <Button type="button" size="sm" variant={ownerFilter === "partner" ? "default" : "outline"} onClick={() => setOwnerFilter("partner")}>
            Subidas por mi pareja
          </Button>
        </div>
        <SectionTitle>Próximos regalos</SectionTitle>
        <div className="space-y-3">
          {giftsQuery.isLoading ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">Cargando regalos...</p>
            </SurfaceCard>
          ) : filteredGifts.length === 0 ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">No hay regalos próximos.</p>
            </SurfaceCard>
          ) : (
            filteredGifts.map((gift) => (
              <SurfaceCard key={gift.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="mt-1 text-base">{gift.title}</h3>
                    {gift.description ? (
                      <p className="mt-2 text-sm text-muted-foreground">{gift.description}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(gift.startAt).toLocaleString()}{" "}
                      {gift.endAt ? `· ${new Date(gift.endAt).toLocaleString()}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{gift.owner?.name ?? "Pareja"}</div>
                  </div>
                </div>
              </SurfaceCard>
            ))
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <SectionTitle>Opciones aceptadas</SectionTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={openCreateGiftModal}>
              Agregar regalo manual
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setSelectedGiftIds(
                  allGiftsSelected ? [] : filteredGifts.map((item) => item.id)
                )
              }
              disabled={filteredGifts.length === 0}
            >
              {allGiftsSelected ? "Limpiar selección" : "Seleccionar todo"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => openDeleteModal(selectedGiftIds)}
              disabled={selectedGiftIds.length === 0}
            >
              Eliminar seleccionadas ({selectedGiftIds.length})
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          {giftsQuery.isLoading ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">Cargando opciones aceptadas...</p>
            </SurfaceCard>
          ) : filteredGifts.length === 0 ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">Todavía no hay regalos aceptados compartidos.</p>
            </SurfaceCard>
          ) : (
            filteredGifts.map((item) => (
              <SurfaceCard key={item.id}>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedGiftIds.includes(item.id)}
                    onCheckedChange={() => toggleGiftSelected(item.id)}
                    aria-label={`Seleccionar regalo ${item.title}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Regalo
                    </p>
                    <h3 className="mt-1 text-base">{item.title}</h3>
                    {item.description ? (
                      <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(item.startAt).toLocaleString()}
                    </p>
                    {item.owner?.name ? (
                      <p className="mt-2 text-xs text-muted-foreground text-right">Compartido por: {item.owner.name}</p>
                    ) : null}
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openEditGiftModal(item)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteModal([item.id])}
                        disabled={deleteGiftsMutation.isPending}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            ))
          )}
        </div>
        {giftError ? <p className="mt-3 text-xs text-destructive">{giftError}</p> : null}
      </div>

      <Dialog
        open={isContextModalOpen}
        onOpenChange={setIsContextModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {contextQuery.data?.context ? "Editar contexto" : "Agregar contexto de regalos"}
            </DialogTitle>
            <DialogDescription>
              Incluye gustos, presupuesto, marcas favoritas y ocasión para recibir mejores
              sugerencias.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={contextDraft}
            onChange={(event) => setContextDraft(event.target.value)}
            className="min-h-32"
            placeholder="Ejemplo: Le gustan los detalles personalizados, presupuesto de 120.000 COP, aniversario en noviembre..."
          />
          {contextError ? <p className="text-xs text-destructive">{contextError}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              onClick={handleSaveContext}
              disabled={saveContextMutation.isPending}
            >
              {saveContextMutation.isPending ? "Guardando..." : "Guardar contexto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isGiftModalOpen}
        onOpenChange={(open) => {
          setIsGiftModalOpen(open);
          if (!open) {
            setEditingGiftId(null);
            setGiftError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGiftId ? "Editar regalo aceptado" : "Agregar regalo manual"}
            </DialogTitle>
            <DialogDescription>
              Registra o ajusta un regalo aceptado para que ambos lo tengan visible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="gift-title">Título</Label>
              <Input
                id="gift-title"
                value={giftDraft.title}
                onChange={(event) =>
                  setGiftDraft((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Ejemplo: Perfume favorito"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gift-startAt">Fecha y hora</Label>
              <Input
                id="gift-startAt"
                type="datetime-local"
                value={giftDraft.startAt}
                onChange={(event) =>
                  setGiftDraft((current) => ({ ...current, startAt: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gift-description">Descripción</Label>
              <Textarea
                id="gift-description"
                value={giftDraft.description}
                onChange={(event) =>
                  setGiftDraft((current) => ({
                    ...current,
                    description: event.target.value
                  }))
                }
                placeholder="Detalles opcionales del regalo..."
              />
            </div>
          </div>

          {giftError ? <p className="text-xs text-destructive">{giftError}</p> : null}

          <DialogFooter>
            <Button
              type="button"
              onClick={handleSaveGift}
              disabled={isSavingGift}
            >
              {isSavingGift ? "Guardando..." : "Guardar regalo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteConfirmModalOpen} onOpenChange={setIsDeleteConfirmModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              {giftIdsToDelete.length === 1
                ? "¿Seguro que quieres eliminar este regalo aceptado?"
                : `¿Seguro que quieres eliminar ${giftIdsToDelete.length} regalos aceptados?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteGiftsMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteGifts}
              disabled={deleteGiftsMutation.isPending}
            >
              {deleteGiftsMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={isSuggestionsModalOpen}
        onOpenChange={(open) => setIsSuggestionsModalOpen(open)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Opciones generadas</DialogTitle>
            <DialogDescription>
              Selecciona cuáles quieres guardar o elimina las que no te interesen.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {draftSuggestions.length === 0 ? (
              <SurfaceCard>
                <p className="text-sm text-muted-foreground">No se generaron opciones.</p>
              </SurfaceCard>
            ) : (
              draftSuggestions.map((suggestion) => {
                const selected = selectedSuggestionIds.includes(suggestion.id);
                return (
                  <SurfaceCard key={suggestion.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                          {suggestion.category}
                        </p>
                        <h3 className="mt-1 text-base">{suggestion.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{suggestion.message}</p>
                      </div>
                      <Button
                        type="button"
                        variant={selected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleSelected(suggestion.id)}
                      >
                        {selected ? "Seleccionada" : "Marcar"}
                      </Button>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button type="button" size="sm" onClick={() => toggleSelected(suggestion.id)}>
                        {selected ? "Quitar selección" : "Seleccionar"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => saveSuggestion(suggestion.id)}
                        disabled={acceptSuggestionsMutation.isPending}
                      >
                        Guardar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteFromDraft(suggestion.id)}
                      >
                        Borrar
                      </Button>
                    </div>
                  </SurfaceCard>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSuggestionsModalOpen(false)}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={async () => {
                const idsToSave =
                  selectedSuggestionIds.length > 0
                    ? selectedSuggestionIds
                    : draftSuggestions.map((suggestion) => suggestion.id);
                if (idsToSave.length === 0) {
                  setIsSuggestionsModalOpen(false);
                  return;
                }
                await acceptSuggestionsMutation.mutateAsync(idsToSave);
                setDraftSuggestions((current) =>
                  current.filter((suggestion) => !idsToSave.includes(suggestion.id))
                );
                setSelectedSuggestionIds([]);
                setIsSuggestionsModalOpen(false);
              }}
              disabled={acceptSuggestionsMutation.isPending || draftSuggestions.length === 0}
            >
              Guardar seleccionadas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Screen>
  );
}
