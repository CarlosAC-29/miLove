import { APP_CONFIG } from "@/app/config/app.config";

/** Formateo de moneda y fechas, centralizado para toda la app. */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(APP_CONFIG.locale, {
    style: "currency",
    currency: APP_CONFIG.currency,
    maximumFractionDigits: 0
  }).format(value);
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(APP_CONFIG.locale, {
    day: "2-digit",
    month: "short"
  }).format(parseDateOnly(iso));
}

export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat(APP_CONFIG.locale, {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(parseDateOnly(iso));
}
