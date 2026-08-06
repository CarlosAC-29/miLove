import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoneyInput, parseMoneyInput } from "@/shared/lib/money-input";
import { useCreatePersonalGoal } from "./useCreatePersonalGoal";

interface PersonalGoalFormProps {
  onSaved?: () => Promise<void> | void;
}

export function PersonalGoalForm({ onSaved }: PersonalGoalFormProps) {
  const { isSubmitting, createPersonalGoal } = useCreatePersonalGoal(onSaved);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const target = parseMoneyInput(targetAmount);
    const current = currentAmount.trim().length > 0 ? parseMoneyInput(currentAmount) : 0;

    if (!Number.isFinite(target) || target <= 0) {
      setError("La meta debe ser mayor a 0.");
      return;
    }

    try {
      await createPersonalGoal({
        name: name.trim(),
        targetAmount: target,
        currentAmount: Number.isFinite(current) ? current : 0,
        deadline: deadline || undefined
      });
      setName("");
      setTargetAmount("");
      setCurrentAmount("");
      setDeadline("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo crear la meta.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nombre de la meta"
        required
        className="h-10 rounded-xl bg-surface"
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={targetAmount}
          onChange={(event) => setTargetAmount(formatMoneyInput(event.target.value))}
          placeholder="Objetivo total"
          type="text"
          inputMode="numeric"
          required
          className="h-10 rounded-xl bg-surface"
        />
        <Input
          value={currentAmount}
          onChange={(event) => setCurrentAmount(formatMoneyInput(event.target.value))}
          placeholder="Ahorrado"
          type="text"
          inputMode="numeric"
          className="h-10 rounded-xl bg-surface"
        />
      </div>
      <Input
        value={deadline}
        onChange={(event) => setDeadline(event.target.value)}
        type="date"
        className="h-10 rounded-xl bg-surface"
      />
      <Button
        type="submit"
        variant="outline"
        className="h-10 w-full rounded-xl"
        disabled={isSubmitting}
      >
        Crear meta personal
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </form>
  );
}
