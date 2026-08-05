import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { HouseholdProfile } from "@/entities/finance-profile/types";
import { formatCurrency } from "@/shared/lib/format";
import { useManageContributions } from "./useManageContributions";

interface ContributionManagerProps {
  householdProfile: HouseholdProfile | null;
  onSaved?: () => Promise<void> | void;
}

export function ContributionManager({ householdProfile, onSaved }: ContributionManagerProps) {
  const { isSubmitting, updateContribution } = useManageContributions(onSaved);
  const [error, setError] = useState<string | null>(null);

  if (!householdProfile) return null;

  return (
    <div className="space-y-3">
      {householdProfile.members.map((member) => (
        <ContributionRow
          key={member.memberId}
          memberId={member.memberId}
          memberName={member.memberName}
          defaultAmount={member.amount}
          loading={isSubmitting}
          onSave={async (amount) => {
            setError(null);
            try {
              await updateContribution(member.memberId, amount);
            } catch (caughtError) {
              setError(
                caughtError instanceof Error
                  ? caughtError.message
                  : "No se pudo actualizar el aporte."
              );
            }
          }}
        />
      ))}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function ContributionRow({
  memberId,
  memberName,
  defaultAmount,
  loading,
  onSave
}: {
  memberId: string;
  memberName: string;
  defaultAmount: number;
  loading: boolean;
  onSave: (amount: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState(String(defaultAmount));

  return (
    <form
      className="grid grid-cols-[1fr_auto] items-center gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount < 0) return;
        await onSave(numericAmount);
      }}
    >
      <div>
        <p className="text-sm font-semibold">{memberName}</p>
        <p className="text-xs text-muted-foreground">
          Valor actual: {formatCurrency(defaultAmount)} ({memberId})
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          type="number"
          min={0}
          className="h-9 w-28 rounded-xl bg-surface text-right"
        />
        <Button type="submit" size="sm" variant="outline" disabled={loading}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
