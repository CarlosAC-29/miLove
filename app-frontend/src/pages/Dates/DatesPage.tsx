import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { ApiError } from "@/services/api/errors";
import { aiService } from "@/services/recommendations/ai.service";
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

export function DatesPage() {
  const queryClient = useQueryClient();
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [contextDraft, setContextDraft] = useState("");
  const [contextError, setContextError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const contextQuery = useQuery({
    queryKey: CONTEXT_KEY,
    queryFn: () => aiService.getContextState(),
  });

  const suggestionsQuery = useQuery({
    queryKey: SUGGESTIONS_KEY,
    queryFn: () => aiService.listSuggestions("all"),
  });

  const saveContextMutation = useMutation({
    mutationFn: (context: string) => aiService.upsertContext({ context }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CONTEXT_KEY });
      setIsContextModalOpen(false);
      setContextError(null);
    },
    onError: (error) => setContextError(getErrorMessage(error)),
  });

  const generateMutation = useMutation({
    mutationFn: () => aiService.generateSuggestions(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CONTEXT_KEY }),
        queryClient.invalidateQueries({ queryKey: SUGGESTIONS_KEY }),
      ]);
      setActionError(null);
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });

  const acceptMutation = useMutation({
    mutationFn: (suggestionId: string) => aiService.acceptSuggestions({ suggestionIds: [suggestionId] }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CONTEXT_KEY }),
        queryClient.invalidateQueries({ queryKey: SUGGESTIONS_KEY }),
      ]);
      setActionError(null);
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  });

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

  const pendingSuggestions = useMemo(
    () => (suggestionsQuery.data ?? []).filter((suggestion) => !suggestion.accepted),
    [suggestionsQuery.data],
  );

  const acceptedSuggestions = useMemo(
    () => (suggestionsQuery.data ?? []).filter((suggestion) => suggestion.accepted),
    [suggestionsQuery.data],
  );

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
            onClick={() => generateMutation.mutate()}
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
        <SectionTitle>Opciones sugeridas</SectionTitle>
        <div className="space-y-3">
          {pendingSuggestions.length === 0 ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">
                Aún no hay opciones pendientes. Genera opciones para empezar.
              </p>
            </SurfaceCard>
          ) : (
            pendingSuggestions.map((suggestion) => (
              <SurfaceCard key={suggestion.id}>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {suggestion.category}
                </p>
                <h3 className="mt-1 text-base">{suggestion.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{suggestion.message}</p>
                <div className="mt-3">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => acceptMutation.mutate(suggestion.id)}
                    disabled={acceptMutation.isPending}
                  >
                    Agregar esta opción
                  </Button>
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
            <Button type="button" onClick={handleSaveContext} disabled={saveContextMutation.isPending}>
              {saveContextMutation.isPending ? "Guardando..." : "Guardar contexto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Screen>
  );
}
