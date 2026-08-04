import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";

interface PreferencesState {
  theme: ThemeMode;
  coupleName: string;
  monthlyBudget: number;
  setTheme: (theme: ThemeMode) => void;
  setCoupleName: (name: string) => void;
  setMonthlyBudget: (value: number) => void;
}

/**
 * Estado global de preferencias (tema, pareja, configuración).
 * Persistido en localStorage; la hidratación se maneja en el ThemeProvider
 * para evitar desajustes con el render del servidor.
 */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: "system",
      coupleName: "Ana & Leo",
      monthlyBudget: 2_400_000,
      setTheme: (theme) => set({ theme }),
      setCoupleName: (coupleName) => set({ coupleName }),
      setMonthlyBudget: (monthlyBudget) => set({ monthlyBudget }),
    }),
    { name: "milove.preferences" },
  ),
);
