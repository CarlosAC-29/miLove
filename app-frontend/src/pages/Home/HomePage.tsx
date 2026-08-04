import { Moon, Sun } from "lucide-react";
import { usePreferencesStore } from "@/shared/store/preferences.store";
import { MODULES } from "@/shared/constants/modules";
import { Screen } from "@/shared/ui/Screen";
import { SectionTitle } from "@/shared/ui/SurfaceCard";
import { ModuleCard } from "@/widgets/ModuleCard/ModuleCard";
import { AIRecommendation } from "@/widgets/AIRecommendation/AIRecommendation";

/** Página Home: solo compone widgets, sin lógica de negocio. */
export function HomePage() {
  const coupleName = usePreferencesStore((s) => s.coupleName);
  const theme = usePreferencesStore((s) => s.theme);
  const setTheme = usePreferencesStore((s) => s.setTheme);

  return (
    <Screen
      title={coupleName}
      subtitle="Su ecosistema en pareja, en un solo lugar"
      action={
        <button
          type="button"
          aria-label="Cambiar tema"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="pressable flex size-10 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      }
    >
      <AIRecommendation />

      <div className="mt-8">
        <SectionTitle>Módulos</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {MODULES.map((module, index) => (
            <ModuleCard key={module.id} module={module} index={index} />
          ))}
        </div>
      </div>
    </Screen>
  );
}
