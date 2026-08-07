import { useState, type FormEvent } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatMoneyInput, parseMoneyInput } from "@/shared/lib/money-input";
import { useCreatePersonalGoal } from "./useCreatePersonalGoal";

interface PersonalGoalFormProps {
  onSaved?: () => Promise<void> | void;
}

function dateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDeadline(date: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

export function PersonalGoalForm({ onSaved }: PersonalGoalFormProps) {
  const { isSubmitting, createPersonalGoal } = useCreatePersonalGoal(onSaved);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isDeadlineCalendarOpen, setIsDeadlineCalendarOpen] = useState(false);
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
          placeholder="Ahorro inicial"
          type="text"
          inputMode="numeric"
          className="h-10 rounded-xl bg-surface"
        />
      </div>
      <Popover open={isDeadlineCalendarOpen} onOpenChange={setIsDeadlineCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full justify-start rounded-xl bg-surface px-3 text-left font-normal"
          >
            <CalendarDays className="mr-2 size-4 text-muted-foreground" />
            {deadline ? (
              formatDeadline(deadline)
            ) : (
              <span className="text-muted-foreground">Fecha límite (opcional)</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto rounded-xl border-border bg-surface p-0" align="start">
          <Calendar
            mode="single"
            selected={deadline ? new Date(`${deadline}T00:00:00`) : undefined}
            onSelect={(date) => {
              if (!date) return;
              setDeadline(dateToIso(date));
              setIsDeadlineCalendarOpen(false);
            }}
            className="w-72 [--cell-size:2.25rem]"
          />
          {deadline ? (
            <div className="border-t border-border p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setDeadline("");
                  setIsDeadlineCalendarOpen(false);
                }}
              >
                Quitar fecha
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
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
