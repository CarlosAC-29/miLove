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
import { aiService } from "@/services/recommendations/ai.service";
import { restaurantsService, type RestaurantDto } from "@/services/restaurants.service";
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

const CONTEXT_KEY = ["recommendations", "context"] as const;
const SUGGESTIONS_KEY = ["recommendations", "suggestions"] as const;
const RESTAURANTS_KEY = ["restaurants", "items"] as const;

function toLocalDateTimeInputValue(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getInitialRestaurantDraft() {
  return {
    title: "",
    description: "",
    startAt: toLocalDateTimeInputValue(new Date().toISOString())
  };
}

export function RestaurantsPage() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [ownerFilter, setOwnerFilter] = useState<"all" | "mine" | "partner">("all");
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null);
  const [restaurantIdsToDelete, setRestaurantIdsToDelete] = useState<string[]>([]);
  const [selectedRestaurantIds, setSelectedRestaurantIds] = useState<string[]>([]);
  const [contextDraft, setContextDraft] = useState("");
  const [contextError, setContextError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [restaurantError, setRestaurantError] = useState<string | null>(null);
  const [restaurantDraft, setRestaurantDraft] = useState(getInitialRestaurantDraft);
  const [draftSuggestions, setDraftSuggestions] = useState<
    Awaited<ReturnType<typeof aiService.generateSuggestions>>["suggestions"]
  >([]);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<string[]>([]);

  const contextQuery = useQuery({
    queryKey: CONTEXT_KEY,
    queryFn: () => aiService.getContextState()
  });

  const suggestionsQuery = useQuery({
    queryKey: SUGGESTIONS_KEY,
    queryFn: () => aiService.listSuggestions("all")
  });

  const restaurantsQuery = useQuery({
    queryKey: RESTAURANTS_KEY,
    queryFn: () => restaurantsService.listRestaurants(),
    refetchInterval: 5000
  });

  const saveContextMutation = useMutation({
    mutationFn: (context: string) => aiService.upsertContext({ context }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CONTEXT_KEY });
      setIsContextModalOpen(false);
      setContextError(null);
    },
    onError: (error) => setContextError(getErrorMessage(error))
  });

  const generateMutation = useMutation({
    mutationFn: () => aiService.generateSuggestions({ category: "restaurant" }),
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
        queryClient.invalidateQueries({ queryKey: RESTAURANTS_KEY })
      ]);
      setActionError(null);
    },
    onError: (error) => setActionError(getErrorMessage(error))
  });

  const createRestaurantMutation = useMutation({
    mutationFn: (payload: { title: string; description: string; startAt: string }) =>
      restaurantsService.createRestaurant(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: RESTAURANTS_KEY });
      setIsRestaurantModalOpen(false);
      setEditingRestaurantId(null);
      setRestaurantDraft(getInitialRestaurantDraft());
      setRestaurantError(null);
    },
    onError: (error) => setRestaurantError(getErrorMessage(error))
  });

  const updateRestaurantMutation = useMutation({
    mutationFn: ({ id, ...input }: { id: string; title: string; description: string; startAt: string }) =>
      restaurantsService.updateRestaurant(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: RESTAURANTS_KEY });
      setIsRestaurantModalOpen(false);
      setEditingRestaurantId(null);
      setRestaurantDraft(getInitialRestaurantDraft());
      setRestaurantError(null);
    },
    onError: (error) => setRestaurantError(getErrorMessage(error))
  });

  const deleteRestaurantsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await restaurantsService.deleteRestaurant(id);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: RESTAURANTS_KEY });
      setSelectedRestaurantIds((current) =>
        current.filter((id) => !restaurantIdsToDelete.includes(id))
      );
      setRestaurantIdsToDelete([]);
      setIsDeleteConfirmModalOpen(false);
      setRestaurantError(null);
    },
    onError: (error) => setRestaurantError(getErrorMessage(error))
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

  useEffect(() => {
    if (contextQuery.isPending) return;
    if (!contextQuery.data?.context) {
      setIsContextModalOpen(true);
    }
  }, [contextQuery.data?.context, contextQuery.isPending]);

  const upcomingRestaurants = useMemo(() => {
    const list: RestaurantDto[] = restaurantsQuery.data ?? [];
    return list.slice().sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [restaurantsQuery.data]);

  const filteredRestaurants = useMemo(() => {
    if (ownerFilter === "all") return upcomingRestaurants;
    if (!currentUserId) return upcomingRestaurants;
    return upcomingRestaurants.filter((item) => {
      const ownerId = item.owner?.id;
      if (!ownerId) return false;
      return ownerFilter === "mine" ? ownerId === currentUserId : ownerId !== currentUserId;
    });
  }, [currentUserId, ownerFilter, upcomingRestaurants]);

  useEffect(() => {
    const availableIds = new Set(filteredRestaurants.map((item) => item.id));
    setSelectedRestaurantIds((current) => current.filter((id) => availableIds.has(id)));
  }, [filteredRestaurants]);

  const openCreateRestaurantModal = () => {
    setEditingRestaurantId(null);
    setRestaurantDraft(getInitialRestaurantDraft());
    setRestaurantError(null);
    setIsRestaurantModalOpen(true);
  };

  const openEditRestaurantModal = (restaurant: RestaurantDto) => {
    setEditingRestaurantId(restaurant.id);
    setRestaurantDraft({
      title: restaurant.title,
      description: restaurant.description ?? "",
      startAt: toLocalDateTimeInputValue(restaurant.startAt)
    });
    setRestaurantError(null);
    setIsRestaurantModalOpen(true);
  };

  const handleSaveRestaurant = async () => {
    const normalizedTitle = restaurantDraft.title.trim();
    if (normalizedTitle.length === 0) {
      setRestaurantError("El título es obligatorio.");
      return;
    }

    if (!restaurantDraft.startAt) {
      setRestaurantError("La fecha y hora son obligatorias.");
      return;
    }

    const parsedDate = new Date(restaurantDraft.startAt);
    if (Number.isNaN(parsedDate.getTime())) {
      setRestaurantError("La fecha y hora no son válidas.");
      return;
    }

    const payload = {
      title: normalizedTitle,
      description: restaurantDraft.description.trim(),
      startAt: parsedDate.toISOString()
    };

    if (editingRestaurantId) {
      await updateRestaurantMutation.mutateAsync({ id: editingRestaurantId, ...payload });
      return;
    }

    await createRestaurantMutation.mutateAsync(payload);
  };

  const toggleRestaurantSelected = (restaurantId: string) => {
    setSelectedRestaurantIds((current) =>
      current.includes(restaurantId)
        ? current.filter((id) => id !== restaurantId)
        : [...current, restaurantId]
    );
  };

  const openDeleteModal = (ids: string[]) => {
    if (ids.length === 0) return;
    setRestaurantError(null);
    setRestaurantIdsToDelete(ids);
    setIsDeleteConfirmModalOpen(true);
  };

  const handleConfirmDeleteRestaurants = async () => {
    if (restaurantIdsToDelete.length === 0) return;
    await deleteRestaurantsMutation.mutateAsync(restaurantIdsToDelete);
  };

  const isSavingRestaurant = createRestaurantMutation.isPending || updateRestaurantMutation.isPending;
  const allRestaurantsSelected =
    filteredRestaurants.length > 0 && selectedRestaurantIds.length === filteredRestaurants.length;

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
    <Screen title="Restaurantes" subtitle="Sugerencias personalizadas para sus salidas">
      <SurfaceCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg">Contexto de restaurantes</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Describe gustos gastronómicos, presupuesto y tipo de ambiente que prefieren.
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
        <SectionTitle>Próximos restaurantes</SectionTitle>
        <div className="space-y-3">
          {restaurantsQuery.isLoading ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">Cargando restaurantes...</p>
            </SurfaceCard>
          ) : filteredRestaurants.length === 0 ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">No hay restaurantes próximos.</p>
            </SurfaceCard>
          ) : (
            filteredRestaurants.map((restaurant) => (
              <SurfaceCard key={restaurant.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="mt-1 text-base">{restaurant.title}</h3>
                    {restaurant.description ? (
                      <p className="mt-2 text-sm text-muted-foreground">{restaurant.description}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(restaurant.startAt).toLocaleString()}{" "}
                      {restaurant.endAt ? `· ${new Date(restaurant.endAt).toLocaleString()}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{restaurant.owner?.name ?? "Pareja"}</div>
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
            <Button type="button" variant="outline" onClick={openCreateRestaurantModal}>
              Agregar restaurante manual
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setSelectedRestaurantIds(
                  allRestaurantsSelected ? [] : filteredRestaurants.map((item) => item.id)
                )
              }
              disabled={filteredRestaurants.length === 0}
            >
              {allRestaurantsSelected ? "Limpiar selección" : "Seleccionar todo"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => openDeleteModal(selectedRestaurantIds)}
              disabled={selectedRestaurantIds.length === 0}
            >
              Eliminar seleccionadas ({selectedRestaurantIds.length})
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          {restaurantsQuery.isLoading ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">Cargando opciones aceptadas...</p>
            </SurfaceCard>
          ) : filteredRestaurants.length === 0 ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">Todavía no hay restaurantes aceptados compartidos.</p>
            </SurfaceCard>
          ) : (
            filteredRestaurants.map((item) => (
              <SurfaceCard key={item.id}>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedRestaurantIds.includes(item.id)}
                    onCheckedChange={() => toggleRestaurantSelected(item.id)}
                    aria-label={`Seleccionar restaurante ${item.title}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Restaurante
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
                        onClick={() => openEditRestaurantModal(item)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteModal([item.id])}
                        disabled={deleteRestaurantsMutation.isPending}
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
        {restaurantError ? <p className="mt-3 text-xs text-destructive">{restaurantError}</p> : null}
      </div>

      <Dialog
        open={isContextModalOpen}
        onOpenChange={(open) => {
          if (!open && !contextQuery.data?.context) return;
          setIsContextModalOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {contextQuery.data?.context ? "Editar contexto" : "Agregar contexto de restaurantes"}
            </DialogTitle>
            <DialogDescription>
              Incluye cocina favorita, presupuesto y ambiente para recibir mejores sugerencias.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={contextDraft}
            onChange={(event) => setContextDraft(event.target.value)}
            className="min-h-32"
            placeholder="Ejemplo: Nos gusta comida italiana, presupuesto de 180.000 COP por salida, ambiente tranquilo..."
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
        open={isRestaurantModalOpen}
        onOpenChange={(open) => {
          setIsRestaurantModalOpen(open);
          if (!open) {
            setEditingRestaurantId(null);
            setRestaurantError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRestaurantId ? "Editar restaurante aceptado" : "Agregar restaurante manual"}
            </DialogTitle>
            <DialogDescription>
              Registra o ajusta un restaurante aceptado para que ambos lo tengan visible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="restaurant-title">Título</Label>
              <Input
                id="restaurant-title"
                value={restaurantDraft.title}
                onChange={(event) =>
                  setRestaurantDraft((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Ejemplo: Trattoria del Parque"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurant-startAt">Fecha y hora</Label>
              <Input
                id="restaurant-startAt"
                type="datetime-local"
                value={restaurantDraft.startAt}
                onChange={(event) =>
                  setRestaurantDraft((current) => ({ ...current, startAt: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurant-description">Descripción</Label>
              <Textarea
                id="restaurant-description"
                value={restaurantDraft.description}
                onChange={(event) =>
                  setRestaurantDraft((current) => ({
                    ...current,
                    description: event.target.value
                  }))
                }
                placeholder="Detalles opcionales del restaurante..."
              />
            </div>
          </div>

          {restaurantError ? <p className="text-xs text-destructive">{restaurantError}</p> : null}

          <DialogFooter>
            <Button
              type="button"
              onClick={handleSaveRestaurant}
              disabled={isSavingRestaurant}
            >
              {isSavingRestaurant ? "Guardando..." : "Guardar restaurante"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteConfirmModalOpen} onOpenChange={setIsDeleteConfirmModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              {restaurantIdsToDelete.length === 1
                ? "¿Seguro que quieres eliminar este restaurante aceptado?"
                : `¿Seguro que quieres eliminar ${restaurantIdsToDelete.length} restaurantes aceptados?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRestaurantsMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteRestaurants}
              disabled={deleteRestaurantsMutation.isPending}
            >
              {deleteRestaurantsMutation.isPending ? "Eliminando..." : "Eliminar"}
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
