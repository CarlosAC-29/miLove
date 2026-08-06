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
import { formatMoneyInput, parseMoneyInput } from "@/shared/lib/money-input";
import { useCreateHouseholdBudget } from "./useCreateHouseholdBudget";

interface HouseholdBudgetFormProps {
  onSaved?: () => Promise<void> | void;
}

const MONTH_OPTIONS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" }
] as const;

function buildYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 8 }, (_, index) => String(currentYear - 5 + index));
}

export function HouseholdBudgetForm({ onSaved }: HouseholdBudgetFormProps) {
  const { isSubmitting, createHouseholdBudget } = useCreateHouseholdBudget(onSaved);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("hogar");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, selectedMonth] = month.split("-");
  const yearOptions = buildYearOptions();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const numericAmount = parseMoneyInput(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("El presupuesto debe ser mayor a 0.");
      return;
    }

    try {
      await createHouseholdBudget({
        name: name.trim(),
        categoryId,
        amount: numericAmount,
        month
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
        onChange={(event) => setAmount(formatMoneyInput(event.target.value))}
        placeholder="Monto total"
        type="text"
        inputMode="numeric"
        required
        className="h-10 rounded-xl bg-surface"
      />
      <div className="grid grid-cols-2 gap-2">
        <Select value={selectedMonth} onValueChange={(value) => setMonth(`${selectedYear}-${value}`)}>
          <SelectTrigger className="h-10 rounded-xl bg-surface">
            <SelectValue placeholder="Mes" />
          </SelectTrigger>
          <SelectContent>
            {MONTH_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedYear} onValueChange={(value) => setMonth(`${value}-${selectedMonth}`)}>
          <SelectTrigger className="h-10 rounded-xl bg-surface">
            <SelectValue placeholder="Año" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
