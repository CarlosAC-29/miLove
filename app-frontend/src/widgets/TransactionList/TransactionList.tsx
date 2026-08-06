import { useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
import { CATEGORIES, getCategory, INCOME_CATEGORIES } from "@/entities/category/types";
import type { Transaction, TransactionType } from "@/entities/transaction/types";
import { formatCurrency, formatDate } from "@/shared/lib/format";
import { formatMoneyInput, parseMoneyInput } from "@/shared/lib/money-input";
import { SurfaceCard } from "@/shared/ui/SurfaceCard";

interface TransactionChanges {
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface TransactionListProps {
  transactions: readonly Transaction[];
  type: TransactionType;
  onDelete?: (transactionId: string) => Promise<void>;
  onEdit?: (transactionId: string, changes: TransactionChanges) => Promise<void>;
}

export function TransactionList({ transactions, type, onDelete, onEdit }: TransactionListProps) {
  const rows = transactions.filter((transaction) => transaction.type === type);
  const title = type === "expense" ? "Historial de egresos" : "Historial de ingresos";
  const emptyMessage =
    type === "expense" ? "Aun no hay egresos registrados." : "Aun no hay ingresos registrados.";
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setAmount(formatMoneyInput(String(transaction.amount)));
    setCategory(transaction.category);
    setDate(transaction.date);
    setDescription(transaction.description);
    setError(null);
  };

  const handleEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingTransaction || !onEdit) return;

    const numericAmount = parseMoneyInput(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("El monto debe ser mayor a 0.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onEdit(editingTransaction.id, {
        amount: numericAmount,
        category,
        date,
        description: description.trim()
      });
      setEditingTransaction(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "No se pudo actualizar la transaccion."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SurfaceCard className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((transaction) => {
            const isIncome = transaction.type === "income";
            return (
              <li
                key={transaction.id}
                className="flex items-center justify-between rounded-xl border border-border/70 bg-surface px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold">{transaction.description}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {getCategory(transaction.category).name}
                    {transaction.isFixed ? " · Fijo" : ""}
                    {" · "}
                    {formatDate(transaction.date)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <p
                    className={
                      isIncome
                        ? "text-sm font-semibold text-success"
                        : "text-sm font-semibold text-foreground"
                    }
                  >
                    {isIncome ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                  {onEdit ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => openEditDialog(transaction)}
                      aria-label={`Editar ${transaction.description}`}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  ) : null}
                  {onDelete ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => void onDelete(transaction.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={editingTransaction !== null}
        onOpenChange={(open) => {
          if (!open && !isSaving) setEditingTransaction(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar {type === "expense" ? "egreso" : "ingreso"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3">
            <Input
              value={amount}
              onChange={(event) => setAmount(formatMoneyInput(event.target.value))}
              placeholder="Monto"
              type="text"
              inputMode="numeric"
              required
              className="h-10 rounded-xl bg-surface"
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10 rounded-xl bg-surface">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {(type === "income"
                  ? INCOME_CATEGORIES
                  : CATEGORIES.filter((item) => item.id !== "ingresos")
                ).map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={date}
              onChange={(event) => setDate(event.target.value)}
              type="date"
              required
              className="h-10 rounded-xl bg-surface"
            />
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descripcion"
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
    </SurfaceCard>
  );
}
