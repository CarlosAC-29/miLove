import { useState } from "react";
import { financeService } from "@/services/finance/finance.service";

interface CreateHouseholdBudgetInput {
  name: string;
  categoryId: string;
  amount: number;
  month: string;
}

export function useCreateHouseholdBudget(onSuccess?: () => Promise<void> | void) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createHouseholdBudget = async (input: CreateHouseholdBudgetInput) => {
    setIsSubmitting(true);
    try {
      await financeService.createBudget({
        ...input,
        context: "household"
      });
      await onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, createHouseholdBudget };
}
