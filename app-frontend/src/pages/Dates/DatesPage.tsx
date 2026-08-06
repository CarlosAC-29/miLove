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
import { datesService, type AppointmentDto } from "@/services/dates.service";
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

const RECOMMENDATION_MODULE = "dates" as const;
const CONTEXT_KEY = ["recommendations", "context", RECOMMENDATION_MODULE] as const;
const SUGGESTIONS_KEY = ["recommendations", "suggestions", RECOMMENDATION_MODULE] as const;
const APPOINTMENTS_KEY = ["dates", "appointments"] as const;

function toLocalDateTimeInputValue(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getInitialAppointmentDraft() {
  return {
    title: "",
    description: "",
    startAt: toLocalDateTimeInputValue(new Date().toISOString())
  };
}

export function DatesPage() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [ownerFilter, setOwnerFilter] = useState<"all" | "mine" | "partner">("all");
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [appointmentIdsToDelete, setAppointmentIdsToDelete] = useState<string[]>([]);
  const [selectedAppointmentIds, setSelectedAppointmentIds] = useState<string[]>([]);
  const [contextDraft, setContextDraft] = useState("");
  const [contextError, setContextError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [appointmentError, setAppointmentError] = useState<string | null>(null);
  const [appointmentDraft, setAppointmentDraft] = useState(getInitialAppointmentDraft);
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

  const appointmentsQuery = useQuery({
    queryKey: APPOINTMENTS_KEY,
    queryFn: () => datesService.listAppointments(),
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
    mutationFn: () => aiService.generateSuggestions({ category: "date", module: RECOMMENDATION_MODULE }),
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
        queryClient.invalidateQueries({ queryKey: APPOINTMENTS_KEY })
      ]);
      setActionError(null);
    },
    onError: (error) => setActionError(getErrorMessage(error))
  });

  const createAppointmentMutation = useMutation({
    mutationFn: (payload: { title: string; description: string; startAt: string }) =>
      datesService.createAppointment(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: APPOINTMENTS_KEY });
      setIsAppointmentModalOpen(false);
      setEditingAppointmentId(null);
      setAppointmentDraft(getInitialAppointmentDraft());
      setAppointmentError(null);
    },
    onError: (error) => setAppointmentError(getErrorMessage(error))
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: ({ id, ...input }: { id: string; title: string; description: string; startAt: string }) =>
      datesService.updateAppointment(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: APPOINTMENTS_KEY });
      setIsAppointmentModalOpen(false);
      setEditingAppointmentId(null);
      setAppointmentDraft(getInitialAppointmentDraft());
      setAppointmentError(null);
    },
    onError: (error) => setAppointmentError(getErrorMessage(error))
  });

  const deleteAppointmentsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await datesService.deleteAppointment(id);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: APPOINTMENTS_KEY });
      setSelectedAppointmentIds((current) =>
        current.filter((id) => !appointmentIdsToDelete.includes(id))
      );
      setAppointmentIdsToDelete([]);
      setIsDeleteConfirmModalOpen(false);
      setAppointmentError(null);
    },
    onError: (error) => setAppointmentError(getErrorMessage(error))
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

  const upcomingAppointments = useMemo(() => {
    const list: AppointmentDto[] = appointmentsQuery.data ?? [];
    return list.slice().sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [appointmentsQuery.data]);

  const filteredAppointments = useMemo(() => {
    if (ownerFilter === "all") return upcomingAppointments;
    if (!currentUserId) return upcomingAppointments;
    return upcomingAppointments.filter((item) => {
      const ownerId = item.owner?.id;
      if (!ownerId) return false;
      return ownerFilter === "mine" ? ownerId === currentUserId : ownerId !== currentUserId;
    });
  }, [currentUserId, ownerFilter, upcomingAppointments]);

  useEffect(() => {
    const availableIds = new Set(filteredAppointments.map((item) => item.id));
    setSelectedAppointmentIds((current) => current.filter((id) => availableIds.has(id)));
  }, [filteredAppointments]);

  const openCreateAppointmentModal = () => {
    setEditingAppointmentId(null);
    setAppointmentDraft(getInitialAppointmentDraft());
    setAppointmentError(null);
    setIsAppointmentModalOpen(true);
  };

  const openEditAppointmentModal = (appointment: AppointmentDto) => {
    setEditingAppointmentId(appointment.id);
    setAppointmentDraft({
      title: appointment.title,
      description: appointment.description ?? "",
      startAt: toLocalDateTimeInputValue(appointment.startAt)
    });
    setAppointmentError(null);
    setIsAppointmentModalOpen(true);
  };

  const handleSaveAppointment = async () => {
    const normalizedTitle = appointmentDraft.title.trim();
    if (normalizedTitle.length === 0) {
      setAppointmentError("El título es obligatorio.");
      return;
    }

    if (!appointmentDraft.startAt) {
      setAppointmentError("La fecha y hora son obligatorias.");
      return;
    }

    const parsedDate = new Date(appointmentDraft.startAt);
    if (Number.isNaN(parsedDate.getTime())) {
      setAppointmentError("La fecha y hora no son válidas.");
      return;
    }

    const payload = {
      title: normalizedTitle,
      description: appointmentDraft.description.trim(),
      startAt: parsedDate.toISOString()
    };

    if (editingAppointmentId) {
      await updateAppointmentMutation.mutateAsync({ id: editingAppointmentId, ...payload });
      return;
    }

    await createAppointmentMutation.mutateAsync(payload);
  };

  const toggleAppointmentSelected = (appointmentId: string) => {
    setSelectedAppointmentIds((current) =>
      current.includes(appointmentId)
        ? current.filter((id) => id !== appointmentId)
        : [...current, appointmentId]
    );
  };

  const openDeleteModal = (ids: string[]) => {
    if (ids.length === 0) return;
    setAppointmentError(null);
    setAppointmentIdsToDelete(ids);
    setIsDeleteConfirmModalOpen(true);
  };

  const handleConfirmDeleteAppointments = async () => {
    if (appointmentIdsToDelete.length === 0) return;
    await deleteAppointmentsMutation.mutateAsync(appointmentIdsToDelete);
  };

  const isSavingAppointment =
    createAppointmentMutation.isPending || updateAppointmentMutation.isPending;
  const allAppointmentsSelected =
    filteredAppointments.length > 0 && selectedAppointmentIds.length === filteredAppointments.length;

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
    <Screen title="Citas" subtitle="Sugerencias personalizadas para sus planes">
      <SurfaceCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg">Contexto de la relación</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Describe gustos, presupuesto, ciudad y tipo de planes que prefieren.
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
        <SectionTitle>Próximas citas</SectionTitle>
        <div className="space-y-3">
          {appointmentsQuery.isLoading ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">Cargando citas...</p>
            </SurfaceCard>
          ) : filteredAppointments.length === 0 ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">No hay citas próximas.</p>
            </SurfaceCard>
          ) : (
            filteredAppointments.map((appt) => (
              <SurfaceCard key={appt.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="mt-1 text-base">{appt.title}</h3>
                    {appt.description ? (
                      <p className="mt-2 text-sm text-muted-foreground">{appt.description}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(appt.startAt).toLocaleString()}{" "}
                      {appt.endAt ? `· ${new Date(appt.endAt).toLocaleString()}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{appt.owner?.name ?? "Pareja"}</div>
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
            <Button type="button" variant="outline" onClick={openCreateAppointmentModal}>
              Agregar cita manual
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setSelectedAppointmentIds(
                  allAppointmentsSelected ? [] : filteredAppointments.map((item) => item.id)
                )
              }
              disabled={filteredAppointments.length === 0}
            >
              {allAppointmentsSelected ? "Limpiar selección" : "Seleccionar todo"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => openDeleteModal(selectedAppointmentIds)}
              disabled={selectedAppointmentIds.length === 0}
            >
              Eliminar seleccionadas ({selectedAppointmentIds.length})
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          {appointmentsQuery.isLoading ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">Cargando opciones aceptadas...</p>
            </SurfaceCard>
          ) : filteredAppointments.length === 0 ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">Todavía no hay opciones aceptadas compartidas.</p>
            </SurfaceCard>
          ) : (
            filteredAppointments.map((item) => (
              <SurfaceCard key={item.id}>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedAppointmentIds.includes(item.id)}
                    onCheckedChange={() => toggleAppointmentSelected(item.id)}
                    aria-label={`Seleccionar cita ${item.title}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Cita
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
                        onClick={() => openEditAppointmentModal(item)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteModal([item.id])}
                        disabled={deleteAppointmentsMutation.isPending}
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
        {appointmentError ? <p className="mt-3 text-xs text-destructive">{appointmentError}</p> : null}
      </div>

      <Dialog
        open={isContextModalOpen}
        onOpenChange={setIsContextModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {contextQuery.data?.context ? "Editar contexto" : "Agregar contexto de citas"}
            </DialogTitle>
            <DialogDescription>
              Incluye ciudad, presupuesto, gustos, horarios y restricciones para recibir mejores
              sugerencias.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={contextDraft}
            onChange={(event) => setContextDraft(event.target.value)}
            className="min-h-32"
            placeholder="Ejemplo: Vivimos en Bogotá, nos gustan restaurantes tranquilos, presupuesto de 150.000 COP por salida..."
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
        open={isAppointmentModalOpen}
        onOpenChange={(open) => {
          setIsAppointmentModalOpen(open);
          if (!open) {
            setEditingAppointmentId(null);
            setAppointmentError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAppointmentId ? "Editar cita aceptada" : "Agregar cita manual"}
            </DialogTitle>
            <DialogDescription>
              Registra o ajusta una cita aceptada para que ambos la tengan visible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="appointment-title">Título</Label>
              <Input
                id="appointment-title"
                value={appointmentDraft.title}
                onChange={(event) =>
                  setAppointmentDraft((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Ejemplo: Cena en nuestro restaurante favorito"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment-startAt">Fecha y hora</Label>
              <Input
                id="appointment-startAt"
                type="datetime-local"
                value={appointmentDraft.startAt}
                onChange={(event) =>
                  setAppointmentDraft((current) => ({ ...current, startAt: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment-description">Descripción</Label>
              <Textarea
                id="appointment-description"
                value={appointmentDraft.description}
                onChange={(event) =>
                  setAppointmentDraft((current) => ({
                    ...current,
                    description: event.target.value
                  }))
                }
                placeholder="Detalles opcionales de la cita..."
              />
            </div>
          </div>

          {appointmentError ? <p className="text-xs text-destructive">{appointmentError}</p> : null}

          <DialogFooter>
            <Button
              type="button"
              onClick={handleSaveAppointment}
              disabled={isSavingAppointment}
            >
              {isSavingAppointment ? "Guardando..." : "Guardar cita"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteConfirmModalOpen} onOpenChange={setIsDeleteConfirmModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              {appointmentIdsToDelete.length === 1
                ? "¿Seguro que quieres eliminar esta cita aceptada?"
                : `¿Seguro que quieres eliminar ${appointmentIdsToDelete.length} citas aceptadas?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAppointmentsMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteAppointments}
              disabled={deleteAppointmentsMutation.isPending}
            >
              {deleteAppointmentsMutation.isPending ? "Eliminando..." : "Eliminar"}
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
