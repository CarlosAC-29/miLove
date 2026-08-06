/** Espacio financiero: privado del usuario o compartido con la pareja. */
export type FinanceContext = "personal" | "household";

export type TransactionType = "income" | "expense";

export interface TransactionDto {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  isFixed: boolean;
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
  readonly isFixed: boolean;
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
  readonly isFixed?: boolean;
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
  readonly fixedExpenses: number;
  readonly savings: number;
  readonly balance: number;
}

export function buildSummary(transactions: readonly Transaction[]): FinanceSummary {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((total, t) => total + t.amount, 0);

  const fixedExpenses = transactions
    .filter((t) => t.type === "expense" && t.isFixed && t.category !== "ahorro")
    .reduce((total, t) => total + t.amount, 0);

  const variableExpenses = transactions
    .filter((t) => t.type === "expense" && !t.isFixed && t.category !== "ahorro")
    .reduce((total, t) => total + t.amount, 0);

  const savings = transactions
    .filter((t) => t.type === "expense" && t.category === "ahorro")
    .reduce((total, t) => total + t.amount, 0);

  const expenses = fixedExpenses + variableExpenses;
  const balance = income - expenses - savings;

  return { income, expenses, fixedExpenses, savings, balance };
}
