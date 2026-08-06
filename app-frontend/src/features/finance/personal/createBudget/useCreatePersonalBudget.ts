import { useState } from "react";
import { financeService } from "@/services/finance/finance.service";

interface CreatePersonalBudgetInput {
  name: string;
  categoryId: string;
  amount: number;
  month: string;
}

export function useCreatePersonalBudget(onSuccess?: () => Promise<void> | void) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPersonalBudget = async (input: CreatePersonalBudgetInput) => {
    setIsSubmitting(true);
    try {
      await financeService.createBudget({
        ...input,
        context: "personal"
      });
      await onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, createPersonalBudget };
}
