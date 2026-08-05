import type { TransactionDto } from "../types";

export const MOCK_PERSONAL_TRANSACTIONS: TransactionDto[] = [
  {
    id: "ptx-1",
    amount: 5_000_000,
    type: "income",
    category: "ingresos",
    description: "Salario",
    date: "2026-08-01",
    context: "personal",
    ownerId: "usr-carlos",
    createdAt: "2026-08-01T09:00:00.000Z"
  },
  {
    id: "ptx-2",
    amount: 350_000,
    type: "expense",
    category: "alimentacion",
    description: "Mercado",
    date: "2026-08-02",
    context: "personal",
    ownerId: "usr-carlos",
    createdAt: "2026-08-02T18:20:00.000Z"
  },
  {
    id: "ptx-3",
    amount: 45_000,
    type: "expense",
    category: "entretenimiento",
    description: "Netflix",
    date: "2026-08-03",
    context: "personal",
    ownerId: "usr-carlos",
    createdAt: "2026-08-03T08:10:00.000Z"
  },
  {
    id: "ptx-4",
    amount: 105_000,
    type: "expense",
    category: "entretenimiento",
    description: "Conciertos y salidas",
    date: "2026-07-28",
    context: "personal",
    ownerId: "usr-carlos",
    createdAt: "2026-07-28T22:00:00.000Z"
  },
  {
    id: "ptx-5",
    amount: 220_000,
    type: "expense",
    category: "transporte",
    description: "Gasolina y peajes",
    date: "2026-07-25",
    context: "personal",
    ownerId: "usr-carlos",
    createdAt: "2026-07-25T13:00:00.000Z"
  },
  {
    id: "ptx-6",
    amount: 480_000,
    type: "expense",
    category: "tecnologia",
    description: "Monitor externo",
    date: "2026-07-20",
    context: "personal",
    ownerId: "usr-carlos",
    createdAt: "2026-07-20T16:40:00.000Z"
  },
  {
    id: "ptx-7",
    amount: 250_000,
    type: "income",
    category: "ingresos",
    description: "Proyecto freelance",
    date: "2026-07-18",
    context: "personal",
    ownerId: "usr-carlos",
    createdAt: "2026-07-18T11:00:00.000Z"
  }
];
