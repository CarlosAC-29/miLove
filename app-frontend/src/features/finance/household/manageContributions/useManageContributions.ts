import { useState } from "react";
import { financeService } from "@/services/finance/finance.service";

export function useManageContributions(onSuccess?: () => Promise<void> | void) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateContribution = async (memberId: string, amount: number) => {
    setIsSubmitting(true);
    try {
      await financeService.updateContribution(memberId, amount);
      await onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, updateContribution };
}
