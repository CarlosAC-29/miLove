import type { AuthProvider, User } from "../types";

/** Iniciales para el avatar de respaldo. */
export function getUserInitials(user: Pick<User, "name">): string {
  return user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const PROVIDER_LABELS: Record<AuthProvider, string> = {
  google: "Google",
  apple: "Apple",
  email: "Email",
};

export function getProviderLabel(provider: AuthProvider): string {
  return PROVIDER_LABELS[provider];
}
