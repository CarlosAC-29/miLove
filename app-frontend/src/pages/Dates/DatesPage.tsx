import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { ApiError } from "@/services/api/errors";
import { aiService } from "@/services/recommendations/ai.service";
import { datesService, type AppointmentDto } from "@/services/dates.service";
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
const APPOINTMENTS_KEY = ["dates", "appointments"] as const;

export function DatesPage() {
  const queryClient = useQueryClient();
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [contextDraft, setContextDraft] = useState("");
  const [contextError, setContextError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
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

  const appointmentsQuery = useQuery({
    queryKey: APPOINTMENTS_KEY,
    queryFn: () => datesService.listAppointments()
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
    mutationFn: () => aiService.generateSuggestions(),
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
        queryClient.invalidateQueries({ queryKey: SUGGESTIONS_KEY })
      ]);
      setActionError(null);
    },
    onError: (error) => setActionError(getErrorMessage(error))
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

  const acceptedSuggestions = useMemo(
    () => (suggestionsQuery.data ?? []).filter((suggestion) => suggestion.accepted),
    [suggestionsQuery.data]
  );

  const upcomingAppointments = useMemo(() => {
    const list: AppointmentDto[] = appointmentsQuery.data ?? [];
    return list
      .slice()
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .filter((a) => new Date(a.startAt).getTime() >= Date.now());
  }, [appointmentsQuery.data]);

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
        <SectionTitle>Próximas citas</SectionTitle>
        <div className="space-y-3">
          {appointmentsQuery.isLoading ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">Cargando citas...</p>
            </SurfaceCard>
          ) : upcomingAppointments.length === 0 ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">No hay citas próximas.</p>
            </SurfaceCard>
          ) : (
            upcomingAppointments.map((appt) => (
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
        <SectionTitle>Opciones aceptadas</SectionTitle>
        <div className="space-y-3">
          {acceptedSuggestions.length === 0 ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">Todavía no has aceptado opciones.</p>
            </SurfaceCard>
          ) : (
            acceptedSuggestions.map((suggestion) => (
              <SurfaceCard key={suggestion.id}>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {suggestion.category}
                </p>
                <h3 className="mt-1 text-base">{suggestion.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{suggestion.message}</p>
              </SurfaceCard>
            ))
          )}
        </div>
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
