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
import { useCreateHouseholdBudget } from "./useCreateHouseholdBudget";

interface HouseholdBudgetFormProps {
  onSaved?: () => Promise<void> | void;
}

export function HouseholdBudgetForm({ onSaved }: HouseholdBudgetFormProps) {
  const { isSubmitting, createHouseholdBudget } = useCreateHouseholdBudget(onSaved);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("hogar");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("El presupuesto debe ser mayor a 0.");
      return;
    }

    try {
      await createHouseholdBudget({
        name: name.trim(),
        categoryId,
        amount: numericAmount
      });
      setName("");
      setAmount("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "No se pudo crear el presupuesto."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nombre del presupuesto hogar"
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
        onChange={(event) => setAmount(event.target.value)}
        placeholder="Monto total"
        type="number"
        min={1}
        required
        className="h-10 rounded-xl bg-surface"
      />
      <Button
        type="submit"
        variant="outline"
        className="h-10 w-full rounded-xl"
        disabled={isSubmitting}
      >
        Crear presupuesto hogar
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </form>
  );
}
