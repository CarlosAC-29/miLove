import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { FinanceContext } from "@/entities/transaction/types";
import { Screen } from "@/shared/ui/Screen";
import { SurfaceCard } from "@/shared/ui/SurfaceCard";
import { FinanceDashboard } from "@/widgets/FinanceDashboard/FinanceDashboard";

export function FinancePage() {
  const [context, setContext] = useState<FinanceContext>("personal");

  return (
    <Screen
      title="Finanzas"
      subtitle="Controla tu dinero personal y del hogar sin mezclar contextos"
    >
      <div className="space-y-4">
        <SurfaceCard className="space-y-3">
          <h2 className="text-sm font-semibold">Selecciona el espacio</h2>
          <div className="grid grid-cols-1 gap-2">
            <Button
              type="button"
              variant={context === "personal" ? "default" : "outline"}
              className="h-11 justify-start rounded-xl"
              onClick={() => setContext("personal")}
            >
              👤 Mis Finanzas
            </Button>
            <Button
              type="button"
              variant={context === "household" ? "default" : "outline"}
              className="h-11 justify-start rounded-xl"
              onClick={() => setContext("household")}
            >
              🏠 Finanzas Hogar
            </Button>
          </div>
        </SurfaceCard>

        <FinanceDashboard context={context} />
      </div>
    </Screen>
  );
}
