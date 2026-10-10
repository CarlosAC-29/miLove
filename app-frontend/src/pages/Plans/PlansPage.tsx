import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { datesService } from "@/services/dates.service";
import { plansService, type PlanDto } from "@/services/plans.service";
import { useAuthStore } from "@/stores/auth.store";
import { Screen } from "@/shared/ui/Screen";
import { SectionTitle, SurfaceCard } from "@/shared/ui/SurfaceCard";

const CALENDAR_KEY = ["calendar"] as const;
const PLANS_PER_PAGE = 20;

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
  const [isPlansDialogOpen, setIsPlansDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const calendarRef = useRef<HTMLDivElement>(null);

  const calendarQuery = useQuery({
    queryKey: CALENDAR_KEY,
    queryFn: async () => {
      const [plans, appointments] = await Promise.all([
        plansService.listPlans(),
        datesService.listAppointments()
      ]);
      return [
        ...plans,
        ...appointments.map((appointment): PlanDto => ({ ...appointment, category: "date" }))
      ];
    },
    refetchInterval: 5000
  });

  const filteredPlans = useMemo(() => {
    const list = calendarQuery.data ?? [];
    if (ownerFilter === "all") return list;
    if (!currentUserId) return list;
    return list.filter((plan) => {
      const ownerId = plan.owner?.id;
      if (!ownerId) return false;
      return ownerFilter === "mine" ? ownerId === currentUserId : ownerId !== currentUserId;
    });
  }, [currentUserId, ownerFilter, calendarQuery.data]);

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
  const allPlans = useMemo(
    () =>
      filteredPlans
        .slice()
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [filteredPlans]
  );
  const categoryOptions = useMemo(
    () =>
      [...new Set(allPlans.map((plan) => plan.category))].sort((a, b) =>
        categoryLabel(a).localeCompare(categoryLabel(b))
      ),
    [allPlans]
  );
  const matchingPlans = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    return allPlans.filter((plan) => {
      const matchesSearch =
        !normalizedSearch ||
        plan.title.toLocaleLowerCase().includes(normalizedSearch) ||
        plan.description?.toLocaleLowerCase().includes(normalizedSearch);
      const matchesDate = !dateFilter || toDayKeyFromIso(plan.startAt) === dateFilter;
      const matchesCategory = categoryFilter === "all" || plan.category === categoryFilter;
      return matchesSearch && matchesDate && matchesCategory;
    });
  }, [allPlans, categoryFilter, dateFilter, searchTerm]);
  const totalPages = Math.max(1, Math.ceil(matchingPlans.length / PLANS_PER_PAGE));
  const paginatedPlans = matchingPlans.slice(
    (currentPage - 1) * PLANS_PER_PAGE,
    currentPage * PLANS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, categoryFilter, ownerFilter]);

  const selectPlanDay = (plan: PlanDto) => {
    setSelectedDay(new Date(plan.startAt));
    setIsPlansDialogOpen(false);
    requestAnimationFrame(() => {
      calendarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <Screen title="Planes" subtitle="Calendario compartido con sugerencias aceptadas">
      <div className="mb-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        <Button
          className="w-full sm:w-auto"
          type="button"
          size="sm"
          variant={ownerFilter === "all" ? "default" : "outline"}
          onClick={() => setOwnerFilter("all")}
        >
          Todas
        </Button>
        <Button
          className="w-full sm:w-auto"
          type="button"
          size="sm"
          variant={ownerFilter === "mine" ? "default" : "outline"}
          onClick={() => setOwnerFilter("mine")}
        >
          Subidas por mí
        </Button>
        <Button
          className="w-full sm:w-auto"
          type="button"
          size="sm"
          variant={ownerFilter === "partner" ? "default" : "outline"}
          onClick={() => setOwnerFilter("partner")}
        >
          Subidas por mi pareja
        </Button>
      </div>
      <div ref={calendarRef}>
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
              hasPlans:
                "rounded-md bg-success/15 font-semibold text-success hover:bg-success/25 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground"
            }}
            className="mx-auto max-w-sm [--cell-size:2.25rem] sm:[--cell-size:2.5rem]"
          />
        </SurfaceCard>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <SectionTitle>Planes del día</SectionTitle>
          <Dialog open={isPlansDialogOpen} onOpenChange={setIsPlansDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="sm" variant="outline">
                Ver todos los planes
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Todos los planes</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por título o detalle"
                />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category} value={category}>
                        {categoryLabel(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                  type="date"
                  className="sm:col-span-2"
                />
              </div>
              {matchingPlans.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay planes para mostrar.</p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    {matchingPlans.length}{" "}
                    {matchingPlans.length === 1 ? "plan encontrado" : "planes encontrados"}
                  </p>
                  <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
                    {paginatedPlans.map((plan) => (
                      <Button
                        key={plan.id}
                        type="button"
                        variant="outline"
                        className="h-auto w-full justify-start px-3 py-2 text-left whitespace-normal"
                        onClick={() => selectPlanDay(plan)}
                      >
                        <span>
                          <span className="block text-xs text-muted-foreground">
                            {new Date(plan.startAt).toLocaleDateString()}
                          </span>
                          <span className="block text-sm">{plan.title}</span>
                        </span>
                      </Button>
                    ))}
                  </div>
                  {totalPages > 1 ? (
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((page) => page - 1)}
                      >
                        Anterior
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Página {currentPage} de {totalPages}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((page) => page + 1)}
                      >
                        Siguiente
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-3">
          {calendarQuery.isLoading ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">Cargando planes...</p>
            </SurfaceCard>
          ) : selectedDayPlans.length === 0 ? (
            <SurfaceCard>
              <p className="text-sm text-muted-foreground">
                No hay planes aceptados para este día.
              </p>
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
