import { useState } from "react";
import type { CreateTransactionInput } from "@/entities/transaction/types";
import { financeService } from "@/services/finance/finance.service";

export function useEditSharedExpense(onSuccess?: () => Promise<void> | void) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editSharedExpense = async (
    transactionId: string,
    changes: Partial<Omit<CreateTransactionInput, "context">>
  ) => {
    setIsSubmitting(true);
    try {
      await financeService.updateTransaction(transactionId, { ...changes, context: "household" });
      await onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, editSharedExpense };
}
