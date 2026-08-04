import { useState } from "react";
import { financeService } from "@/services/finance/finance.service";

export function useDeletePersonalTransaction(onSuccess?: () => Promise<void> | void) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deletePersonalTransaction = async (transactionId: string) => {
    setIsSubmitting(true);
    try {
      await financeService.deleteTransaction(transactionId);
      await onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, deletePersonalTransaction };
}
