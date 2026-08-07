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
import { goalProgress, type Goal } from "@/entities/goal/types";
import { financeService } from "@/services/finance/finance.service";
import { goalsService, type GoalDto } from "@/services/goals.service";
import { formatCurrency } from "@/shared/lib/format";
import { useAuthStore } from "@/stores/auth.store";
import { Screen } from "@/shared/ui/Screen";
import { SectionTitle, SurfaceCard } from "@/shared/ui/SurfaceCard";

const GOALS_KEY = ["goals", "list"] as const;
const FINANCE_GOALS_KEY = ["finance", "goals", "personal"] as const;

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

export function GoalsPage() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [ownerFilter, setOwnerFilter] = useState<"all" | "mine" | "partner">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalIdToDelete, setGoalIdToDelete] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const goalsQuery = useQuery({
    queryKey: GOALS_KEY,
    queryFn: () => goalsService.listGoals(),
    refetchInterval: 5000
  });
  const financialGoalsQuery = useQuery({
    queryKey: FINANCE_GOALS_KEY,
    queryFn: () => financeService.listGoals("personal"),
    refetchInterval: 5000
  });

  const createGoalMutation = useMutation({
    mutationFn: (input: { title: string; description: string }) => goalsService.createGoal(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: GOALS_KEY });
      setIsModalOpen(false);
      setEditingGoalId(null);
      setTitleDraft("");
      setDescriptionDraft("");
      setFormError(null);
    },
    onError: (error) => setFormError(getErrorMessage(error))
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, ...input }: { id: string; title: string; description: string }) =>
      goalsService.updateGoal(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: GOALS_KEY });
      setIsModalOpen(false);
      setEditingGoalId(null);
      setTitleDraft("");
      setDescriptionDraft("");
      setFormError(null);
    },
    onError: (error) => setFormError(getErrorMessage(error))
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id: string) => goalsService.deleteGoal(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: GOALS_KEY });
      setGoalIdToDelete(null);
      setIsDeleteModalOpen(false);
      setFormError(null);
    },
    onError: (error) => setFormError(getErrorMessage(error))
  });

  const sortedGoals = useMemo(() => {
    const list: GoalDto[] = goalsQuery.data ?? [];
    const filtered = ownerFilter === "all" || !currentUserId
      ? list
      : list.filter((goal) => {
          const ownerId = goal.owner?.id;
          if (!ownerId) return false;
          return ownerFilter === "mine" ? ownerId === currentUserId : ownerId !== currentUserId;
        });
    return filtered.slice().sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [currentUserId, goalsQuery.data, ownerFilter]);

  const openCreateModal = () => {
    setEditingGoalId(null);
    setTitleDraft("");
    setDescriptionDraft("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (goal: GoalDto) => {
    setEditingGoalId(goal.id);
    setTitleDraft(goal.title);
    setDescriptionDraft(goal.description ?? "");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openDeleteModal = (goalId: string) => {
    setGoalIdToDelete(goalId);
    setFormError(null);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async () => {
    const normalizedTitle = titleDraft.trim();
    if (!normalizedTitle) {
      setFormError("El título es obligatorio.");
      return;
    }

    const payload = { title: normalizedTitle, description: descriptionDraft.trim() };
    if (editingGoalId) {
      await updateGoalMutation.mutateAsync({ id: editingGoalId, ...payload });
      return;
    }
    await createGoalMutation.mutateAsync(payload);
  };

  const handleDelete = async () => {
    if (!goalIdToDelete) return;
    await deleteGoalMutation.mutateAsync(goalIdToDelete);
  };

  const isSaving = createGoalMutation.isPending || updateGoalMutation.isPending;
  const sharedFinancialGoals = (financialGoalsQuery.data ?? []).filter((goal) => goal.isShared);

  return (
    <Screen title="Metas" subtitle="Listado compartido de metas">
      <div className="mb-3 flex items-center justify-between gap-3">
        <SectionTitle>Metas</SectionTitle>
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
            Agregar meta
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        {goalsQuery.isLoading ? (
          <SurfaceCard>
            <p className="text-sm text-muted-foreground">Cargando metas...</p>
          </SurfaceCard>
        ) : sortedGoals.length === 0 ? (
          <SurfaceCard>
            <p className="text-sm text-muted-foreground">Todavía no hay metas compartidas.</p>
          </SurfaceCard>
        ) : (
          sortedGoals.map((goal) => (
            <SurfaceCard key={goal.id}>
              <h3 className="text-base">{goal.title}</h3>
              {goal.description ? (
                <p className="mt-2 text-sm text-muted-foreground">{goal.description}</p>
              ) : null}
              {goal.owner?.name ? (
                <p className="mt-2 text-xs text-muted-foreground text-right">
                  Compartido por: {goal.owner.name}
                </p>
              ) : null}
              <div className="mt-3 flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => openEditModal(goal)}>
                  Editar
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => openDeleteModal(goal.id)}>
                  Eliminar
                </Button>
              </div>
            </SurfaceCard>
          ))
        )}
      </div>
      {sharedFinancialGoals.length > 0 ? (
        <div className="mt-6">
          <SectionTitle>Metas financieras compartidas</SectionTitle>
          <div className="space-y-3">
            {sharedFinancialGoals.map((goal: Goal) => {
              const progress = goalProgress(goal);
              return (
                <SurfaceCard key={goal.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base">{goal.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
                      </p>
                      {goal.deadline ? (
                        <p className="mt-1 text-xs text-muted-foreground">Fecha meta: {goal.deadline}</p>
                      ) : null}
                    </div>
                    <span className="text-sm font-medium">{progress}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-success" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-4 border-t border-border pt-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Aportes</p>
                    {goal.contributions.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Aún no hay aportes.</p>
                    ) : (
                      <div className="space-y-1">
                        {goal.contributions.map((contribution) => (
                          <div key={contribution.id} className="flex justify-between gap-3 text-sm">
                            <span>{contribution.contributorName ?? "Aporte inicial"}</span>
                            <span className="font-medium">{formatCurrency(contribution.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </SurfaceCard>
              );
            })}
          </div>
        </div>
      ) : null}
      {formError ? <p className="mt-3 text-xs text-destructive">{formError}</p> : null}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGoalId ? "Editar meta" : "Agregar meta"}</DialogTitle>
            <DialogDescription>
              Esta meta será visible para ambos usuarios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              placeholder="Título de la meta"
            />
            <Textarea
              value={descriptionDraft}
              onChange={(event) => setDescriptionDraft(event.target.value)}
              placeholder="Descripción (opcional)"
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
            <AlertDialogTitle>Eliminar meta</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que quieres eliminar esta meta?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteGoalMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteGoalMutation.isPending}>
              {deleteGoalMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Screen>
  );
}
