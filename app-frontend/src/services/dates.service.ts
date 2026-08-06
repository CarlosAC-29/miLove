import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";

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

export const datesService = {
  async listAppointments(): Promise<AppointmentDto[]> {
    return apiClient.get<AppointmentDto[]>(API_ROUTES.dates.list);
  },

  async createAppointment(input: UpsertAppointmentInput): Promise<AppointmentDto> {
    return apiClient.post<AppointmentDto>(API_ROUTES.dates.list, input);
  },

  async updateAppointment(id: string, input: UpsertAppointmentInput): Promise<AppointmentDto> {
    return apiClient.put<AppointmentDto>(API_ROUTES.dates.byId(id), input);
  },

  async deleteAppointment(id: string): Promise<void> {
    await apiClient.delete<void>(API_ROUTES.dates.byId(id));
  }
};
