import { useState } from "react";
import type { CreateTransactionInput } from "@/entities/transaction/types";
import { financeService } from "@/services/finance/finance.service";

export function useEditPersonalTransaction(onSuccess?: () => Promise<void> | void) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editPersonalTransaction = async (
    transactionId: string,
    changes: Partial<Omit<CreateTransactionInput, "context">>,
  ) => {
    setIsSubmitting(true);
    try {
      await financeService.updateTransaction(transactionId, { ...changes, context: "personal" });
      await onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, editPersonalTransaction };
}
