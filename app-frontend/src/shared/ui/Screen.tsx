import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScreenProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Contenedor estándar de página: encabezado + contenido, mobile-first. */
export function Screen({ title, subtitle, action, children, className }: ScreenProps) {
  return (
    <div className={cn("mx-auto w-full max-w-xl px-5 pb-28", className)}>
      <header className="safe-top flex items-start justify-between gap-4 pt-4 pb-6">
        <div>
          <h1 className="text-3xl leading-tight">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </div>
  );
}
