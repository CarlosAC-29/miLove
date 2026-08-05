import { useState } from "react";
import type { CreateTransactionInput } from "@/entities/transaction/types";
import { financeService } from "@/services/finance/finance.service";

interface AddPersonalTransactionInput extends Omit<CreateTransactionInput, "context" | "ownerId"> {
  ownerId?: string;
}

export function useAddPersonalTransaction(onSuccess?: () => Promise<void> | void) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addPersonalTransaction = async (input: AddPersonalTransactionInput) => {
    setIsSubmitting(true);
    try {
      await financeService.createTransaction({
        ...input,
        context: "personal",
        ownerId: input.ownerId ?? "usr-carlos"
      });
      await onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, addPersonalTransaction };
}
