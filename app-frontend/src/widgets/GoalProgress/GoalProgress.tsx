import { useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { goalProgress, type Goal, type GoalContribution } from "@/entities/goal/types";
import { financeService } from "@/services/finance/finance.service";
import { formatCurrency } from "@/shared/lib/format";
import { formatMoneyInput, parseMoneyInput } from "@/shared/lib/money-input";
import { SurfaceCard } from "@/shared/ui/SurfaceCard";

interface GoalProgressProps {
  goals: readonly Goal[];
  month: string;
  onContributionSaved: () => Promise<void> | void;
}

interface ContributionEditor {
  goal: Goal;
  contribution?: GoalContribution;
}

function formatContributionMonth(month: string): string {
  return new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(
    new Date(`${month}-01T00:00:00`)
  );
}

export function GoalProgress({ goals, month, onContributionSaved }: GoalProgressProps) {
  const [contributionEditor, setContributionEditor] = useState<ContributionEditor | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionMonth, setContributionMonth] = useState(month);
  const [isContributionShared, setIsContributionShared] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [contributionToDelete, setContributionToDelete] = useState<ContributionEditor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeContributionEditor = () => {
    if (isSaving) return;
    setContributionEditor(null);
    setContributionAmount("");
    setContributionMonth(month);
    setIsContributionShared(false);
  };

  const openContributionEditor = (goal: Goal, contribution?: GoalContribution) => {
    setError(null);
    setContributionEditor({ goal, contribution });
    setContributionAmount(contribution ? formatMoneyInput(String(contribution.amount)) : "");
    setContributionMonth(contribution?.month ?? month);
    setIsContributionShared(contribution?.isShared ?? false);
  };

  const openGoalEditor = (goal: Goal) => {
    setError(null);
    setEditingGoal(goal);
    setGoalName(goal.name);
    setTargetAmount(formatMoneyInput(String(goal.targetAmount)));
    setDeadline(goal.deadline ?? "");
  };

  const handleContribution = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contributionEditor) return;

    const amount = parseMoneyInput(contributionAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("El aporte debe ser mayor a 0.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      if (contributionEditor.contribution) {
        await financeService.updateGoalContribution(
          contributionEditor.goal.id,
          contributionEditor.contribution.id,
          { amount, month: contributionMonth, isShared: isContributionShared }
        );
      } else {
        await financeService.createGoalContribution(contributionEditor.goal.id, {
          amount,
          month: contributionMonth,
          isShared: isContributionShared
        });
      }
      await onContributionSaved();
      setContributionEditor(null);
      setContributionAmount("");
      setContributionMonth(month);
      setIsContributionShared(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo guardar el aporte.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoalUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingGoal) return;

    const target = parseMoneyInput(targetAmount);
    if (!goalName.trim()) {
      setError("El nombre de la meta es obligatorio.");
      return;
    }
    if (!Number.isFinite(target) || target <= 0) {
      setError("El objetivo debe ser mayor a 0.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await financeService.updateGoal(editingGoal.id, {
        name: goalName.trim(),
        targetAmount: target,
        deadline: deadline || null
      });
      await onContributionSaved();
      setEditingGoal(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo editar la meta.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    setIsSaving(true);
    setError(null);
    try {
      await financeService.deleteGoal(goalToDelete.id);
      await onContributionSaved();
      setGoalToDelete(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo eliminar la meta.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteContribution = async () => {
    if (!contributionToDelete?.contribution) return;
    setIsSaving(true);
    setError(null);
    try {
      await financeService.deleteGoalContribution(
        contributionToDelete.goal.id,
        contributionToDelete.contribution.id
      );
      await onContributionSaved();
      setContributionToDelete(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo eliminar el aporte.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SurfaceCard className="space-y-3">
      <h3 className="text-sm font-semibold">Metas</h3>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {goals.length === 0 ? (
        <p className="text-xs text-muted-foreground">No hay metas creadas.</p>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const progress = goalProgress(goal);
            return (
              <div
                key={goal.id}
                className="space-y-2 rounded-xl border border-border/70 bg-surface px-3 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{goal.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Objetivo: {formatCurrency(goal.targetAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ahorrado: {formatCurrency(goal.currentAmount)}
                    </p>
                    {goal.deadline ? (
                      <p className="text-xs text-muted-foreground">Fecha meta: {goal.deadline}</p>
                    ) : null}
                  </div>
                  {goal.isOwner ? <div className="flex gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Editar ${goal.name}`}
                      onClick={() => openGoalEditor(goal)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Eliminar ${goal.name}`}
                      onClick={() => {
                        setError(null);
                        setGoalToDelete(goal);
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div> : null}
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-success transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  {goal.isOwner ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openContributionEditor(goal)}
                    >
                      Aportar
                    </Button>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">Compartida por tu pareja</span>
                  )}
                  <p className="text-[11px] text-muted-foreground">{progress}%</p>
                </div>
                {goal.contributions.length > 0 ? (
                  <div className="border-t border-border pt-2">
                    <p className="mb-1 text-[11px] font-medium text-muted-foreground">Aportes</p>
                    <div className="space-y-1">
                      {goal.contributions.map((contribution) => (
                        <div
                          key={contribution.id}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="text-muted-foreground">
                            {formatContributionMonth(contribution.month)}
                          </span>
                          <div className="flex items-center gap-1">
                            {contribution.isShared ? (
                              <span className="text-[10px] text-success">En pareja</span>
                            ) : null}
                            <span className="font-medium">{formatCurrency(contribution.amount)}</span>
                            {goal.isOwner ? (
                              <>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="size-7"
                                  aria-label={`Editar aporte de ${formatContributionMonth(contribution.month)}`}
                                  onClick={() => openContributionEditor(goal, contribution)}
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="size-7"
                                  aria-label={`Eliminar aporte de ${formatContributionMonth(contribution.month)}`}
                                  onClick={() => {
                                    setError(null);
                                    setContributionToDelete({ goal, contribution });
                                  }}
                                >
                                  <Trash2 className="size-3.5 text-destructive" />
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={contributionEditor !== null}
        onOpenChange={(open) => !open && closeContributionEditor()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {contributionEditor?.contribution ? "Editar aporte" : `Aportar a ${contributionEditor?.goal.name ?? ""}`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(event) => void handleContribution(event)} className="space-y-3">
            <Input
              value={contributionAmount}
              onChange={(event) => setContributionAmount(formatMoneyInput(event.target.value))}
              placeholder="Monto del aporte"
              type="text"
              inputMode="numeric"
              autoFocus
              className="h-10 rounded-xl bg-surface"
            />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={isContributionShared}
                onCheckedChange={(checked) => setIsContributionShared(checked === true)}
              />
              Compartir este aporte con mi pareja
            </label>
            <Input
              value={contributionMonth}
              onChange={(event) => setContributionMonth(event.target.value)}
              type="month"
              className="h-10 rounded-xl bg-surface"
            />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar aporte"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editingGoal !== null} onOpenChange={(open) => !open && setEditingGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar meta</DialogTitle>
          </DialogHeader>
          <form onSubmit={(event) => void handleGoalUpdate(event)} className="space-y-3">
            <Input
              value={goalName}
              onChange={(event) => setGoalName(event.target.value)}
              placeholder="Nombre de la meta"
              className="h-10 rounded-xl bg-surface"
            />
            <Input
              value={targetAmount}
              onChange={(event) => setTargetAmount(formatMoneyInput(event.target.value))}
              placeholder="Objetivo total"
              type="text"
              inputMode="numeric"
              className="h-10 rounded-xl bg-surface"
            />
            <Input
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              type="date"
              className="h-10 rounded-xl bg-surface"
            />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={goalToDelete !== null} onOpenChange={(open) => !open && setGoalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta meta?</AlertDialogTitle>
            <AlertDialogDescription>
              También se eliminarán todos sus aportes registrados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDeleteGoal()} disabled={isSaving}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={contributionToDelete !== null}
        onOpenChange={(open) => !open && setContributionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este aporte?</AlertDialogTitle>
            <AlertDialogDescription>El monto se descontará del ahorro acumulado.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDeleteContribution()} disabled={isSaving}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SurfaceCard>
  );
}
