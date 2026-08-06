import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { plansService, type PlanDto } from "@/services/plans.service";
import { useAuthStore } from "@/stores/auth.store";
import { Screen } from "@/shared/ui/Screen";
import { SectionTitle, SurfaceCard } from "@/shared/ui/SurfaceCard";

const PLANS_KEY = ["plans", "calendar"] as const;

function toDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDayKeyFromIso(isoDate: string): string {
  return toDayKey(new Date(isoDate));
}

function categoryLabel(category: string): string {
  switch (category) {
    case "date":
      return "Cita";
    case "gift":
      return "Regalo";
    case "restaurant":
      return "Restaurante";
    case "activity":
      return "Película";
    case "trip":
      return "Viaje";
    default:
      return "Plan";
  }
}

export function PlansPage() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [ownerFilter, setOwnerFilter] = useState<"all" | "mine" | "partner">("all");

  const plansQuery = useQuery({
    queryKey: PLANS_KEY,
    queryFn: () => plansService.listPlans(),
    refetchInterval: 5000
  });

  const filteredPlans = useMemo(() => {
    const list = plansQuery.data ?? [];
    if (ownerFilter === "all") return list;
    if (!currentUserId) return list;
    return list.filter((plan) => {
      const ownerId = plan.owner?.id;
      if (!ownerId) return false;
      return ownerFilter === "mine" ? ownerId === currentUserId : ownerId !== currentUserId;
    });
  }, [currentUserId, ownerFilter, plansQuery.data]);

  const plansByDay = useMemo(() => {
    const grouped = new Map<string, PlanDto[]>();
    for (const plan of filteredPlans) {
      const key = toDayKeyFromIso(plan.startAt);
      const current = grouped.get(key) ?? [];
      current.push(plan);
      grouped.set(key, current);
    }
    return grouped;
  }, [filteredPlans]);

  const selectedDayKey = toDayKey(selectedDay);
  const selectedDayPlans = plansByDay.get(selectedDayKey) ?? [];
  const daysWithPlans = useMemo(
    () => [...plansByDay.keys()].map((dayKey) => new Date(`${dayKey}T00:00:00`)),
    [plansByDay]
  );

  return (
    <Screen title="Planes" subtitle="Calendario compartido con sugerencias aceptadas">
      <div className="mb-3 flex items-center gap-2">
        <Button type="button" size="sm" variant={ownerFilter === "all" ? "default" : "outline"} onClick={() => setOwnerFilter("all")}>
          Todas
        </Button>
        <Button type="button" size="sm" variant={ownerFilter === "mine" ? "default" : "outline"} onClick={() => setOwnerFilter("mine")}>
          Subidas por mí
        </Button>
        <Button type="button" size="sm" variant={ownerFilter === "partner" ? "default" : "outline"} onClick={() => setOwnerFilter("partner")}>
          Subidas por mi pareja
        </Button>
      </div>
      <SurfaceCard>
        <SectionTitle>Calendario</SectionTitle>
        <Calendar
          mode="single"
          selected={selectedDay}
          onSelect={(day) => {
            if (day) setSelectedDay(day);
          }}
          modifiers={{ hasPlans: daysWithPlans }}
          modifiersClassNames={{
            hasPlans: "bg-primary/10 rounded-md font-semibold text-primary"
          }}
          className="w-full"
        />
      </SurfaceCard>

      <div className="mt-6">
        <SectionTitle>Planes del día</SectionTitle>
        <div className="space-y-3">
          {plansQuery.isLoading ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">Cargando planes...</p>
            </SurfaceCard>
          ) : selectedDayPlans.length === 0 ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">No hay planes aceptados para este día.</p>
            </SurfaceCard>
          ) : (
            selectedDayPlans
              .slice()
              .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
              .map((plan) => (
                <SurfaceCard key={plan.id}>
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {categoryLabel(plan.category)}
                  </p>
                  <h3 className="mt-1 text-base">{plan.title}</h3>
                  {plan.description ? (
                    <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(plan.startAt).toLocaleString()}
                  </p>
                  {plan.owner?.name ? (
                    <p className="mt-2 text-xs text-muted-foreground text-right">
                      Compartido por: {plan.owner.name}
                    </p>
                  ) : null}
                </SurfaceCard>
              ))
          )}
        </div>
      </div>
    </Screen>
  );
}
