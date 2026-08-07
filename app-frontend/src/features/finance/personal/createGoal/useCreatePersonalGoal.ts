import { useState } from "react";
import { financeService } from "@/services/finance/finance.service";

interface CreatePersonalGoalInput {
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  isShared?: boolean;
}

export function useCreatePersonalGoal(onSuccess?: () => Promise<void> | void) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPersonalGoal = async (input: CreatePersonalGoalInput) => {
    setIsSubmitting(true);
    try {
      await financeService.createGoal({
        ...input,
        context: "personal"
      });
      await onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, createPersonalGoal };
}
