import { env } from "@/app/config/env";
import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";
import { createDemoStore } from "@/services/demo/demo-store";

export interface AppointmentDto {
  id: string;
  title: string;
  description?: string | null;
  startAt: string; // ISO
  endAt?: string | null;
  owner?: { id: string; name?: string } | null;
}

export interface UpsertAppointmentInput {
  title: string;
  description?: string;
  startAt: string;
}

const demoAppointments = createDemoStore<AppointmentDto>([
  {
    id: "demo-date-1",
    title: "Picnic al atardecer",
    description: "Llevar una manta y algo para compartir.",
    startAt: "2026-10-18T17:30:00.000Z",
    owner: { id: "usr-carlos", name: "Carlos Rivera" }
  }
]);

export const datesService = {
  async listAppointments(): Promise<AppointmentDto[]> {
    if (env.useMocks) return demoAppointments.list();
    return apiClient.get<AppointmentDto[]>(API_ROUTES.dates.list);
  },

  async createAppointment(input: UpsertAppointmentInput): Promise<AppointmentDto> {
    if (env.useMocks) {
      return demoAppointments.create({
        ...input,
        owner: { id: "usr-carlos", name: "Carlos Rivera" }
      });
    }
    return apiClient.post<AppointmentDto>(API_ROUTES.dates.list, input);
  },

  async updateAppointment(id: string, input: UpsertAppointmentInput): Promise<AppointmentDto> {
    if (env.useMocks) return demoAppointments.update(id, input);
    return apiClient.put<AppointmentDto>(API_ROUTES.dates.byId(id), input);
  },

  async deleteAppointment(id: string): Promise<void> {
    if (env.useMocks) {
      demoAppointments.remove(id);
      return;
    }
    await apiClient.delete<void>(API_ROUTES.dates.byId(id));
  }
};
