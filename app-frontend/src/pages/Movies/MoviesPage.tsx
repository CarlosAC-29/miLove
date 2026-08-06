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
import { moviesService, type MovieDto } from "@/services/movies.service";
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

const RECOMMENDATION_MODULE = "movies" as const;
const CONTEXT_KEY = ["recommendations", "context", RECOMMENDATION_MODULE] as const;
const SUGGESTIONS_KEY = ["recommendations", "suggestions", RECOMMENDATION_MODULE] as const;
const MOVIES_KEY = ["movies", "items"] as const;

function toLocalDateTimeInputValue(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getInitialMovieDraft() {
  return {
    title: "",
    description: "",
    startAt: toLocalDateTimeInputValue(new Date().toISOString())
  };
}

export function MoviesPage() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [ownerFilter, setOwnerFilter] = useState<"all" | "mine" | "partner">("all");
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [isMovieModalOpen, setIsMovieModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);
  const [movieIdsToDelete, setMovieIdsToDelete] = useState<string[]>([]);
  const [selectedMovieIds, setSelectedMovieIds] = useState<string[]>([]);
  const [contextDraft, setContextDraft] = useState("");
  const [contextError, setContextError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [movieError, setMovieError] = useState<string | null>(null);
  const [movieDraft, setMovieDraft] = useState(getInitialMovieDraft);
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

  const moviesQuery = useQuery({
    queryKey: MOVIES_KEY,
    queryFn: () => moviesService.listMovies(),
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
    mutationFn: () => aiService.generateSuggestions({ category: "activity", module: RECOMMENDATION_MODULE }),
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
        queryClient.invalidateQueries({ queryKey: MOVIES_KEY })
      ]);
      setActionError(null);
    },
    onError: (error) => setActionError(getErrorMessage(error))
  });

  const createMovieMutation = useMutation({
    mutationFn: (payload: { title: string; description: string; startAt: string }) =>
      moviesService.createMovie(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MOVIES_KEY });
      setIsMovieModalOpen(false);
      setEditingMovieId(null);
      setMovieDraft(getInitialMovieDraft());
      setMovieError(null);
    },
    onError: (error) => setMovieError(getErrorMessage(error))
  });

  const updateMovieMutation = useMutation({
    mutationFn: ({ id, ...input }: { id: string; title: string; description: string; startAt: string }) =>
      moviesService.updateMovie(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MOVIES_KEY });
      setIsMovieModalOpen(false);
      setEditingMovieId(null);
      setMovieDraft(getInitialMovieDraft());
      setMovieError(null);
    },
    onError: (error) => setMovieError(getErrorMessage(error))
  });

  const deleteMoviesMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await moviesService.deleteMovie(id);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MOVIES_KEY });
      setSelectedMovieIds((current) =>
        current.filter((id) => !movieIdsToDelete.includes(id))
      );
      setMovieIdsToDelete([]);
      setIsDeleteConfirmModalOpen(false);
      setMovieError(null);
    },
    onError: (error) => setMovieError(getErrorMessage(error))
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

  const upcomingMovies = useMemo(() => {
    const list: MovieDto[] = moviesQuery.data ?? [];
    return list.slice().sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [moviesQuery.data]);

  const filteredMovies = useMemo(() => {
    if (ownerFilter === "all") return upcomingMovies;
    if (!currentUserId) return upcomingMovies;
    return upcomingMovies.filter((item) => {
      const ownerId = item.owner?.id;
      if (!ownerId) return false;
      return ownerFilter === "mine" ? ownerId === currentUserId : ownerId !== currentUserId;
    });
  }, [currentUserId, ownerFilter, upcomingMovies]);

  useEffect(() => {
    const availableIds = new Set(filteredMovies.map((item) => item.id));
    setSelectedMovieIds((current) => current.filter((id) => availableIds.has(id)));
  }, [filteredMovies]);

  const openCreateMovieModal = () => {
    setEditingMovieId(null);
    setMovieDraft(getInitialMovieDraft());
    setMovieError(null);
    setIsMovieModalOpen(true);
  };

  const openEditMovieModal = (movie: MovieDto) => {
    setEditingMovieId(movie.id);
    setMovieDraft({
      title: movie.title,
      description: movie.description ?? "",
      startAt: toLocalDateTimeInputValue(movie.startAt)
    });
    setMovieError(null);
    setIsMovieModalOpen(true);
  };

  const handleSaveMovie = async () => {
    const normalizedTitle = movieDraft.title.trim();
    if (normalizedTitle.length === 0) {
      setMovieError("El título es obligatorio.");
      return;
    }

    if (!movieDraft.startAt) {
      setMovieError("La fecha y hora son obligatorias.");
      return;
    }

    const parsedDate = new Date(movieDraft.startAt);
    if (Number.isNaN(parsedDate.getTime())) {
      setMovieError("La fecha y hora no son válidas.");
      return;
    }

    const payload = {
      title: normalizedTitle,
      description: movieDraft.description.trim(),
      startAt: parsedDate.toISOString()
    };

    if (editingMovieId) {
      await updateMovieMutation.mutateAsync({ id: editingMovieId, ...payload });
      return;
    }

    await createMovieMutation.mutateAsync(payload);
  };

  const toggleMovieSelected = (movieId: string) => {
    setSelectedMovieIds((current) =>
      current.includes(movieId)
        ? current.filter((id) => id !== movieId)
        : [...current, movieId]
    );
  };

  const openDeleteModal = (ids: string[]) => {
    if (ids.length === 0) return;
    setMovieError(null);
    setMovieIdsToDelete(ids);
    setIsDeleteConfirmModalOpen(true);
  };

  const handleConfirmDeleteMovies = async () => {
    if (movieIdsToDelete.length === 0) return;
    await deleteMoviesMutation.mutateAsync(movieIdsToDelete);
  };

  const isSavingMovie = createMovieMutation.isPending || updateMovieMutation.isPending;
  const allMoviesSelected =
    filteredMovies.length > 0 && selectedMovieIds.length === filteredMovies.length;

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
    <Screen title="Películas" subtitle="Sugerencias personalizadas para sus planes de cine">
      <SurfaceCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg">Contexto de películas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Describe géneros favoritos, presupuesto y tipo de plan de película.
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
        <SectionTitle>Próximas películas</SectionTitle>
        <div className="space-y-3">
          {moviesQuery.isLoading ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">Cargando películas...</p>
            </SurfaceCard>
          ) : filteredMovies.length === 0 ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">No hay películas próximas.</p>
            </SurfaceCard>
          ) : (
            filteredMovies.map((movie) => (
              <SurfaceCard key={movie.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="mt-1 text-base">{movie.title}</h3>
                    {movie.description ? (
                      <p className="mt-2 text-sm text-muted-foreground">{movie.description}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(movie.startAt).toLocaleString()}{" "}
                      {movie.endAt ? `· ${new Date(movie.endAt).toLocaleString()}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{movie.owner?.name ?? "Pareja"}</div>
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
            <Button type="button" variant="outline" onClick={openCreateMovieModal}>
              Agregar película manual
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setSelectedMovieIds(
                  allMoviesSelected ? [] : filteredMovies.map((item) => item.id)
                )
              }
              disabled={filteredMovies.length === 0}
            >
              {allMoviesSelected ? "Limpiar selección" : "Seleccionar todo"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => openDeleteModal(selectedMovieIds)}
              disabled={selectedMovieIds.length === 0}
            >
              Eliminar seleccionadas ({selectedMovieIds.length})
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          {moviesQuery.isLoading ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">Cargando opciones aceptadas...</p>
            </SurfaceCard>
          ) : filteredMovies.length === 0 ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">Todavía no hay películas aceptadas compartidas.</p>
            </SurfaceCard>
          ) : (
            filteredMovies.map((item) => (
              <SurfaceCard key={item.id}>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedMovieIds.includes(item.id)}
                    onCheckedChange={() => toggleMovieSelected(item.id)}
                    aria-label={`Seleccionar película ${item.title}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Película
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
                        onClick={() => openEditMovieModal(item)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteModal([item.id])}
                        disabled={deleteMoviesMutation.isPending}
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
        {movieError ? <p className="mt-3 text-xs text-destructive">{movieError}</p> : null}
      </div>

      <Dialog
        open={isContextModalOpen}
        onOpenChange={setIsContextModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {contextQuery.data?.context ? "Editar contexto" : "Agregar contexto de películas"}
            </DialogTitle>
            <DialogDescription>
              Incluye géneros, tipo de plan y presupuesto para recibir mejores sugerencias.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={contextDraft}
            onChange={(event) => setContextDraft(event.target.value)}
            className="min-h-32"
            placeholder="Ejemplo: Nos gustan comedias románticas, plan en casa, presupuesto de snacks 60.000 COP..."
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
        open={isMovieModalOpen}
        onOpenChange={(open) => {
          setIsMovieModalOpen(open);
          if (!open) {
            setEditingMovieId(null);
            setMovieError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMovieId ? "Editar película aceptada" : "Agregar película manual"}
            </DialogTitle>
            <DialogDescription>
              Registra o ajusta una película aceptada para que ambos la tengan visible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="movie-title">Título</Label>
              <Input
                id="movie-title"
                value={movieDraft.title}
                onChange={(event) =>
                  setMovieDraft((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Ejemplo: La La Land"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="movie-startAt">Fecha y hora</Label>
              <Input
                id="movie-startAt"
                type="datetime-local"
                value={movieDraft.startAt}
                onChange={(event) =>
                  setMovieDraft((current) => ({ ...current, startAt: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="movie-description">Descripción</Label>
              <Textarea
                id="movie-description"
                value={movieDraft.description}
                onChange={(event) =>
                  setMovieDraft((current) => ({
                    ...current,
                    description: event.target.value
                  }))
                }
                placeholder="Detalles opcionales de la película..."
              />
            </div>
          </div>

          {movieError ? <p className="text-xs text-destructive">{movieError}</p> : null}

          <DialogFooter>
            <Button
              type="button"
              onClick={handleSaveMovie}
              disabled={isSavingMovie}
            >
              {isSavingMovie ? "Guardando..." : "Guardar película"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteConfirmModalOpen} onOpenChange={setIsDeleteConfirmModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              {movieIdsToDelete.length === 1
                ? "¿Seguro que quieres eliminar esta película aceptada?"
                : `¿Seguro que quieres eliminar ${movieIdsToDelete.length} películas aceptadas?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMoviesMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteMovies}
              disabled={deleteMoviesMutation.isPending}
            >
              {deleteMoviesMutation.isPending ? "Eliminando..." : "Eliminar"}
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
