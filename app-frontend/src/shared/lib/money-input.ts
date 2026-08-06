import { APP_CONFIG } from "@/app/config/app.config";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatMoneyInput(value: string): string {
  const normalized = digitsOnly(value);
  if (normalized.length === 0) return "";
  return new Intl.NumberFormat(APP_CONFIG.locale, {
    maximumFractionDigits: 0
  }).format(Number(normalized));
}

export function parseMoneyInput(value: string): number {
  const normalized = digitsOnly(value);
  if (normalized.length === 0) return Number.NaN;
  return Number(normalized);
}
