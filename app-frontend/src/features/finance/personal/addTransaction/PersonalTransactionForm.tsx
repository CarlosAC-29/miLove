import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { CATEGORIES, INCOME_CATEGORIES } from "@/entities/category/types";
import type { TransactionType } from "@/entities/transaction/types";
import { formatMoneyInput, parseMoneyInput } from "@/shared/lib/money-input";
import { useAddPersonalTransaction } from "./useAddPersonalTransaction";

interface PersonalTransactionFormProps {
  onSaved?: () => Promise<void> | void;
  initialType?: TransactionType;
}

export function PersonalTransactionForm({ onSaved, initialType = "expense" }: PersonalTransactionFormProps) {
  const { isSubmitting, addPersonalTransaction } = useAddPersonalTransaction(onSaved);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(initialType === "income" ? "freelance" : "alimentacion");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [isFixed, setIsFixed] = useState(false);

  useEffect(() => {
    setCategory(initialType === "income" ? "freelance" : "alimentacion");
    setIsFixed(false);
  }, [initialType]);

  const type = initialType;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const numericAmount = parseMoneyInput(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("El monto debe ser mayor a 0.");
      return;
    }

    try {
      await addPersonalTransaction({
        amount: numericAmount,
        type,
        category,
        isFixed,
        date,
        description: description.trim()
      });
      setAmount("");
      setDescription("");
      setIsFixed(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "No se pudo crear la transaccion."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-surface px-3 py-2">
        <Checkbox
          checked={isFixed}
          onCheckedChange={(checked) => setIsFixed(Boolean(checked))}
          id="personal-fixed-transaction"
        />
        <label htmlFor="personal-fixed-transaction" className="text-sm">
          {type === "income" ? "Marcar como ingreso fijo mensual" : "Marcar como gasto fijo mensual"}
        </label>
      </div>

      <Input
        value={amount}
        onChange={(event) => setAmount(formatMoneyInput(event.target.value))}
        placeholder="Monto"
        type="text"
        inputMode="numeric"
        required
        className="h-10 rounded-xl bg-surface"
      />

      <Select
        value={category}
        onValueChange={setCategory}
      >
        <SelectTrigger className="h-10 rounded-xl bg-surface">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          {(type === "income"
            ? INCOME_CATEGORIES
            : CATEGORIES.filter((item) => item.id !== "hogar" && item.id !== "ingresos")
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

      <Button type="submit" className="h-10 w-full rounded-xl" disabled={isSubmitting}>
        Agregar transaccion personal
      </Button>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </form>
  );
}
