import { useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
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
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { CATEGORIES } from "@/entities/category/types";
import { budgetProgress, type Budget, type UpdateBudgetInput } from "@/entities/budget/types";
import { formatMoneyInput, parseMoneyInput } from "@/shared/lib/money-input";
import { formatCurrency } from "@/shared/lib/format";
import { SurfaceCard } from "@/shared/ui/SurfaceCard";

interface BudgetCardProps {
  budgets: readonly Budget[];
  onEdit: (id: string, changes: UpdateBudgetInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function BudgetCard({ budgets, onEdit, onDelete }: BudgetCardProps) {
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openEditDialog = (budget: Budget) => {
    setEditingBudget(budget);
    setName(budget.name);
    setCategoryId(budget.categoryId);
    setAmount(formatMoneyInput(String(budget.amount)));
    setError(null);
  };

  const handleEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingBudget) return;

    const numericAmount = parseMoneyInput(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("El presupuesto debe ser mayor a 0.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onEdit(editingBudget.id, {
        name: name.trim(),
        categoryId,
        amount: numericAmount
      });
      setEditingBudget(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "No se pudo actualizar el presupuesto."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!budgetToDelete) return;

    setIsDeleting(true);
    setError(null);
    try {
      await onDelete(budgetToDelete.id);
      setBudgetToDelete(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "No se pudo eliminar el presupuesto."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SurfaceCard className="space-y-3">
      <h3 className="text-sm font-semibold">Presupuestos</h3>
      {budgets.length === 0 ? (
        <p className="text-xs text-muted-foreground">No hay presupuestos creados.</p>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const progress = budgetProgress(budget);
            return (
              <div key={budget.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold">{budget.name}</span>
                  <div className="flex items-center gap-1">
                    <span>{formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => openEditDialog(budget)}
                      aria-label={`Editar ${budget.name}`}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 text-destructive hover:text-destructive"
                      onClick={() => {
                        setBudgetToDelete(budget);
                        setError(null);
                      }}
                      aria-label={`Eliminar ${budget.name}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-[11px] text-muted-foreground">{progress}%</p>
              </div>
            );
          })}
        </div>
      )}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <Dialog
        open={editingBudget !== null}
        onOpenChange={(open) => {
          if (!open && !isSaving) setEditingBudget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar presupuesto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nombre del presupuesto"
              required
              className="h-10 rounded-xl bg-surface"
            />
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-10 rounded-xl bg-surface">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.filter((item) => item.id !== "ingresos").map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={amount}
              onChange={(event) => setAmount(formatMoneyInput(event.target.value))}
              placeholder="Monto total"
              type="text"
              inputMode="numeric"
              required
              className="h-10 rounded-xl bg-surface"
            />
            <Button type="submit" className="h-10 w-full rounded-xl" disabled={isSaving}>
              Guardar cambios
            </Button>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={budgetToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setBudgetToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar presupuesto</AlertDialogTitle>
            <AlertDialogDescription>
              {`Se eliminará "${budgetToDelete?.name ?? ""}". Esta acción no se puede deshacer.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
            >
              Eliminar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SurfaceCard>
  );
}
