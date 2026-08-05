import { useState } from "react";
import { financeService } from "@/services/finance/finance.service";

interface CreateSharedGoalInput {
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
}

export function useCreateSharedGoal(onSuccess?: () => Promise<void> | void) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createSharedGoal = async (input: CreateSharedGoalInput) => {
    setIsSubmitting(true);
    try {
      await financeService.createGoal({
        ...input,
        context: "household"
      });
      await onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, createSharedGoal };
}
