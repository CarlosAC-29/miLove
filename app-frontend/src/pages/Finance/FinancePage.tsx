import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Screen } from "@/shared/ui/Screen";
import { SurfaceCard } from "@/shared/ui/SurfaceCard";
import { FinanceDashboard } from "@/widgets/FinanceDashboard/FinanceDashboard";

const MONTH_OPTIONS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" }
] as const;

function buildYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 8 }, (_, index) => String(currentYear - 5 + index));
}

export function FinancePage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, selectedMonth] = month.split("-");
  const yearOptions = buildYearOptions();

  return (
    <Screen
      title="Finanzas"
      subtitle="Controla presupuesto, gastos e ingresos por mes"
    >
      <div className="space-y-4">
        <SurfaceCard className="space-y-3">
          <h2 className="text-sm font-semibold">Selecciona el periodo</h2>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={selectedMonth}
              onValueChange={(value) => setMonth(`${selectedYear}-${value}`)}
            >
              <SelectTrigger className="h-11 rounded-xl bg-surface">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedYear}
              onValueChange={(value) => setMonth(`${value}-${selectedMonth}`)}
            >
              <SelectTrigger className="h-11 rounded-xl bg-surface">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SurfaceCard>

        <FinanceDashboard context="personal" month={month} />
      </div>
    </Screen>
  );
}
