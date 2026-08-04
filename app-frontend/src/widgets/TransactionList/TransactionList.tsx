import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCategory } from "@/entities/category/types";
import type { Transaction } from "@/entities/transaction/types";
import { formatCurrency, formatDate } from "@/shared/lib/format";
import { SurfaceCard } from "@/shared/ui/SurfaceCard";

interface TransactionListProps {
  transactions: readonly Transaction[];
  onDelete?: (transactionId: string) => Promise<void>;
  onEdit?: (transaction: Transaction) => Promise<void>;
}

export function TransactionList({ transactions, onDelete, onEdit }: TransactionListProps) {
  const rows = transactions.slice(0, 6);
  return (
    <SurfaceCard className="space-y-3">
      <h3 className="text-sm font-semibold">Ultimas transacciones</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aun no hay transacciones.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((transaction) => {
            const isIncome = transaction.type === "income";
            return (
              <li
                key={transaction.id}
                className="flex items-center justify-between rounded-xl border border-border/70 bg-surface px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold">{transaction.description}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {getCategory(transaction.category).name} · {formatDate(transaction.date)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <p className={isIncome ? "text-sm font-semibold text-success" : "text-sm font-semibold text-foreground"}>
                    {isIncome ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                  {onEdit ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => void onEdit(transaction)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  ) : null}
                  {onDelete ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => void onDelete(transaction.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SurfaceCard>
  );
}
