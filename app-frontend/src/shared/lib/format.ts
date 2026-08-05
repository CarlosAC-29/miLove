import { APP_CONFIG } from "@/app/config/app.config";

/** Formateo de moneda y fechas, centralizado para toda la app. */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(APP_CONFIG.locale, {
    style: "currency",
    currency: APP_CONFIG.currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(APP_CONFIG.locale, {
    day: "2-digit",
    month: "short"
  }).format(new Date(iso));
}

export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat(APP_CONFIG.locale, {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date(iso));
}
