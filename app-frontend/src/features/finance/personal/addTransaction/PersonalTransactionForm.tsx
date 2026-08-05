import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { CATEGORIES } from "@/entities/category/types";
import type { TransactionType } from "@/entities/transaction/types";
import { useAddPersonalTransaction } from "./useAddPersonalTransaction";

interface PersonalTransactionFormProps {
  onSaved?: () => Promise<void> | void;
}

export function PersonalTransactionForm({ onSaved }: PersonalTransactionFormProps) {
  const { isSubmitting, addPersonalTransaction } = useAddPersonalTransaction(onSaved);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("alimentacion");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("El monto debe ser mayor a 0.");
      return;
    }

    try {
      await addPersonalTransaction({
        amount: numericAmount,
        type,
        category,
        date,
        description: description.trim()
      });
      setAmount("");
      setDescription("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "No se pudo crear la transaccion."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Select value={type} onValueChange={(value) => setType(value as TransactionType)}>
          <SelectTrigger className="h-10 rounded-xl bg-surface">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="income">Ingreso</SelectItem>
            <SelectItem value="expense">Gasto</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Monto"
          type="number"
          min={1}
          required
          className="h-10 rounded-xl bg-surface"
        />
      </div>

      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="h-10 rounded-xl bg-surface">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.filter((item) => item.id !== "hogar").map((item) => (
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
