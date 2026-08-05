import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Tarjeta base del design system. */
export function SurfaceCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("surface-card p-5", className)}>{children}</div>;
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        "mb-3 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase",
        className
      )}
    >
      {children}
    </h2>
  );
}
