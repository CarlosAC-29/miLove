import { useState } from "react";
import type { CreateTransactionInput } from "@/entities/transaction/types";
import { financeService } from "@/services/finance/finance.service";

interface AddSharedExpenseInput extends Omit<CreateTransactionInput, "context"> {}

export function useAddSharedExpense(onSuccess?: () => Promise<void> | void) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addSharedExpense = async (input: AddSharedExpenseInput) => {
    setIsSubmitting(true);
    try {
      await financeService.createTransaction({
        ...input,
        context: "household",
      });
      await onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, addSharedExpense };
}
