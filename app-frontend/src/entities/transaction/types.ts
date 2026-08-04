/** Espacio financiero: privado del usuario o compartido con la pareja. */
export type FinanceContext = "personal" | "household";

export type TransactionType = "income" | "expense";

export interface TransactionDto {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
  context: FinanceContext;
  ownerId: string;
  createdAt: string;
}

export interface Transaction {
  readonly id: string;
  readonly amount: number;
  readonly type: TransactionType;
  readonly category: string;
  readonly description: string;
  readonly date: string;
  readonly context: FinanceContext;
  readonly ownerId: string;
  readonly createdAt: string;
}

export interface CreateTransactionInput {
  readonly amount: number;
  readonly type: TransactionType;
  readonly category: string;
  readonly description: string;
  readonly date: string;
  readonly context: FinanceContext;
  readonly ownerId: string;
}

export function mapTransaction(dto: TransactionDto): Transaction {
  return { ...dto };
}

/** Resumen mensual derivado de las transacciones del espacio. */
export interface FinanceSummary {
  readonly income: number;
  readonly expenses: number;
  readonly savings: number;
  readonly balance: number;
}

export function buildSummary(transactions: readonly Transaction[]): FinanceSummary {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((total, t) => total + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((total, t) => total + t.amount, 0);

  return { income, expenses, savings: income - expenses, balance: income - expenses };
}
