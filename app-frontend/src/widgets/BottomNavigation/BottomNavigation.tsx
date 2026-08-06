import { Link } from "@tanstack/react-router";
import { Clapperboard, Gift, Heart, Home, UserRound, Wallet } from "lucide-react";

const ITEMS = [
  { to: "/home", label: "Inicio", icon: Home, exact: true },
  // { to: "/finance", label: "Finanzas", icon: Wallet, exact: false },
  // { to: "/dates", label: "Citas", icon: Heart, exact: false },
  // { to: "/gifts", label: "Regalos", icon: Gift, exact: false },
  // { to: "/movies", label: "Cine", icon: Clapperboard, exact: false },
  { to: "/profile", label: "Perfil", icon: UserRound, exact: false }
] as const;

/** Barra de navegación inferior, estilo app nativa. */
export function BottomNavigation() {
  return (
    <nav
      suppressHydrationWarning
      className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/85 pt-2 backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-center gap-16 px-3">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                activeOptions={{ exact: item.exact }}
                activeProps={{ className: "text-primary" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="pressable flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium"
              >
                <Icon className="size-5" strokeWidth={2} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}